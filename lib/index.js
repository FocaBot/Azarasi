"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("colors");
const discord_js_1 = __importDefault(require("discord.js"));
const util_1 = __importDefault(require("util"));
const moment_1 = __importDefault(require("moment"));
const package_json_1 = __importDefault(require("../package.json"));
const events_1 = __importDefault(require("events"));
const data_1 = __importDefault(require("./data"));
const guilds_1 = require("./guilds");
const moduleManager_1 = require("./moduleManager");
const module_1 = require("./module");
const permissions_1 = require("./permissions");
const command_1 = require("./command");
const commandManager_1 = require("./commandManager");
const locales_1 = require("./locales");
const settings_1 = require("./settings");
// @ts-ignore
const Ffmpeg_1 = __importDefault(require("prism-media/src/transcoders/ffmpeg/Ffmpeg"));
/**
 * The mother of all seals
 */
class Azarasi {
    constructor(properties) {
        /** Is the bot ready? */
        this.ready = false;
        this.properties = properties;
        // Checks
        if (!properties.token)
            throw new Error('You must specify a bot token!');
        this.bot = new discord_js_1.default.Client();
        this.shard = this.bot.shard;
        this.data = data_1.default(this);
        this.events = new events_1.default();
        this.events.setMaxListeners(1024);
        this.guilds = new guilds_1.GuildManager(this);
        this.permissions = new permissions_1.PermissionHelper(this);
        this.commands = new commandManager_1.CommandManager(this);
        this.modules = new moduleManager_1.ModuleManager(this);
        this.locales = new locales_1.LocaleManager(this);
        this.settings = new settings_1.SettingsManager(this);
        this.bot.on('ready', () => {
            this.log(`Connected! (${this.bot.user.username}#${this.bot.user.discriminator}).`);
            this.ready = true;
            if (this.properties.selfBot) {
                this.permissions.owner.push(this.bot.user.id);
            }
            this.events.emit('ready');
        });
        this.bot.on('message', msg => this.processMessage(msg));
        this.bot.on('debug', m => this.logDebug(m));
        this.bot.on('error', e => {
            this.logError('Something went wrong:');
            this.logError(e);
            process.exit(1);
        });
        // hacks
        if (this.properties.ffmpegBin) {
            Ffmpeg_1.default.selectFfmpegCommand = () => this.properties.ffmpegBin;
        }
        this.bootDate = moment_1.default();
        this.version = package_json_1.default.version;
    }
    /**
     * Establishes connection with Discord.
     */
    establishConnection() {
        this.bot.login(this.properties.token);
    }
    /**
     * Processes messages.
     * @param msg - Discord.js message object
     */
    processMessage(msg) {
        if (this.properties.blacklist && this.properties.blacklist.indexOf(msg.author.id) >= 0) {
            return; // blacklisted user
        }
        this.commands.processMessage(msg);
    }
    /**
     * Logs stuff to the console with timestamp and shard id
     */
    log(...args) {
        const time = moment_1.default();
        const shard = this.shard && this.shard.id || 0;
        const prefix = `[${time.format('YYYY-MM-DD@').dim.cyan}${time.format('HH:mm').cyan} ${shard.toString().yellow}]`;
        console.log(prefix, ...args);
    }
    /**
     * Logs an error to the console with timestamp and shard id
     */
    logError(...args) {
        const time = moment_1.default();
        const shard = this.shard && this.shard.id || 0;
        const prefix = `[${time.format('YYYY-MM-DD@').dim.red}${time.format('HH:mm').red} ${shard.toString().yellow}] `;
        console.error(prefix, ...args);
    }
    /**
     * Logs information to the console (only in debug mode)
     */
    logDebug(...args) {
        if (!this.properties.debug)
            return;
        const time = moment_1.default();
        const shard = this.shard && this.shard.id || 0;
        const prefix = `[${time.format('YYYY-MM-DD@').dim.cyan}${time.format('HH:mm').cyan} ${shard.toString().yellow}]`;
        const msg = args.map(a => (typeof a === 'string' ? a : util_1.default.inspect(a)).gray);
        msg.unshift(prefix);
        console.log(msg.join(' '));
    }
}
Azarasi.Command = command_1.Command;
Azarasi.Module = module_1.Module;
Azarasi.Locale = locales_1.Locale;
exports.Azarasi = Azarasi;
//# sourceMappingURL=index.js.map