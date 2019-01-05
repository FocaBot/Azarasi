import 'reflect-metadata';
import Discord from 'discord.js';
import { Azarasi } from '.';
import { Command, CommandOptions, CommandHandler } from './command';
import { Parameter } from './settings';
import { DataSubscription } from './dataStores';
export declare class Module {
    /** Internal name */
    readonly id: string;
    /** Module state */
    state: ModuleState;
    /** Friendly name */
    readonly name?: string;
    /** Description */
    readonly description?: string;
    /** Author */
    readonly author?: string;
    /** Icon */
    readonly icon?: string;
    /** Azarasi instance */
    readonly az: Azarasi;
    /** Discord client */
    readonly client: Discord.Client;
    /** Registered commands */
    readonly commands: Map<string, Command>;
    /** Registered event handlers */
    readonly events: ModuleEvent[];
    /** Disable this module by default */
    readonly defaultDisabled: boolean;
    /** Allow this module to be disabled */
    readonly allowDisabling: boolean;
    /** Module constructor (internal use only) */
    constructor(az: Azarasi, id: string);
    /**
     * Registers a command bound to this module.
     *
     * Use this instead of [[CommandManager.register]] to let the module system
     * handle unloading/reloading for you.
     *
     * An alternative decorator syntax is available: [@registerCommand](/globals.html#registercommand)
     * (only available in TypeScript and ESNEXT for now)
     * @param name - Command name
     * @param options - Command options
     * @param handler - Command handler
     */
    registerCommand(name: string, options: CommandOptions, handler: CommandHandler): Command | boolean;
    /**
     * Registers a command bound to this module.
     *
     * Use this instead of [[CommandManager.register]] to let the module system
     * handle unloading/reloading for you.
     *
     * An alternative decorator syntax is available: [@registerCommand](/globals.html#registercommand)
     * (only available in TypeScript and ESNEXT for now)
     * @param name - Command name
     * @param handler - Command handler
     */
    registerCommand(name: string, handler: CommandHandler): Command | boolean;
    /**
     * Registers a command bound to this module.
     *
     * Use this instead of [[CommandManager.register]] to let the module system
     * handle unloading/reloading for you.
     *
     * An alternative decorator syntax is available: [@registerCommand](/globals.html#registercommand)
     * (only available in TypeScript and ESNEXT for now)
     * @param trigger - Regex trigger
     * @param options - Command options
     * @param handler - Command handler
     */
    registerCommand(trigger: RegExp, options: CommandOptions, handler: CommandHandler): Command | boolean;
    /**
     * Registers a command bound to this module.
     *
     * Use this instead of [[CommandManager.register]] to let the module system
     * handle unloading/reloading for you.
     *
     * An alternative decorator syntax is available: [@registerCommand](/globals.html#registercommand)
     * (only available in TypeScript and ESNEXT for now)
     * @param trigger - Regex trigger
     * @param handler - Command handler
     */
    registerCommand(trigger: RegExp, handler: CommandHandler): Command | boolean;
    /**
     * Unregisters a command (only if it belongs to this module).
     * @param name - Command name
     */
    unregisterCommand(name: string): void;
    /**
     * Unregisters a command (only if it belongs to this module).
     * @param trigger - RegExp trigger
     */
    unregisterCommand(trigger: RegExp): void;
    /**
     * Unregisters a command (only if it belongs to this module).
     * @param command - Command instance
     */
    unregisterCommand(command: Command): void;
    /**
     * Registers a parameter into the settings schema
     * @param key - Parameter key
     * @param param - Parameter definition
     */
    registerParameter(key: string, param: Parameter): void;
    /**
     * Unregisters a parameter from the schema (only if it belongs to this module)
     * @param key - Parameter key
     */
    unregisterParameter(key: string): void;
    /**
     * Registers a new event listener bound to this module.
     *
     * Use this to let the module system handle module unloading/reloading for you,
     * avoiding stray event listeners and memory leaks.
     *
     * Additionally, for some discord-related events, the handler will not be called if the
     * module is disabled in the guild that triggered the event.
     *
     * An alternative decorator syntax is available: [@registerEvent)(/globals.html#registerevent)
     * (only available in TypeScript and ESNEXT for now)
     * @param name
     * Event name
     *  - If prefixed with `discord.`, (`discord.message`, for instance)
     *    the corresponding discord.js event will be handled
     *  - If prefixed with `db.`, (`db.GuildData`), a data store subscription
     *    will be created ([[IDataStore.subscribe]])
     *  - Otherwise, the event listener will be added to [[Azarasi.events]]
     * @param handler - Event handler
     */
    registerEvent(name: string, handler: (...args: any[]) => any): void;
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
    unregisterEvent(name: string, handler?: (...args: any[]) => any): void;
    /**
     * Get a module instance by name and declare a dependency on it
     * @param name - Module name
     */
    requireModule<T extends Module>(name: string): T;
    /**
     * Checks if the module is disabled for a specific guild
     * @param guild - Discord Guild
     */
    isDisabledForGuild(guild: Discord.Guild): Promise<boolean>;
    /**
     * Enables this module for a specific guild
     * @param guild - Discord Guild
     */
    enableForGuild(guild: Discord.Guild): Promise<void>;
    /**
     * Disables this module for a specific guild
     * @param guild - Discord Guild
     */
    disableForGuild(guild: Discord.Guild): Promise<void>;
    /**
     * Module initialization code.
     *
     * This method is called each time the module is loaded or reloaded
     */
    init(): any;
    /**
     * This method is called before unloading or reloading the module.
     * Use it if you need to perform cleanup tasks (remove event handlers, timeouts, etc)
     */
    shutdown(): any;
    /**
     * This method gets called once the bot is fully initialized.
     *
     * If the bot is already initialized, it gets called immediatly after init()
     */
    ready(): any;
}
/**
 * Contains data about a module's event listener.
 * @hidden
 */
export interface ModuleEvent {
    name: string;
    evName?: string;
    handler?: (...args: any[]) => any;
    sub?: DataSubscription;
    originalHandler: (...args: any[]) => any;
    type: ModuleEventType;
}
/** @hidden */
export declare enum ModuleEventType {
    Azarasi = 0,
    Discord = 1,
    DataStore = 2
}
/**
 * Current module state.
 */
export declare enum ModuleState {
    /** The module is being loaded for the first time (or after a full unload) */
    Loading = 0,
    /** The module is loaded and active. */
    Loaded = 1,
    /** The module is currently unloading */
    Unloading = 2,
    /** The module is currently reloading */
    Reloading = 3,
    /** An error occurred during a reload. */
    Errored = 4
}
