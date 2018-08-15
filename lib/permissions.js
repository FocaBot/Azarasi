"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
/**
 * Permissions System (based on roles)
 */
class PermissionHelper {
    constructor(az) {
        this.az = az;
    }
    /** Owner IDs */
    get owner() {
        return this.az.properties.owner || [];
    }
    /** Global Admin IDs */
    get admins() {
        return this.az.properties.admins || [];
    }
    /** Admin role names */
    get adminRoles() {
        return this.az.properties.adminRoles || [];
    }
    /** DJ role names */
    get djRoles() {
        return this.az.properties.djRoles || [];
    }
    hasRoles(roles, user, g) {
        const guild = user instanceof discord_js_1.default.GuildMember ? user.guild : g;
        if (!guild)
            return false; // DMs have no guild object or roles
        const member = user instanceof discord_js_1.default.GuildMember ? user : guild.members.find((m) => m.id === user.id);
        if (!member)
            return false; // This should never happen
        const r = typeof roles === 'string' ? [roles] : roles;
        return member.roles.reduce((a, b) => a || r.indexOf(b.name) >= 0, false);
    }
    /**
     * Check if a user has admin rights
     * @param user - User to check
     * @param g - Guild
     * @param globalOnly - Global admins only
     */
    async isAdmin(user, guild, globalOnly = false) {
        // Always return true for global admins and bot owners
        if (this.admins.indexOf(user.id) >= 0 || this.isOwner(user))
            return true;
        if (globalOnly)
            return false;
        const g = user instanceof discord_js_1.default.GuildMember ? user.guild : guild;
        if (!g)
            return false;
        const member = user instanceof discord_js_1.default.GuildMember ? user : g.members.find((m) => m.id === user.id);
        // Return true for guild owners, administrators or people with "Mage Guild"
        if (member.hasPermission('MANAGE_GUILD', false, true, true))
            return true;
        // Fall back to Bot Commander role
        const { botCommanderRole } = await this.az.settings.getForGuild(g);
        return this.hasRoles(botCommanderRole ? [botCommanderRole] : this.adminRoles, member);
    }
    async isDJ(user, guild) {
        const g = user instanceof discord_js_1.default.GuildMember ? user.guild : guild;
        if (!g)
            return false;
        const member = user instanceof discord_js_1.default.GuildMember ? user : g.members.find((m) => m.id === user.id);
        // Check if the user is admin
        if (await this.isAdmin(member))
            return true;
        // Fall back to DJ role
        const { djRole } = await this.az.settings.getForGuild(g);
        return this.hasRoles(djRole ? [djRole] : this.djRoles, member);
    }
    /**
     * Check if a user is the bot owner
     * @param user - User to check
     */
    isOwner(user) {
        return this.owner.indexOf(user.id) >= 0;
    }
    /**
     * Map permissions for a single user
     * @param user - User to check
     * @param guild - User guild
     */
    async mapPermissions(user, guild) {
        return {
            isOwner: await this.isOwner(user),
            isAdmin: await this.isAdmin(user, guild),
            isDJ: await this.isDJ(user, guild),
            //@ts-ignore
            hasRoles: (roles) => this.hasRoles(roles, user, guild)
        };
    }
}
exports.PermissionHelper = PermissionHelper;
//# sourceMappingURL=permissions.js.map