"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Provides translations
 */
class Locale {
    /**
     * Instantiates a new locale
     * @param isoCode - ISO_639-1 code of the locale.
     * @param countryCode - ISO 3166-1 alpha-2 code of the country variant.
     */
    constructor(isoCode, countryCode) {
        /** Locale strings */
        this.strings = {};
        /** Locale command mappings */
        this.commandMappings = {};
        this.isoCode = isoCode;
        this.countryCode = countryCode;
    }
    /**
     * Load strings object
     * @param strings - Strings object
     */
    loadStrings(strings) {
        Object.assign(this, strings, {
            isoCode: this.isoCode,
            countryCode: this.countryCode,
            strings,
            commandMappings: this.commandMappings,
            gen: this.gen,
            ugen: this.ugen
        });
    }
    /**
     * Load command mappings
     * @param commandMappings - Mappings
     */
    loadCommands(commandMappings) {
        this.commandMappings = commandMappings;
    }
    /**
     * Generates a string from a template and escapes @here and @everyone mentions.
     * Each argument replaces {n} in the input template.
     * @param template - Template string
     * @example
     * locale.gen("User {1} joined the server!", "TheBITLINK") // User TheBITLINK joined the server!
     * locale.gen("Not enough votes ({1}/{2})", count, required) // Not enough votes (4/9)
     */
    gen(template, ...args) {
        return template.replace(/\{(\d+)\}/g, (m, index) => arguments[index - 1])
            .replace(/@everyone/gi, '@\u200beveryone').replace(/@here/gi, '@\u200bhere');
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
    ugen(template, ...args) {
        return template.replace(/\{(\d+)\}/g, (m, index) => arguments[index - 1]);
    }
}
exports.Locale = Locale;
/**
 * Manages translations
 */
class LocaleManager {
    constructor(az) {
        /** Loaded Locales */
        this.loaded = new Map();
        this.az = az;
        this.basePath = path_1.default.join(az.properties.localePath || '');
    }
    /**
     * Load the specified locale
     * @param name - Name of the locale to load
     */
    loadLocale(name) {
        // Don't load the same locale twice
        if (this.loaded.has(name))
            return this.loaded.get(name);
        if (fs_1.default.existsSync(path_1.default.join(this.basePath, name))) {
            const locale = new Locale(name.split('_')[0], name.split('_')[1]);
            // Check for strings
            const stringsFile = path_1.default.join(this.basePath, name, 'strings.yml');
            if (fs_1.default.existsSync(stringsFile)) {
                const strings = js_yaml_1.default.safeLoad(fs_1.default.readFileSync(stringsFile, 'utf-8'));
                locale.loadStrings(Object.assign({}, this.defaultLocale ? this.defaultLocale.strings : {}, strings));
            }
            // Check for command mappings
            const commandsFile = path_1.default.join(this.basePath, name, 'commands.txt');
            if (fs_1.default.existsSync(commandsFile)) {
                const commands = js_yaml_1.default.safeLoad(fs_1.default.readFileSync(commandsFile, 'utf-8'));
                locale.loadCommands(commands);
            }
            // Load it
            this.loaded.set(name, locale);
            // Default?
            if (this.az.properties.locale && this.az.properties.locale === name) {
                this.defaultLocale = locale;
            }
            return locale;
        }
    }
    /**
     * Unloads the specified locale
     * @param name - Locale name
     */
    unloadLocale(name) {
        if (this.defaultLocale === this.loaded.get(name))
            delete this.defaultLocale;
        this.loaded.delete(name);
    }
    /**
     * Reload the specified locale
     * @param name - Locale name
     */
    reloadLocale(name) {
        this.unloadLocale(name);
        this.loadLocale(name);
    }
    /**
     * Get locale by name
     * @param name - Locale name
     */
    getLocale(name) {
        return this.loaded.get(name) || this.defaultLocale;
    }
}
exports.LocaleManager = LocaleManager;
//# sourceMappingURL=locales.js.map