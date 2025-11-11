export class MonitorManager {
    constructor(app) {
        this.app = app;
        this.monitor = null;
    }

    init_monitor() {
        this.update_monitor();
    }

    update_monitor() {
        if (this.monitor) {
            this.monitor.cancel();
        }
        this.app.screenshots_dir = this.app.config.folder || GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES) + "/Screenshots";
        let dir = Gio.File.new_for_path(this.app.screenshots_dir);
        if (!dir.query_exists(null)) {
            dir.make_directory_with_parents(null);
        }
        this.monitor = dir.monitor_directory(Gio.FileMonitorFlags.NONE, null);
        this.monitor.connect('changed', (monitor, file, other_file, event_type) => {
            if (event_type === Gio.FileMonitorEvent.CREATED && file.get_basename().endsWith('.png')) {
                // Delay a bit to ensure file is written
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                    try {
                        if (this.app.config.auto_upload_no_edit) {
                            this.upload_file_directly(file.get_path(), this.app.config.api_key);
                        } else {
                            let pixbuf = GdkPixbuf.Pixbuf.new_from_file(file.get_path());
                            new ScreenshotEditor(pixbuf, {
                                auto_delete: this.app.config.auto_delete,
                                copy_clipboard: this.app.config.copy_clipboard,
                                auto_upload: this.app.config.auto_upload,
                                file_path: file.get_path(),
                                api_key: this.app.config.api_key
                            });
                        }
                    } catch (e) {
                        // ignore
                    }
                    return false;
                });
            }
        });
    }

    upload_file_directly(file_path, api_key) {
        console.log('Auto-uploading', file_path);
        let cmd = `curl -s -X POST -F "key=${api_key}" -F "image=@${file_path}" https://api.imgbb.com/1/upload`;
        let [success, stdout, stderr] = GLib.spawn_command_line_sync(cmd);
        if (success && stdout) {
            try {
                let decoder = new TextDecoder('utf-8');
                let text = decoder.decode(stdout);
                let data = JSON.parse(text);
                if (data.success) {
                    let link = data.data.url;
                    let clip_cmd = `echo "${link}" | wl-copy`;
                    let [clip_success, , clip_stderr] = GLib.spawn_command_line_sync(clip_cmd);
                    if (clip_success) {
                        console.log('Auto-uploaded and copied:', link);
                    } else {
                        console.log('Clipboard copy failed:', clip_stderr);
                    }
                    // Delete if checked
                    if (this.app.auto_delete_check.get_active()) {
                        let file = Gio.File.new_for_path(file_path);
                        file.delete(null);
                        console.log('Deleted file:', file_path);
                    }
                } else {
                    console.log('Auto-upload failed:', data.error ? data.error.message : 'Unknown error');
                }
            } catch (e) {
                console.log('JSON parse error:', e);
            }
        } else {
            console.log('Auto-upload command failed');
        }
    }
}
