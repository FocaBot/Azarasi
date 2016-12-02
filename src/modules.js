const reload = require('require-reload')(require);
const path = require('path');

/**
 * Module Base class
 */
class BotModule {
  /**
   * Instantiates a Module
   */
  constructor() {
    /**
     * The current FocaBotCore instance
     * @deprecated
     * @type {FocaBotCore}
     */
    this.engine = global.Core; // backwards compatibility
    /** Discordie client */
    this.bot = global.Core.bot;
    /**
     * A reference to the PermissionsManager.
     * @deprecated
     * @type {PermissionsManager}
     */
    this.permissions = global.Core.permissions;
    /** Registered Commands */
    this.commands = [];
  }

  /**
   * Registers a command.
   * @param {string} name - Command name.
   * @param {object} options - Command options.
   * @param {function} func - Command handler.
   * @returns {BotCommand}
   * @see {BotCommand}
   */
  registerCommand(name, options, func) {
    try {
      const command = Core.commands.register(name, options, func);
      this.commands.push(command);
      return command;
    } catch (e) {
      Core.log(e, 2);
      return false;
    }
  }


  shutdown() {
    if (typeof this.unload === 'function') this.unload();
    Core.commands.unregister(this.commands);
  }
}

/**
 * Manages the modules.
 */
class ModuleManager {
  constructor() {
    /** Currently loaded modules */
    this.loaded = {};
    this.modulePath = Core.settings.modulePath || path.join(__dirname, '../modules');
  }

  /**
   * Loads the specified modules.
   * @param {string[]} modules - Modules to load
   */
  load(modules) {
    const m = (typeof modules === 'string') ? [modules] : modules;
    if (!m.forEach) throw new Error('This function only accepts strings or arrays.');
    m.forEach((module) => {
      try {
        const Module = reload(path.join(this.modulePath, module));
        this.loaded[module] = new Module();
        if (typeof this.loaded[module].init === 'function') this.loaded[module].init();
      } catch (e) {
        Core.log(e, 2);
      }
    });
  }

  /**
   * Unloads the specified modules.
   * @param {string[]} modules - Modules to unload
   */
  unload(modules) {
    const m = (typeof modules === 'string') ? [modules] : modules;
    if (!m.forEach) throw new Error('This function only accepts strings or arrays.');
    m.forEach((module) => {
      try {
        this.loaded[module].shutdown();
        delete this.loaded[module];
      } catch (e) {
        Core.log(e, 2);
      }
    });
  }

  /**
   * Reloads the specified modules.
   * @param {string[]} modules - Modules to load
   */
  reload(modules) {
    this.unload(modules);
    this.reload(modules);
  }
}

module.exports = ModuleManager;
global.BotModule = BotModule;
