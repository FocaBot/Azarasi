const Discord = require('discord.js')

/**
 * Handles Guild Specific Settings
 */
class SettingsManager {
  constructor () {
    /**
     * Settings Schema.
     * DO NOT MODIFY THIS DIRECTLY. Use the .register() and .unregister() methods instead.
     * @type {object}
     */
    this.schema = { }
    /**
     * Default values for settings. Do not touch either.
     * @type {object}
     */
    this.defaults = { }
    /**
     * Global defaults.
     * Useful to override defaults without having to change the schema.
     * @type {object}
     */
    this.globals = { }
    /**
     * Like globals, but forced.
     * @type {object}
     */
    this.overrides = { }
    // Built-in settings
    this.register('restrict', { type: Boolean, def: false })
    this.register('prefix', { type: String, def: Core.properties.prefix, min: 1 })
    this.register('commandChannel', { type: Discord.TextChannel })
    this.register('voiceChannel', { type: Discord.VoiceChannel })
    this.register('allowNSFW', { type: Boolean, def: false })
    this.register('locale', { type: Core.Locale, def: Core.properties.locale })
  }

  /**
   * Checks if a type is valid.
   * @param {*} type
   */
  validateType (type) {
    if (!type) throw new Error('No type specified.')
    if ([
      Boolean,
      String,
      Number,
      Discord.VoiceChannel,
      Discord.TextChannel,
      Discord.User,
      Core.Locale
    ].indexOf(type) < 0) throw new Error('Invalid type specified.')
  }

  /**
   * Registers a setting parameter to the schema.
   * @param {string} key - Key of the parameter
   * @param {object} params - Parameters
   * @param {*} params.type - Type of the parameter (Boolean, String, Number, etc)
   * @param {*} params.def - Default value of the parameter.
   * @param {number} params.min - For numbers, it specifies the minimum value, for strings, the minimum length.
   * @param {number} params.max - Same as above, but it specifies the maximum value or length.
   * @param {boolean} params.integer - For the "number" type, only accept integers.
   */
  register (key, params) {
    this.validateType(params.type)
    this.schema[key] = params
    if (params.def) this.defaults[key] = params.def
  }

  /**
   * Unregisters a setting parameter from the schema.
   * @param {string} key - Key to remove
   */
  unregister (key) {
    if (this.defaults[key]) delete this.defaults[key]
    if (this.schema[key]) delete this.schema[key]
  }

  /**
   * Gets all the parameters from a guild
   * @param {Discord.Guild} guild
   */
  async getForGuild (guild) {
    if (guild) {
      const g = await Core.guilds.getGuild(guild)
      const gSett = g.data.settings || {}
      // TODO: Exclude parameters from disabled modules
      return Object.freeze(Object.assign({}, this.defaults, this.globals, gSett, this.overrides))
    } else {
      return Object.freeze(Object.assign({}, this.defaults, this.globals, this.overrides))
    }
  }

  /**
   * Gets a specific parameter from a guild
   * @param {Discord.Guild} guild
   * @param {string} key
   */
  async getGuildParam (guild, key) {
    if (!this.schema[key]) throw new Error(`The parameter "${key}" does not exist.`)
    const sett = await this.getForGuild(guild)
    return sett[key]
  }

  async setGuildParam (guild, key, value) {
    if (!this.schema[key]) throw new Error(`The parameter "${key}" does not exist.`)
    // Fail if an override is set
    if (this.overrides[key] != null) throw new Error(`This setting was overriden by the bot owner.`)
    // Get the parameters from the schema
    const params = this.schema[key]
    this.validateType(params.type)
    // Load current parameter
    let newVal = await this.getGuildParam(guild, key)
    switch (params.type) {
      case Boolean:
        // Positive Answers
        if (['yes', 'y', 'true', 'on', '1'].indexOf(value.toLowerCase()) >= 0) newVal = true
        if (['no', 'n', 'false', 'off', '0'].indexOf(value.toLowerCase()) >= 0) newVal = false
        break
      case String:
        newVal = value.toString()
        if (params.min != null && newVal.length < params.min) throw new Error('Value is too short.')
        if (params.max != null && newVal.length > params.max) throw new Error('Value is too long.')
        break
      case Number:
        newVal = parseFloat(value)
        if (params.integer) newVal = parseInt(value)
        if (params.min != null && newVal < params.min) throw new Error('Value is too low.')
        if (params.max != null && newVal > params.max) throw new Error('Value is too high.')
        break
      // TODO: Beter handling of these types.
      case Discord.VoiceChannel:
      case Discord.TextChannel:
      case Discord.User:
        if (value === '*') newVal = undefined
        else newVal = value.id || value.match(/\d+/)[0]
        break
    }
    const g = await Core.guilds.getGuild(guild)
    g.data.settings[key] = newVal
    await g.saveData()
  }
}

module.exports = SettingsManager
