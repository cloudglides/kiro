import { ConfigManager } from './config.js';
import { UpdateManager } from './update.js';
import { MonitorManager } from './monitor.js';
import { UIManager } from './ui.js';

class MainApp {
    constructor() {
        this.config_dir = GLib.get_home_dir() + '/.kiru';
        this.config_file = this.config_dir + '/conf.json';
        this.current_version = '1.0.0'; // Hardcoded app version
        this.configManager = new ConfigManager(this.config_dir, this.config_file);
        this.configManager.load_config();
        this.config = this.configManager.config;
        this.updateManager = new UpdateManager(this);
        this.updateManager.check_for_updates_on_startup();
        this.monitorManager = new MonitorManager(this);
        this.monitorManager.init_monitor();
        this.uiManager = new UIManager(this);
        this.uiManager.init_ui();
    }










}
