/**
 * Handles permissions depending on roles.
 */
class PermissionsManager {
  constructor () {
    /**
     * Array of owner user IDs
     * @type {string[]}
     */
    this.owner = Core.properties.owner || []
    /**
     * Array of admin user IDs
     * @type {string[]}
     */
    this.admins = Core.properties.admins || []
    /**
     * Array of admin role names
     * @type {string[]}
     */
    this.adminRoles = Core.properties.adminRoles || []
    /**
     * Array of DJ role names
     * @type {string[]}
     */
    this.djRoles = Core.properties.djRoles || []
  }

  /**
   * Checks if an user has certain roles (by name).
   *
   * Note: Only one of the roles passed is required for this to return a positive value.
   * @param {string|string[]} roles - Role name(s) to check.
   * @param {object} user - The user to check. Can also be a Discordie IGuildMember.
   * @param {object} guild - The guild to check. Not needed if user is an IGuildMember.
   * @return {boolean}
   */
  hasRoles (roles, user, guild = user.guild) {
    if (!guild) return false // DMs have no guild object
    const member = user.memberOf(guild)
    if (!member) return false // wut?
    const r = (typeof roles === 'string') ? [roles] : roles
    return member.roles.filter(i => r.indexOf(i.name) >= 0).length > 0
  }

  /**
   * Checks if an user has admin rights.
   * @param {object} user - The user to check. Can also be a Discordie IGuildMember.
   * @param {object} guild - The guild to check. Not needed if user is an IGuildMember.
   * @param {boolean} globalOnly - Check only for global admins.
   * @return {boolean}
   */
  isAdmin (user, guild = user.guild, globalOnly) {
    // always return true for global admins and bot owners
    if (this.admins.indexOf(user.id) >= 0 || this.isOwner(user)) return true
    if (globalOnly) return false
    if (!guild) return false
    if (user.id === guild.owner_id) return true // Owner of guild
    return this.hasRoles(this.adminRoles, user, guild)
  }

  /**
   * Checks if an user has DJ roles.
   * @param {object} user - The user to check. Can also be a Discordie IGuildMember.
   * @param {object} guild - The guild to check. Not needed if user is an IGuildMember.
   * @return {boolean}
   */
  isDJ (user, guild = user.guild) {
    // always return true for global admins and bot owners
    if (this.admins.indexOf(user.id) >= 0 || this.isOwner(user)) return true
    if (!guild) return false // DMs have no guild object
    if (user.id === guild.owner_id) return true // Owner of guild
    return this.hasRoles(this.djRoles, user, guild) || this.hasRoles(this.adminRoles, user, guild)
  }

  /**
   * Checks if an user is the guild owner.
   * @param {object} user - The user or member to check
   * @param {object} guild - The guild to check
   * @return {boolean}
   */
  isGuildOwner (user, guild = user.guild) {
    return user.id === guild.owner_id || this.isOwner(user)
  }

  /**
   * Check if an user is the bot owner
   * @param {object} user - User to check
   * @return {boolean}
   */
  isOwner (user) {
    return this.owner.indexOf(user.id) >= 0
  }
}

module.exports = PermissionsManager
