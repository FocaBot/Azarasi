/**
 * Handles permissions depending on roles.
 */
class PermissionsManager {
  constructor() {
    /**
     * Array of owner user IDs
     * @type {string[]}
     */
    this.owner = Core.settings.owner || [];
    /**
     * Array of admin user IDs
     * @type {string[]}
     */
    this.admins = Core.settings.admins || [];
    /**
     * Array of admin role names
     * @type {string[]}
     */
    this.adminRoles = Core.settings.adminRoles || [];
    /**
     * Array of DJ role names
     * @type {string[]}
     */
    this.djRoles = Core.settings.djRoles || [];
  }

  /**
   * Checks if an user has admin rights.
   * @param {object} user - The user to check. Can also be a Discordie IGuildMember.
   * @param {object} guild - The guild to check. Not needed if user is an IGuildMember.
   * @param {boolean} globalOnly - Check only for global admins.
   * @return {boolean}
   */
  isAdmin(user, guild = user.guild, globalOnly) {
    // always return true for global admins and bot owners
    if (this.admins.indexOf(user.id) >= 0 || this.isOwner(user)) return true;    
    if (globalOnly) return false;
    if (!guild) return false; // DMs have no guild object
    if (user.id === guild.owner_id) return true; // Owner of guild
    const member = user.memberOf(guild);
    if (!member) return false; // wut?
    return member.roles.filter(i => this.adminRoles.indexOf(i.name) >= 0).length > 0; // Has admin role(s).
  }

  /**
   * Checks if an user has DJ roles.
   * @param {object} user - The user to check. Can also be a Discordie IGuildMember.
   * @param {object} guild - The guild to check. Not needed if user is an IGuildMember.
   * @return {boolean}
   */
  isDJ(user, guild = user.guild) {
    // always return true for global admins and bot owners
    if (this.admins.indexOf(user.id) >= 0 || this.isOwner(user)) return true;
    if (!guild) return false; // DMs have no guild object
    if (user.id === guild.owner_id) return true; // Owner of guild
    const member = user.memberOf(guild);
    if (!member) return false; // wut?
    const rolesTofind = this.adminRoles.concat(this.djRoles);
    return member.roles.filter(i => rolesTofind.indexOf(i.name)).length > 0;
  }

  /**
   * Checks if an user is the guild owner.
   * @param {object} user - The user or member to check
   * @param {object} guild - The guild to check
   * @return {boolean}
   */
  isGuildOwner(user, guild = user.guild) {
    return user.id === guild.owner_id || this.isOwner(user);
  }

  /**
   * Check if an user is the bot owner
   * @param {object} user - User to check
   * @return {boolean}
   */
  isOwner(user) {
    return this.owner.indexOf(user.id) >= 0;
  }
}

module.exports = PermissionsManager;
