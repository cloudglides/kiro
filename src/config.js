export class ConfigManager {
    constructor(config_dir, config_file) {
        this.config_dir = config_dir;
        this.config_file = config_file;
        this.config = {};
    }

    load_config() {
        try {
            let dir = Gio.File.new_for_path(this.config_dir);
            if (!dir.query_exists(null)) {
                dir.make_directory_with_parents(null);
            }
            let file = Gio.File.new_for_path(this.config_file);
            if (file.query_exists(null)) {
                let [success, contents] = file.load_contents(null);
                if (success) {
                    let decoder = new TextDecoder('utf-8');
                    let text = decoder.decode(contents);
                    this.config = JSON.parse(text);
                } else {
                    this.config = {};
                }
            } else {
                this.config = {};
            }
        } catch (e) {
            this.config = {};
            console.log('Error loading config:', e);
        }
    }

    save_config() {
        try {
            let dir = Gio.File.new_for_path(this.config_dir);
            if (!dir.query_exists(null)) {
                dir.make_directory_with_parents(null);
            }
            let file = Gio.File.new_for_path(this.config_file);
            let data = JSON.stringify(this.config, null, 2);
            let [, etag] = file.replace_contents(data, null, false, Gio.FileCreateFlags.NONE, null);
        } catch (e) {
            console.log('Error saving config:', e);
        }
    }
}
