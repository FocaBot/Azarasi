import Discord from 'discord.js';
import Azarasi from '.';
import { GuildData } from './guilds';
import { Settings } from './settings';
import { Locale } from './locales';
import { UserPermissions } from './permissions';
import { Module } from './module';
/**
 * Represents a bot command.
 */
export declare class Command {
    readonly name: string;
    handler: CommandHandler;
    /** Command aliases */
    readonly aliases?: string[];
    /** Require admin role */
    adminOnly?: boolean;
    /** Require DJ (or admin) role */
    djOnly?: boolean;
    /** Make the command available to the owner only */
    ownerOnly?: boolean;
    /** Argument delimiter */
    argSeparator?: string;
    /** Include command name in arguments array. Useful for aliases */
    includeCommandNameInArgs?: boolean;
    /** Allow this command to be executed in DMs */
    allowDM?: boolean;
    /** For selfbots, allow the command to be executed by others */
    everyone?: boolean;
    /** Required permissions to run the command */
    requiredPermissions?: Discord.PermissionResolvable[];
    /** Required role (names) to run this command */
    requiredRoles?: string[];
    /** Regular expression to trigger the command. If this is set, the default triggers are disabled */
    readonly regex?: RegExp;
    /** Associated module */
    module?: Module;
    /** Azarasi instance */
    az?: Azarasi;
    /**
     * Instantiates a new command.
     * You must register it with [[CommandManager.register]] to make it work.
     * @param name - Command name. MUST be in lowercase and contain no spaces.
     * @param options - Command options
     * @param handler - Command handler
     */
    constructor(name: string, handler: CommandHandler);
    constructor(name: string, options: CommandOptions, handler: CommandHandler);
    exec(msg: Discord.Message, args: string | string[] | RegExpExecArray): Promise<void>;
    toString(): string;
}
export declare type CommandHandler = (args: CommandHandlerArgs) => void;
export interface CommandHandlerArgs {
    /** Message */
    msg: Discord.Message;
    /** Arguments */
    args: string | string[] | RegExpExecArray;
    /** Guild Data */
    data: GuildData;
    /** Guild Settings */
    settings: Settings;
    /** Guild Locale */
    locale?: Locale;
    /** User permissions */
    perms: UserPermissions;
    /** Client instance */
    bot: Discord.Client;
    /** Azarasi instance */
    core: Azarasi;
}
export interface CommandHandlerArgs {
    /** Message (long alias) */
    message: Discord.Message;
    /** Arguments (long alias) */
    arguments: string | string[] | RegExpExecArray;
    /** Guild Data (long alias) */
    guildData: GuildData;
    /** Guild Settings (long alias) */
    guildSettings: Settings;
    /** Guild Locale (long alias) */
    guildLocale?: Locale;
    /** User permissions (long alias) */
    permissions: UserPermissions;
    /** Client instance (long alias) */
    client: Discord.Client;
    /** Azarasi instance (long alias) */
    azarasi: Azarasi;
}
export interface CommandHandlerArgs {
    /** Message (short alias) */
    m: Discord.Message;
    /** Arguments (short alias) */
    a: string | string[] | RegExpExecArray;
    /** Guild Data (short alias) */
    d: GuildData;
    /** Guild Settings (short alias) */
    s: Settings;
    /** Guild Locale (short alias) */
    l?: Locale;
    /** User permissions (short alias) */
    p: UserPermissions;
    /** Client instance (short alias) */
    b: Discord.Client;
    /** Azarasi instance (short alias) */
    az: Azarasi;
}
export interface CommandOptions {
    /** Command aliases */
    aliases?: string[];
    /** Require admin role */
    adminOnly?: boolean;
    /** Require DJ (or admin) role */
    djOnly?: boolean;
    /** Make the command available to the owner only */
    ownerOnly?: boolean;
    /** Argument delimiter */
    argSeparator?: string;
    /** Include command name in arguments array. Useful for aliases */
    includeCommandNameInArgs?: boolean;
    /** Allow this command to be executed in DMs */
    allowDM?: boolean;
    /** For selfbots, allow the command to be executed by others */
    everyone?: boolean;
    /** Required permissions to run the command */
    requiredPermissions?: Discord.PermissionResolvable[];
    /** Required role (names) to run this command */
    requiredRoles?: string[];
    /** Regular expression to trigger the command. If this is set, the default triggers are disabled */
    regex?: RegExp;
}
