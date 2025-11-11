export class UpdateManager {
    constructor(app) {
        this.app = app;
        this.update_available = false;
        this.latest_release = null;
    }

    check_for_updates_on_startup() {
        let session = new Soup.Session();
        let message = Soup.Message.new('GET', 'https://api.github.com/repos/cloudglides/kiru/releases/latest');

        session.send_message(message);
        if (message.status_code === 200) {
            try {
                let data = JSON.parse(message.response_body.data);
                let latest_version = data.tag_name.replace('v', '');
                if (latest_version > this.app.current_version) {
                    this.update_available = true;
                    this.latest_release = data;
                    console.log('Update available:', latest_version);
                } else {
                    this.update_available = false;
                }
            } catch (e) {
                console.log('Error checking updates:', e);
                this.update_available = false;
            }
        } else {
            console.log('Failed to check updates');
            this.update_available = false;
        }
    }

    handle_update() {
        if (this.update_available) {
            this.perform_update();
        } else {
            this.check_for_updates();
        }
    }

    check_for_updates() {
        console.log('Checking for updates...');
        let session = new Soup.Session();
        let message = Soup.Message.new('GET', 'https://api.github.com/repos/cloudglides/kiru/releases/latest');

        session.send_message(message);
        if (message.status_code === 200) {
            try {
                let data = JSON.parse(message.response_body.data);
                let latest_version = data.tag_name.replace('v', '');
                if (latest_version > this.app.current_version) {
                    let dialog = new Gtk.MessageDialog({
                        transient_for: this.app.window,
                        modal: true,
                        message_type: Gtk.MessageType.INFO,
                        buttons: Gtk.ButtonsType.YES_NO,
                        text: `New version available: ${latest_version}\n\nDo you want to download and install it?`
                    });
                    let response = dialog.run();
                    dialog.destroy();
                    if (response === Gtk.ResponseType.YES) {
                        this.latest_release = data;
                        this.perform_update();
                    }
                } else {
                    let dialog = new Gtk.MessageDialog({
                        transient_for: this.app.window,
                        modal: true,
                        message_type: Gtk.MessageType.INFO,
                        buttons: Gtk.ButtonsType.OK,
                        text: 'You are using the latest version.'
                    });
                    dialog.run();
                    dialog.destroy();
                }
            } catch (e) {
                console.log('Error parsing GitHub API response:', e);
                let dialog = new Gtk.MessageDialog({
                    transient_for: this.app.window,
                    modal: true,
                    message_type: Gtk.MessageType.ERROR,
                    buttons: Gtk.ButtonsType.OK,
                    text: 'Failed to check for updates.'
                });
                dialog.run();
                dialog.destroy();
            }
        } else {
            console.log('GitHub API request failed:', message.status_code);
            let dialog = new Gtk.MessageDialog({
                transient_for: this.app.window,
                modal: true,
                message_type: Gtk.MessageType.ERROR,
                buttons: Gtk.ButtonsType.OK,
                text: 'Failed to check for updates. Check your internet connection.'
            });
            dialog.run();
            dialog.destroy();
        }
    }

    perform_update() {
        let is_appimage = GLib.getenv('APPIMAGE') !== null;
        let asset_name_pattern = is_appimage ? /kiru-.*\.AppImage/ : (this.detect_package_manager() === 'rpm' ? /kiru-.*\.rpm/ : /kiru_.*\.deb/);
        let asset_url = null;

        for (let asset of this.latest_release.assets) {
            if (asset_name_pattern.test(asset.name)) {
                asset_url = asset.browser_download_url;
                break;
            }
        }

        if (!asset_url) {
            let dialog = new Gtk.MessageDialog({
                transient_for: this.app.window,
                modal: true,
                message_type: Gtk.MessageType.ERROR,
                buttons: Gtk.ButtonsType.OK,
                text: 'No compatible update package found.'
            });
            dialog.run();
            dialog.destroy();
            return;
        }

        let download_path = GLib.get_tmp_dir() + '/kiru_update';
        let download_cmd = `wget -O "${download_path}" "${asset_url}"`;

        let dialog = new Gtk.MessageDialog({
            transient_for: this.app.window,
            modal: true,
            message_type: Gtk.MessageType.INFO,
            buttons: Gtk.ButtonsType.OK,
            text: 'Downloading update...\nThis may take a few moments.'
        });
        dialog.show();

        // Download update
        let [success, stdout, stderr] = GLib.spawn_command_line_sync(download_cmd);
        dialog.destroy();

        if (!success) {
            let error_dialog = new Gtk.MessageDialog({
                transient_for: this.app.window,
                modal: true,
                message_type: Gtk.MessageType.ERROR,
                buttons: Gtk.ButtonsType.OK,
                text: 'Failed to download update.'
            });
            error_dialog.run();
            error_dialog.destroy();
            return;
        }

        if (is_appimage) {
            // Replace AppImage
            let appimage_path = GLib.getenv('APPIMAGE');
            let install_cmd = `chmod +x "${download_path}" && mv "${download_path}" "${appimage_path}" && exec "${appimage_path}"`;
            GLib.spawn_command_line_async(install_cmd);
            this.app.window.destroy();
        } else {
            // Install deb/rpm
            let package_type = this.detect_package_manager();
            let install_cmd = package_type === 'rpm' ?
                `sudo rpm -U "${download_path}"` :
                `sudo dpkg -i "${download_path}"`;
            let [install_success, install_stdout, install_stderr] = GLib.spawn_command_line_sync(install_cmd);
            if (install_success) {
                let success_dialog = new Gtk.MessageDialog({
                    transient_for: this.app.window,
                    modal: true,
                    message_type: Gtk.MessageType.INFO,
                    buttons: Gtk.ButtonsType.OK,
                    text: 'Update installed successfully!\nPlease restart the application.'
                });
                success_dialog.run();
                success_dialog.destroy();
                this.app.window.destroy();
            } else {
                console.log('Install stderr:', install_stderr);
                let error_dialog = new Gtk.MessageDialog({
                    transient_for: this.app.window,
                    modal: true,
                    message_type: Gtk.MessageType.ERROR,
                    buttons: Gtk.ButtonsType.OK,
                    text: 'Failed to install update. Check system logs for details.'
                });
                error_dialog.run();
                error_dialog.destroy();
            }
            GLib.spawn_command_line_sync(`rm "${download_path}"`);
        }
    }

    detect_package_manager() {
        // Simple detection: check if rpm or dpkg is available
        let [rpm_success] = GLib.spawn_command_line_sync('which rpm');
        return rpm_success ? 'rpm' : 'deb';
    }
}
