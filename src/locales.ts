import Azarasi from '.'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

/**
 * Provides translations
 */
export class Locale {
  /** ISO_639-1 code of the locale */
  isoCode : string
  /** ISO 3166-1 alpha-2 code of the country variant */
  countryCode : string
  /** Locale strings */
  strings : LocaleStrings = {}
  /** Locale command mappings */
  commandMappings : CommandMappings = {}

  /**
   * Instantiates a new locale
   * @param isoCode - ISO_639-1 code of the locale.
   * @param countryCode - ISO 3166-1 alpha-2 code of the country variant.
   */
  constructor (isoCode : string, countryCode : string) {
    this.isoCode = isoCode
    this.countryCode = countryCode
  }

  /**
   * Load strings object
   * @param strings - Strings object
   */
  loadStrings (strings : LocaleStrings) {
    Object.assign(this, strings, {
      isoCode: this.isoCode,
      countryCode: this.countryCode,
      strings,
      commandMappings: this.commandMappings,
      gen: this.gen,
      ugen: this.ugen
    })
  }

  /**
   * Load command mappings
   * @param commandMappings - Mappings
   */
  loadCommands (commandMappings : CommandMappings) {
    this.commandMappings = commandMappings
  }

  /**
   * Generates a string from a template and escapes @here and @everyone mentions.
   * Each argument replaces {n} in the input template.
   * @param template - Template string
   * @example
   * locale.gen("User {1} joined the server!", "TheBITLINK") // User TheBITLINK joined the server!
   * locale.gen("Not enough votes ({1}/{2})", count, required) // Not enough votes (4/9)
   */
  gen (template : string, ...args : string[]) {
    return template.replace(/\{(\d+)\}/g, (m, index) => arguments[index - 1])
    .replace(/@everyone/gi, '@\u200beveryone').replace(/@here/gi, '@\u200bhere')
  }

  /**
   * Generates a string from a template without escaping @here and @everyone mentions.
   * Each argument replaces {n} in the input template.
   * @param template - Template string
   * @example
   * locale.gen("User {1} joined the server!", "TheBITLINK") // User TheBITLINK joined the server!
   * locale.gen("Not enough votes ({1}/{2})", count, required) // Not enough votes (4/9)
   * locale.ugen("This is a {1} mention", '@here') // This is a @here mention
   */
  ugen (template : string, ...args : string[]) {
    return template.replace(/\{(\d+)\}/g, (m, index) => arguments[index - 1])
  }
}

/**
 * Manages translations
 */
export class LocaleManager {
  private readonly az : Azarasi
  /** Loaded Locales */
  loaded : Map<string, Locale> = new Map()
  /** Base path for locale files */
  basePath : string
  /** Default locale */
  defaultLocale? : Locale

  constructor (az : Azarasi) {
    this.az = az
    this.basePath = path.join(az.properties.localePath || '')
  }

  /**
   * Load the specified locale
   * @param name - Name of the locale to load
   */
  loadLocale (name : string) : Locale | undefined {
    // Don't load the same locale twice
    if (this.loaded.has(name)) return this.loaded.get(name)
    if (fs.existsSync(path.join(this.basePath, name))) {
      const locale = new Locale(name.split('_')[0], name.split('_')[1])
      // Check for strings
      const stringsFile = path.join(this.basePath, name, 'strings.yml')
      if (fs.existsSync(stringsFile)) {
        const strings = yaml.safeLoad(fs.readFileSync(stringsFile, 'utf-8'))
        locale.loadStrings(Object.assign({ }, this.defaultLocale ? this.defaultLocale.strings : {}, strings))
      }
      // Check for command mappings
      const commandsFile = path.join(this.basePath, name, 'commands.txt')
      if (fs.existsSync(commandsFile)) {
        const commands = yaml.safeLoad(fs.readFileSync(commandsFile, 'utf-8'))
        locale.loadCommands(commands)
      }
      // Load it
      this.loaded.set(name, locale)
      // Default?
      if (this.az.properties.locale && this.az.properties.locale === name) {
        this.defaultLocale = locale
      }
      return locale
    }
  }

  /**
   * Unloads the specified locale
   * @param name - Locale name
   */
  unloadLocale (name : string) {
    if (this.defaultLocale === this.loaded.get(name)) delete this.defaultLocale
    this.loaded.delete(name)
  }

  /**
   * Reload the specified locale
   * @param name - Locale name
   */
  reloadLocale (name : string) {
    this.unloadLocale(name)
    this.loadLocale(name)
  }

  /**
   * Get locale by name
   * @param name - Locale name
   */
  getLocale (name : string) {
    return this.loaded.get(name) || this.defaultLocale
  }
}

/**
 * Locale Strings
 * @hidden
 */
export type LocaleStrings = {
  [key : string]: string | LocaleStrings
}
/**
 * Command Mappings
 * @hidden
 */
export type CommandMappings = {
  [key : string]: string
}
