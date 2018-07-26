import Discord from 'discord.js';
import Azarasi from '.';
import { Locale } from './locales';
import { Module } from './module';
/**
 * Manages guild settings
 */
export declare class SettingsManager {
    private readonly az;
    /** Settings schema */
    readonly schema: Map<string, Parameter>;
    /** Default values */
    private defaults;
    /**
     * Global defaults
     *
     * Useful to override the default settings defined in the schema
     */
    globals: Settings;
    /**
     * Like globals, but enforced (can't be changed by guild administrators)
     */
    overrides: Settings;
    constructor(az: Azarasi);
    /** Check if a type is valid */
    validateType(type: any): void;
    /**
     * Registers a parameter to the schema
     * @param key - Key of the parameter
     * @param param - Parameter definition
     */
    register(key: string, param: Parameter): void;
    /**
     * Unregister parameter from the schema
     * @param key - Key to remove
     */
    unregister(key: string): void;
    /**
     * Gets parameters for a guild
     * @param guild - Guild
     */
    getForGuild(guild?: Discord.Guild): Promise<Settings>;
    /**
     * Gets a specific parameter from a guild
     * @param guild - Guild
     * @param key - Parameter
     */
    getGuildParam(guild: Discord.Guild, key: string): Promise<any>;
    setGuildParam(guild: Discord.Guild, key: string, value: any): Promise<void>;
}
/** Built in settings */
export interface Settings {
    /** If enabled, the bot will only accept commands from guild admins */
    restrict?: boolean;
    /** Define a custom command prefix for the guild. The default prefix will keep working regardless */
    prefix?: string;
    /** Limit bot commands to a single text channel */
    commandChannel?: string;
    /** Limit voice chat related commands to a single voice channel */
    voiceChannel?: string;
    /** Allow NSFW in channels not marked as NSFW */
    allowNSFW?: boolean;
    /** Locale for guild */
    locale?: string;
    /** Bot Commander role */
    botCommanderRole?: string;
    /** DJ role */
    djRole?: string;
    [key: string]: any;
}
export interface Parameter {
    /** Parameter type */
    type: BooleanConstructor | StringConstructor | NumberConstructor | typeof Locale | typeof Discord.VoiceChannel | typeof Discord.TextChannel | typeof Discord.User;
    /** Default value */
    def?: any;
    /** Minimum value (numbers) or length (strings) */
    min?: number;
    /** Maximum value (numbers) or length (strings) */
    max?: number;
    /** Accept integers only (numbers) */
    integer?: boolean;
    /** Associated module */
    module?: Module;
}
