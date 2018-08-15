import { Azarasi } from '.';
import Discord from 'discord.js';
import { Settings } from './settings';
export declare class Guild {
    private readonly az;
    discordGuild?: Discord.Guild;
    data: GuildData;
    constructor(az: Azarasi, discordGuild?: Discord.Guild);
    /**
     * Initializes guild data
     */
    init(): Promise<void>;
    /**
     * Should return data that will be used for default on new guilds
     */
    static defaultData(): {};
    /**
     * Saves Guild Data
     */
    saveData(): Promise<void>;
}
/**
 * Manages persistent data for guilds
 */
export declare class GuildManager {
    private readonly az;
    private guilds;
    constructor(az: Azarasi);
    /**
     * Get data for a guild. If no guild is specified, dummy (default) values will be used.
     * @param guild - Guild to get
     */
    getGuild(guild?: Discord.Guild): Promise<Guild>;
}
export interface GuildData {
    /**
     * Save changes to the data store
     */
    save: () => Promise<void>;
    /**
     * Guild settings
     */
    settings?: Settings;
    /**
     * Command permission overrides
     */
    permissionOverides?: {
        [key: string]: string;
    };
    /**
     * Disabled modules
     */
    disabledModules?: {
        [name: string]: boolean;
    };
    /** Custom fields */
    [key: string]: any;
}
