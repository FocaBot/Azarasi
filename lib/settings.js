"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const locales_1 = require("./locales");
/**
 * Manages guild settings
 */
class SettingsManager {
    constructor(az) {
        /** Settings schema */
        this.schema = new Map();
        /** Default values */
        this.defaults = {};
        /**
         * Global defaults
         *
         * Useful to override the default settings defined in the schema
         */
        this.globals = {};
        /**
         * Like globals, but enforced (can't be changed by guild administrators)
         */
        this.overrides = {};
        this.az = az;
        // Built-in settings
        this.register('restrict', { type: Boolean, def: false });
        this.register('prefix', { type: String, def: az.properties.prefix, min: 1 });
        this.register('commandChannel', { type: discord_js_1.default.TextChannel });
        this.register('voiceChannel', { type: discord_js_1.default.VoiceChannel });
        this.register('allowNSFW', { type: Boolean, def: false });
        this.register('locale', { type: locales_1.Locale, def: az.properties.locale });
        this.register('botCommanderRole', { type: String });
        this.register('djRole', { type: String });
    }
    /** Check if a type is valid */
    validateType(type) {
        if (!type)
            throw new Error('No type specified.');
        if ([
            Boolean,
            String,
            Number,
            discord_js_1.default.VoiceChannel,
            discord_js_1.default.TextChannel,
            discord_js_1.default.User,
            locales_1.Locale
        ].indexOf(type) < 0)
            throw new Error('Invalid type specified.');
    }
    /**
     * Registers a parameter to the schema
     * @param key - Key of the parameter
     * @param param - Parameter definition
     */
    register(key, param) {
        this.validateType(param.type);
        this.schema.set(key, param);
        if (param.def != null)
            this.defaults[key] = param.def;
        else
            this.defaults[key] = null;
    }
    /**
     * Unregister parameter from the schema
     * @param key - Key to remove
     */
    unregister(key) {
        if (this.defaults[key])
            delete this.defaults[key];
        this.schema.delete(key);
    }
    /**
     * Gets parameters for a guild
     * @param guild - Guild
     */
    async getForGuild(guild) {
        if (guild) {
            const g = await this.az.guilds.getGuild(guild);
            const gSett = g.data.settings || {};
            // TODO: Exclude parameters from disabled modules
            return Object.freeze(Object.assign({}, this.defaults, this.globals, { gSett }, this.overrides));
        }
        else {
            return Object.freeze(Object.assign({}, this.defaults, this.globals, this.overrides));
        }
    }
    /**
     * Gets a specific parameter from a guild
     * @param guild - Guild
     * @param key - Parameter
     */
    async getGuildParam(guild, key) {
        if (!this.schema.has(key))
            throw new Error(`The parameter "${key}" does not exist.`);
        const sett = await this.getForGuild(guild);
        return sett[key];
    }
    async setGuildParam(guild, key, value) {
        if (!this.schema.has(key))
            throw new Error(`The parameter "${key}" does not exist.`);
        // Fail if an override is set
        if (this.overrides[key] != null)
            throw new Error(`This setting was overriden by the bot owner.`);
        // Get the parameter from the schema
        const param = this.schema.get(key);
        // Load current parameter
        const oldVal = await this.getGuildParam(guild, key);
        let newVal;
        switch (param.type) {
            case Boolean:
                // Positive values
                if (['yes', 'y', 'true', 'on', '1'].indexOf(value.toLowerCase()) >= 0)
                    newVal = true;
                // Negative values
                if (['no', 'n', 'false', 'off', '0'].indexOf(value.toLowerCase()) >= 0)
                    newVal = false;
                break;
            case String:
                newVal = value.toString();
                // Length restrictions
                if (param.min != null && newVal.length < param.min)
                    throw new Error('Value is too short.');
                if (param.max != null && newVal.length > param.max)
                    throw new Error('Value is too long.');
                break;
            case Number:
                newVal = parseFloat(value);
                // Restrictions
                if (param.integer)
                    newVal = parseInt(value);
                if (param.min != null && newVal < param.min)
                    throw new Error('Value is too low.');
                if (param.max != null && newVal > param.max)
                    throw new Error('Value is too high.');
                break;
            case locales_1.Locale:
                const loc = value.toString().split('.')[0];
                const targetLang = loc.split('_')[0];
                const targetCountry = loc.split('_')[1];
                for (const l of this.az.locales.loaded.keys()) {
                    const localeLang = l.split('_')[0];
                    const localeCountry = l.split('_')[1];
                    if (localeLang === targetLang) {
                        if (!targetCountry) {
                            newVal = l;
                            break;
                        }
                        if (localeCountry === targetCountry) {
                            newVal = l;
                            break;
                        }
                    }
                }
                if (!newVal)
                    throw new Error('Invalid language.');
                break;
            // TODO: Beter handling of these types.
            case discord_js_1.default.VoiceChannel:
            case discord_js_1.default.TextChannel:
            case discord_js_1.default.User:
                if (value === '*')
                    newVal = undefined;
                else
                    newVal = value.id || value.match(/\d+/)[0];
                break;
        }
        // Update guild
        const g = await this.az.guilds.getGuild(guild);
        if (!g.data.settings)
            g.data.settings = {};
        g.data.settings[key] = newVal || oldVal;
        await g.saveData();
    }
}
exports.SettingsManager = SettingsManager;
//# sourceMappingURL=settings.js.map