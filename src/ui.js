export class UIManager {
    constructor(app) {
        this.app = app;
    }

    init_ui() {
        this.app.window = new Gtk.Window({title: "Kiru - Monitoring Screenshots"});
        this.app.window.set_default_size(400, 350);

        let box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, spacing: 10});
        box.set_margin_top(20);
        box.set_margin_bottom(20);
        box.set_margin_start(20);
        box.set_margin_end(20);

        let label = new Gtk.Label({label: "Monitoring ~/Pictures/Screenshots for new screenshots.\nTake a screenshot with gnome-screenshot to edit."});
        label.set_line_wrap(true);
        box.pack_start(label, false, false, 0);

        // Update button
        this.app.update_btn = new Gtk.Button({label: this.app.updateManager.update_available ? "Update Available!" : "Check for Updates"});
        this.app.update_btn.connect("clicked", () => this.app.updateManager.handle_update());
        box.pack_start(this.app.update_btn, false, false, 0);

        // Settings
        let settings_label = new Gtk.Label({label: "Settings:"});
        settings_label.set_markup("<b>Settings:</b>");
        box.pack_start(settings_label, false, false, 0);

        this.app.auto_delete_check = new Gtk.CheckButton({label: "Auto-delete screenshots from gallery after editing"});
        this.app.auto_delete_check.set_active(this.app.config.auto_delete || false);
        this.app.auto_delete_check.connect('toggled', () => { this.app.config.auto_delete = this.app.auto_delete_check.get_active(); this.app.configManager.save_config(); });
        box.pack_start(this.app.auto_delete_check, false, false, 0);

        this.app.copy_clipboard_check = new Gtk.CheckButton({label: "Copy uploaded URL to clipboard"});
        this.app.copy_clipboard_check.set_active(this.app.config.copy_clipboard !== false);
        this.app.copy_clipboard_check.connect('toggled', () => { this.app.config.copy_clipboard = this.app.copy_clipboard_check.get_active(); this.app.configManager.save_config(); });
        box.pack_start(this.app.copy_clipboard_check, false, false, 0);

        this.app.auto_upload_check = new Gtk.CheckButton({label: "Auto-upload edited screenshots"});
        this.app.auto_upload_check.set_active(this.app.config.auto_upload || false);
        this.app.auto_upload_check.connect('toggled', () => { this.app.config.auto_upload = this.app.config.auto_upload_check.get_active(); this.app.configManager.save_config(); });
        box.pack_start(this.app.auto_upload_check, false, false, 0);

        this.app.auto_upload_no_edit_check = new Gtk.CheckButton({label: "Auto-upload screenshots without editing (copy to clipboard)"});
        this.app.auto_upload_no_edit_check.set_active(this.app.config.auto_upload_no_edit || false);
        this.app.auto_upload_no_edit_check.connect('toggled', () => { this.app.config.auto_upload_no_edit = this.app.auto_upload_no_edit_check.get_active(); this.app.configManager.save_config(); });
        box.pack_start(this.app.auto_upload_no_edit_check, false, false, 0);

        // API Key
        let api_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 5});
        let api_label = new Gtk.Label({label: "ImgBB API Key:"});
        api_box.pack_start(api_label, false, false, 0);
        this.app.api_entry = new Gtk.Entry();
        this.app.api_entry.set_text(this.app.config.api_key || "YOUR_IMGBB_KEY");
        this.app.api_entry.connect('changed', () => { this.app.config.api_key = this.app.api_entry.get_text(); this.app.configManager.save_config(); });
        api_box.pack_start(this.app.api_entry, true, true, 0);
        box.pack_start(api_box, false, false, 0);

        // Folder Path
        let folder_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 5});
        let folder_label = new Gtk.Label({label: "Screenshots Folder:"});
        folder_box.pack_start(folder_label, false, false, 0);
        this.app.folder_entry = new Gtk.Entry();
        this.app.folder_entry.set_text(this.app.config.folder || GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES) + "/Screenshots");
        this.app.folder_entry.connect('changed', () => { this.app.config.folder = this.app.folder_entry.get_text(); this.app.configManager.save_config(); });
        folder_box.pack_start(this.app.folder_entry, true, true, 0);
        box.pack_start(folder_box, false, false, 0);

        let update_btn = new Gtk.Button({label: "Update Settings"});
        update_btn.connect("clicked", () => this.app.monitorManager.update_monitor());
        box.pack_start(update_btn, false, false, 0);

        let manual_btn = new Gtk.Button({label: "Take Screenshot Manually"});
        manual_btn.connect("clicked", () => this.take_screenshot());
        box.pack_start(manual_btn, false, false, 0);

        this.app.window.add(box);
        this.app.window.show_all();
        this.app.window.connect("destroy", () => Gtk.main_quit());
    }

    take_screenshot() {
        let temp_path = GLib.get_tmp_dir() + '/kiru_manual_ss.png';
        GLib.spawn_command_line_sync(`gnome-screenshot -f ${temp_path}`);

        let pixbuf = GdkPixbuf.Pixbuf.new_from_file(temp_path);
        new ScreenshotEditor(pixbuf, {
            auto_delete: this.app.config.auto_delete,
            copy_clipboard: this.app.config.copy_clipboard,
            auto_upload: this.app.config.auto_upload,
            file_path: temp_path,
            api_key: this.app.config.api_key
        });
    }
}
