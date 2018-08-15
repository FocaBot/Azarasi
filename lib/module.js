"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
class Module {
    /** Module constructor (internal use only) */
    constructor(az, id) {
        /** Module state */
        this.state = ModuleState.Loading;
        /** Registered commands */
        this.commands = new Map();
        /** Registered event handlers */
        this.events = [];
        /** Disable this module by default */
        this.defaultDisabled = false;
        /** Allow this module to be disabled */
        this.allowDisabling = true;
        this.id = id;
        this.az = az;
        this.bot = az.bot;
    }
    registerCommand(arg0, arg1, arg2) {
        const handler = typeof arg1 === 'function' ? arg1 : arg2;
        if (!handler)
            throw new Error('No command handler specified.');
        const options = typeof arg1 === 'object' ? arg1 : {};
        try {
            //@ts-ignore (i know what i'm doing)
            const command = this.az.commands.register(arg0, options, handler);
            command.module = this;
            this.commands.set(command.name, command);
            return command;
        }
        catch (e) {
            this.az.logError(e);
            return false;
        }
    }
    unregisterCommand(command) {
        try {
            const name = command.toString();
            const cmd = this.az.commands.get(name);
            if (!cmd || cmd.module !== this)
                return;
            this.az.commands.unregister(cmd);
            this.commands.delete(name);
        }
        catch (e) {
            this.az.logError(e);
        }
    }
    /**
     * Registers a parameter into the settings schema
     * @param key - Parameter key
     * @param param - Parameter definition
     */
    registerParameter(key, param) {
        return this.az.settings.register(key, Object.assign({}, param, { module: this }));
    }
    /**
     * Unregisters a parameter from the schema (only if it belongs to this module)
     * @param key - Parameter key
     */
    unregisterParameter(key) {
        const param = this.az.settings.schema.get(key);
        if (!param || param.module !== this)
            return;
        this.az.settings.unregister(key);
    }
    /**
     * Registers a new event listener bound to this module.
     *
     * Use this to let the module system handle module unloading/reloading for you,
     * avoiding stray event listeners and memory leaks.
     *
     * Additionally, for some discord-related events, the handler will not be called if the
     * module is disabled in the guild that triggered the event.
     *
     * @param name
     * Event name
     *  - If prefixed with `discord.`, (`discord.message`, for instance)
     *    the corresponding discord.js event will be handled
     *  - If prefixed with `db.`, (`db.GuildData`), a data store subscription
     *    will be created ([[IDataStore.subscribe]])
     *  - Otherwise, the event listener will be added to [[Azarasi.events]]
     * @param handler - Event handler
     */
    registerEvent(name, handler) {
        // Wrapper to check if the module is enabled before actually calling the event handler
        const mod = this;
        const wrapper = async function (param) {
            let guild;
            if (param && param instanceof discord_js_1.default.Guild)
                guild = param;
            if (param && param.guild && param.guild instanceof discord_js_1.default.Guild)
                guild = param.guild;
            if (guild && await mod.isDisabledForGuild(guild)) {
                return false;
            }
            handler.apply(mod, arguments);
        };
        // Match event type
        const nameParts = name.split('.');
        switch (nameParts[0]) {
            case 'discord':
            case 'client':
            case 'bot':
                const evName = nameParts.slice(1).join('.');
                this.bot.on(evName, wrapper);
                this.events.push({
                    name,
                    evName,
                    handler: wrapper,
                    originalHandler: handler,
                    type: ModuleEventType.Discord
                });
                break;
            case 'db':
            case 'ds':
            case 'datastore':
            case 'database':
                const channelName = nameParts.slice(1).join('.');
                const sub = this.az.data.subscribe(channelName, wrapper);
                this.events.push({
                    name,
                    sub,
                    originalHandler: handler,
                    type: ModuleEventType.DataStore
                });
                break;
            default:
                this.az.events.on(name, handler);
                this.events.push({
                    name,
                    handler: wrapper,
                    originalHandler: handler,
                    type: ModuleEventType.Azarasi
                });
        }
    }
    /**
     * Removes an event listener
     * @param name - Event name
     * @param handler
     * Event handler.
     *
     * Since event handlers are cached internally, this parameter is not required
     * unless you have multiple handlers for the same event and want to remove a specific one.
     *
     * If not specified, all event handlers matching `name` will be removed.
     */
    unregisterEvent(name, handler) {
        this.events.filter(e => {
            return e.name === name && (e.originalHandler === handler || handler == null);
        }).forEach(e => {
            switch (e.type) {
                case ModuleEventType.Discord:
                    this.bot.removeListener(e.evName, e.handler);
                    break;
                case ModuleEventType.DataStore:
                    e.sub.off();
                    break;
                case ModuleEventType.Azarasi:
                    this.az.events.removeListener(e.name, e.handler);
                    break;
            }
            const index = this.events.indexOf(e);
            this.events.splice(index, 1);
        });
    }
    /**
     * Get a module instance by name and declare a dependency on it
     * @param name - Module name
     */
    requireModule(name) {
        this.az.modules.registerDependency(this, name);
        return this.az.modules.get(name);
    }
    /**
     * Checks if the module is disabled for a specific guild
     * @param guild - Discord Guild
     */
    isDisabledForGuild(guild) {
        return this.az.modules.isModuleDisabledForGuild(guild, this);
    }
    /**
     * Enables this module for a specific guild
     * @param guild - Discord Guild
     */
    enableForGuild(guild) {
        return this.az.modules.enableModuleForGuild(guild, this);
    }
    /**
     * Disables this module for a specific guild
     * @param guild - Discord Guild
     */
    disableForGuild(guild) {
        return this.az.modules.disableModuleForGuild(guild, this);
    }
    /**
     * Module initialization code.
     *
     * This method is called each time the module is loaded or reloaded
     */
    init() {
    }
    /**
     * This method is called before unloading or reloading the module.
     * Use it if you need to perform cleanup tasks (remove event handlers, timeouts, etc)
     */
    shutdown() {
    }
    /**
     * This method gets called once the bot is fully initialized.
     *
     * If the bot is already initialized, it gets called immediatly after init()
     */
    ready() {
    }
}
exports.Module = Module;
var ModuleEventType;
(function (ModuleEventType) {
    ModuleEventType[ModuleEventType["Azarasi"] = 0] = "Azarasi";
    ModuleEventType[ModuleEventType["Discord"] = 1] = "Discord";
    ModuleEventType[ModuleEventType["DataStore"] = 2] = "DataStore";
})(ModuleEventType = exports.ModuleEventType || (exports.ModuleEventType = {}));
var ModuleState;
(function (ModuleState) {
    ModuleState[ModuleState["Loading"] = 0] = "Loading";
    ModuleState[ModuleState["Loaded"] = 1] = "Loaded";
    ModuleState[ModuleState["Unloading"] = 2] = "Unloading";
    ModuleState[ModuleState["Reloading"] = 3] = "Reloading";
    ModuleState[ModuleState["Errored"] = 4] = "Errored";
})(ModuleState = exports.ModuleState || (exports.ModuleState = {}));
//# sourceMappingURL=module.js.map