import Azarasi from '.'
import Discord from 'discord.js'

/**
 * Permissions System (based on roles)
 */
export class PermissionHelper {
  private readonly az : Azarasi

  constructor (az : Azarasi) {
    this.az = az
  }

  /** Owner IDs */
  get owner () {
    return this.az.properties.owner || []
  }

  /** Global Admin IDs */
  get admins () {
    return this.az.properties.admins || []
  }

  /** Admin role names */
  get adminRoles () {
    return this.az.properties.adminRoles || []
  }
  
  /** DJ role names */
  get djRoles () {
    return this.az.properties.djRoles || []
  }

  /**
   * Check if a users has certain roles (by name)
   * Only one of the roles has to match
   * @param role - Role to find
   * @param roles - Roles to find
   * @param member - Member to perform the search in
   * @param user - User to perform the search in
   * @param guild - Guild to perform the search in
   */
  hasRoles (role : string, member : Discord.GuildMember) : boolean
  hasRoles (roles : string[], member : Discord.GuildMember) : boolean
  hasRoles (role : string, user : Discord.User, guild : Discord.Guild) : boolean
  hasRoles (roles : string[], user : Discord.User) : boolean
  hasRoles (roles : string[], user : Discord.User, guild : Discord.Guild) : boolean
  hasRoles (roles : string | string[], user : Discord.User | Discord.GuildMember, g? : Discord.Guild) : boolean {
    const guild = user instanceof Discord.GuildMember ? user.guild : g
    if (!guild) return false // DMs have no guild object or roles
    const member = user instanceof Discord.GuildMember ? user : guild.members.find('id', user.id)
    if (!member) return false // This should never happen
    const r = typeof roles === 'string' ? [ roles ] : roles
    return member.roles.reduce((a, b) => a || r.indexOf(b.name) >= 0, false)
  }

  /**
   * Check if a user has admin rights
   * @param user - User to check
   * @param g - Guild
   * @param globalOnly - Global admins only
   */
  async isAdmin (user : Discord.User | Discord.GuildMember, guild? : Discord.Guild, globalOnly : boolean = false) {
    // Always return true for global admins and bot owners
    if (this.admins.indexOf(user.id) >= 0 || this.isOwner(user)) return true
    if (globalOnly) return false
    const g = user instanceof Discord.GuildMember ? user.guild : guild
    if (!g) return false
    const member = user instanceof Discord.GuildMember ? user : g.members.find('id', user.id)
    // Return true for guild owners, administrators or people with "Mage Guild"
    if (member.hasPermission('MANAGE_GUILD', false, true, true)) return true
    // Fall back to Bot Commander role
    const { botCommanderRole } = await this.az.settings.getForGuild(g)
    return this.hasRoles(botCommanderRole ? [botCommanderRole] : this.adminRoles, member)
  }

  async isDJ (user : Discord.User | Discord.GuildMember, guild? : Discord.Guild) {
    const g = user instanceof Discord.GuildMember ? user.guild : guild
    if (!g) return false
    const member = user instanceof Discord.GuildMember ? user : g.members.find('id', user.id)
    // Check if the user is admin
    if (await this.isAdmin(member)) return true
    // Fall back to DJ role
    const { djRole } = await this.az.settings.getForGuild(g)
    return this.hasRoles(djRole ? [djRole] : this.djRoles, member)
  }

  /**
   * Check if a user is the bot owner
   * @param user - User to check
   */
  isOwner (user : Discord.User | Discord.GuildMember) {
    return this.owner.indexOf(user.id) >= 0
  }

  /**
   * Map permissions for a single user
   * @param user - User to check
   * @param guild - User guild
   */
  async mapPermissions (user : Discord.User | Discord.GuildMember, guild : Discord.Guild) : Promise<UserPermissions> {
    return {
      isOwner: await this.isOwner(user),
      isAdmin: await this.isAdmin(user, guild),
      isDJ: await this.isDJ(user, guild),
      //@ts-ignore
      hasRoles: (roles : string[]) => this.hasRoles(roles, user, guild)
    }
  }
}

export interface UserPermissions {
  /** True if the user is the bot owner */
  isOwner : boolean
  /** True if the user is an administrator */
  isAdmin : boolean
  /** True if the user is a DJ */
  isDJ : boolean
  /** Check if the user has one of the specified role (names) */
  hasRoles : (roles : string[]) => boolean
}