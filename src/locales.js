const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

/**
 * Provides translations
 */
class Locale {
  /**
   * Instantiates a new locale.
   * @param {string} isoCode - ISO_639-1 code of the locale.
   * @param {string} countryCode - ISO 3166-1 alpha-2 code of the country variant.
   */
  constructor (isoCode, countryCode) {
    this.isoCode = isoCode
    this.countryCode = countryCode
  }

  _loadStrings (strings) {
    this.strings = strings
    Object.assign(this, strings, {
      isoCode: this.isoCode,
      countryCode: this.countryCode,
      strings,
      commandMappings: this.commandMappings,
      gen: this.gen
    })
  }

  _loadCommands (commandMappings) {
    this.commandMappings = commandMappings
  }

  /**
   * Generates a string from a template and escapes @here and @everyone mentions.
   * Each argument replaces {n} in the input template.
   * @param {string} template
   * @example
   * locale.gen("User {1} joined the server!", "TheBITLINK") // User TheBITLINK joined the server!
   * locale.gen("Not enough votes ({1}/{2})", count, required) // Not enough votes (4/9)
   * @return {string}
   */
  gen (template) {
    return template.replace(/\{(\d+)\}/g, (m, index) => arguments[index])
    .replace(/@everyone/gi, '@\u200beveryone').replace(/@here/gi, '@\u200bhere')
  }

  /**
   * Generates a string from a template without escaping @here and @everyone.
   * Each argument replaces {n} in the input template.
   * @param {string} template
   * @example
   * locale.ugen("User {1} joined the server!", "TheBITLINK") // User TheBITLINK joined the server!
   * locale.ugen("Not enough votes ({1}/{2})", count, required) // Not enough votes (4/9)
   * locale.ugen("This is a {1} mention", '@here') // This is a @here mention
   * @return {string}
   */
  ugen (template) {
    return template.replace(/\{(\d+)\}/g, (m, index) => arguments[index])
  }
}

/**
 * Manages translations
 */
class LocaleManager {
  constructor () {
    this.loaded = { }
    this.basePath = path.join(Core.properties.localePath || '')
    this.defaultLocale = {}
    if (Core.properties.locale) {
      this.defaultLocale = this.loadLocale(Core.properties.locale) || { }
    }
    Core.Locale = Locale
  }

  /**
   * Loads the specified locale
   * @param {string} name - Name of the locale to load
   */
  loadLocale (name) {
    // Don't load the same locale twice
    if (this.loaded[name]) return
    if (fs.existsSync(path.join(this.basePath, name))) {
      const locale = new Locale(name.split('_')[0], name.split('_')[1])
      // Check for strings
      const stringsFile = path.join(this.basePath, name, 'strings.yml')
      if (fs.existsSync(stringsFile)) {
        const strings = yaml.safeLoad(fs.readFileSync(stringsFile))
        locale._loadStrings(Object.assign({ }, this.defaultLocale.strings || { }, strings))
      }
      // Check for command mappings
      const commandsFile = path.join(this.basePath, name, 'commands.yml')
      if (fs.existsSync(commandsFile)) {
        const commands = yaml.safeLoad(fs.readFileSync(commandsFile))
        locale._loadCommands(commands)
      }
      // Load it
      this.loaded[name] = locale
      return locale
    }
  }

  /**
   * Unloads the specified locale
   * @param {string} name
   */
  unloadLocale (name) {
    if (this.defaultLocale === this.loaded[name]) this.defaultLocale = { }
    delete this.loaded[name]
  }

  /**
   * Reloads the specified locale
   * @param {string} name
   */
  reloadLocale (name) {
    this.unloadLocale(name)
    this.loadLocale(name)
  }

  /**
   * @param {string} name - Locale name
   * @return {Locale} Specified locale or default locale
   */
  getLocale (name) {
    return this.loaded[name] || this.defaultLocale || {}
  }
}

module.exports = LocaleManager
