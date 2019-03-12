import Discord from 'discord.js';
import { Moment } from 'moment';
import EventEmitter from 'events';
import { IDataStore } from './dataStores';
import { GuildManager } from './guilds';
import { ModuleManager } from './moduleManager';
import { Module } from './module';
import { PermissionHelper } from './permissions';
import { Command } from './command';
import { CommandManager } from './commandManager';
import { LocaleManager, Locale } from './locales';
import { SettingsManager } from './settings';
/**
 * The mother of all seals
 */
export declare class Azarasi {
    /** Is the bot ready? */
    ready: boolean;
    /** Properties for this instance */
    properties: BotProperties;
    /** Discord.js client */
    client: Discord.Client;
    /** Shard manager client */
    shard?: Discord.ShardClientUtil;
    /** Main Event Emitter */
    events: EventEmitter;
    /** Boot date (to calculate uptime) */
    bootDate: Moment;
    /** Azarasi framework version */
    version: string;
    /** The persistent data store */
    data: IDataStore;
    /** Persistent data manager for guilds */
    guilds: GuildManager;
    /** Permissions helper */
    permissions: PermissionHelper;
    /** The command manager */
    commands: CommandManager;
    /** The module manager */
    modules: ModuleManager;
    /** The localization manager */
    locales: LocaleManager;
    /** Guild settings manager */
    settings: SettingsManager;
    static Command: typeof Command;
    static Module: typeof Module;
    static Locale: typeof Locale;
    constructor(properties: BotProperties);
    /**
     * Establishes connection with Discord.
     */
    establishConnection(): void;
    /**
     * Processes messages.
     * @param msg - Discord.js message object
     */
    processMessage(msg: Discord.Message): void;
    /**
     * Logs stuff to the console with timestamp and shard id
     */
    log(...args: any[]): void;
    /**
     * Logs an error to the console with timestamp and shard id
     */
    logError(...args: any[]): void;
    /**
     * Logs information to the console (only in debug mode)
     */
    logDebug(...args: any[]): void;
}
/** Global properties for the bot */
export interface BotProperties {
    /** Bot token */
    token: string;
    /** Default command prefix */
    prefix?: string;
    /** Defines this bot as a selfbot */
    selfBot?: boolean;
    /** Public prefix (selfbots only) */
    publicPrefix?: string;
    /** Bot owners (user IDs) */
    owner?: string[];
    /** Global admins (user IDs) */
    admins?: string[];
    /** Admin role names */
    adminRoles?: string[];
    /** DJ role names */
    djRoles?: string[];
    /** Blaclisted user IDs */
    blacklist?: string[];
    /** Path to load modules from */
    modulePath?: string;
    /**
     * Database backend
     *
     * You can choose between [Redis](https://redis.io/), [Gun](http://gun.js.org/) and
     * temporary in-memory storage
     */
    dataStore?: 'redis' | 'gun' | 'memory';
    /** Database path (Gun backend only) */
    dbPath?: string;
    /** Database port (Gun backend only) */
    dbPort?: number;
    /** Database URL (Redis backend only) */
    redisUrl?: string;
    /** Debug mode (verbose logging) */
    debug?: boolean;
    /** Watch module directory for changes */
    watch?: boolean;
    /** Path to load translations from */
    localePath?: string;
    /** Default locale */
    locale?: string;
    /** Log to master process instead of console in sharded setups */
    logToMaster?: boolean;
}
export { Command, CommandContext } from './command';
export { Locale } from './locales';
export { Module } from './module';
