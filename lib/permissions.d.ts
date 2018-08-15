import { Azarasi } from '.';
import Discord from 'discord.js';
/**
 * Permissions System (based on roles)
 */
export declare class PermissionHelper {
    private readonly az;
    constructor(az: Azarasi);
    /** Owner IDs */
    readonly owner: string[];
    /** Global Admin IDs */
    readonly admins: string[];
    /** Admin role names */
    readonly adminRoles: string[];
    /** DJ role names */
    readonly djRoles: string[];
    /**
     * Check if a users has certain roles (by name)
     * Only one of the roles has to match
     * @param role - Role to find
     * @param roles - Roles to find
     * @param member - Member to perform the search in
     * @param user - User to perform the search in
     * @param guild - Guild to perform the search in
     */
    hasRoles(role: string, member: Discord.GuildMember): boolean;
    hasRoles(roles: string[], member: Discord.GuildMember): boolean;
    hasRoles(role: string, user: Discord.User, guild: Discord.Guild): boolean;
    hasRoles(roles: string[], user: Discord.User): boolean;
    hasRoles(roles: string[], user: Discord.User, guild: Discord.Guild): boolean;
    /**
     * Check if a user has admin rights
     * @param user - User to check
     * @param g - Guild
     * @param globalOnly - Global admins only
     */
    isAdmin(user: Discord.User | Discord.GuildMember, guild?: Discord.Guild, globalOnly?: boolean): Promise<boolean>;
    isDJ(user: Discord.User | Discord.GuildMember, guild?: Discord.Guild): Promise<boolean>;
    /**
     * Check if a user is the bot owner
     * @param user - User to check
     */
    isOwner(user: Discord.User | Discord.GuildMember): boolean;
    /**
     * Map permissions for a single user
     * @param user - User to check
     * @param guild - User guild
     */
    mapPermissions(user: Discord.User | Discord.GuildMember, guild: Discord.Guild): Promise<UserPermissions>;
}
export interface UserPermissions {
    /** True if the user is the bot owner */
    isOwner: boolean;
    /** True if the user is an administrator */
    isAdmin: boolean;
    /** True if the user is a DJ */
    isDJ: boolean;
    /** Check if the user has one of the specified role (names) */
    hasRoles: (roles: string[]) => boolean;
}
