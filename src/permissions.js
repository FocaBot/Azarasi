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
   * Checks if a user has certain roles (by name).
   *
   * Note: Only one of the roles passed is required for this to return a positive value.
   * @param {string|string[]} roles - Role name(s) to check.
   * @param {Discord.GuildMember|Discord.User} user - The user to check. Can also be a Discordie IGuildMember.
   * @param {Discord.Guild} guild - The guild to check. Not needed if user is an IGuildMember.
   * @return {boolean}
   */
  hasRoles (roles, user, guild = user.guild) {
    if (!guild) return false // DMs have no guild object
    const member = guild.fetchMember(user)
    if (!member) return false // wut?
    const r = (typeof roles === 'string') ? [roles] : roles
    return member.roles.filterArray(i => r.indexOf(i.name) >= 0).length > 0
  }

  /**
   * Checks if a user has admin rights.
   * @param {Discord.GuildMember|Discord.User} user - The user to check. Can also be a Discordie IGuildMember.
   * @param {Discord.Guild} guild - The guild to check. Not needed if user is an IGuildMember.
   * @param {boolean} globalOnly - Check only for global admins.
   * @return {boolean}
   */
  isAdmin (user, guild = user.guild, globalOnly) {
    // always return true for global admins and bot owners
    if (this.admins.indexOf(user.id) >= 0 || this.isOwner(user)) return true
    if (globalOnly || !guild) return false
    if (user.id === guild.ownerID) return true // Owner of guild
    return this.hasRoles(this.adminRoles, user, guild)
  }

  /**
   * Checks if a user has DJ roles.
   * @param {Discord.GuildMember|object} user - The user to check. Can also be a Discordie IGuildMember.
   * @param {Duscord.Guild} guild - The guild to check. Not needed if user is an IGuildMember.
   * @return {boolean}
   */
  isDJ (user, guild = user.guild) {
    // always return true for global admins and bot owners
    if (this.admins.indexOf(user.id) >= 0 || this.isOwner(user)) return true
    if (!guild) return false // DMs have no guild object
    if (user.id === guild.ownerID) return true // Owner of guild
    return this.hasRoles(this.djRoles, user, guild) || this.hasRoles(this.adminRoles, user, guild)
  }

  /**
   * Checks if a user is the guild owner.
   * @param {Discord.GuildMember|Discord.User} user - The user or member to check
   * @param {Discord.Guild} guild - The guild to check
   * @return {boolean}
   */
  isGuildOwner (user, guild = user.guild) {
    return user.id === guild.ownerID || this.isOwner(user)
  }

  /**
   * Check if a user is the bot owner
   * @param {Discord.User} user - User to check
   * @return {boolean}
   */
  isOwner (user) {
    return this.owner.indexOf(user.id) >= 0
  }
}

module.exports = PermissionsManager
