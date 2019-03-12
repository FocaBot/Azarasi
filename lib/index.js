"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const util_1 = __importDefault(require("util"));
const moment_1 = __importDefault(require("moment"));
const package_json_1 = __importDefault(require("../package.json"));
const events_1 = __importDefault(require("events"));
const chalk_1 = __importDefault(require("chalk"));
const data_1 = __importDefault(require("./data"));
const guilds_1 = require("./guilds");
const moduleManager_1 = require("./moduleManager");
const module_1 = require("./module");
const permissions_1 = require("./permissions");
const command_1 = require("./command");
const commandManager_1 = require("./commandManager");
const locales_1 = require("./locales");
const settings_1 = require("./settings");
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
        this.client = new discord_js_1.default.Client();
        this.shard = this.client.shard;
        this.data = data_1.default(this);
        this.events = new events_1.default();
        this.events.setMaxListeners(1024);
        this.guilds = new guilds_1.GuildManager(this);
        this.permissions = new permissions_1.PermissionHelper(this);
        this.commands = new commandManager_1.CommandManager(this);
        this.modules = new moduleManager_1.ModuleManager(this);
        this.locales = new locales_1.LocaleManager(this);
        this.settings = new settings_1.SettingsManager(this);
        this.client.on('ready', () => {
            this.log(`Connected! (${this.client.user.username}#${this.client.user.discriminator}).`);
            this.ready = true;
            if (this.properties.selfBot) {
                this.permissions.owner.push(this.client.user.id);
            }
            this.events.emit('ready');
        });
        this.client.on('message', msg => this.processMessage(msg));
        this.client.on('debug', m => this.logDebug(m));
        this.client.on('error', e => {
            this.logError('Something went wrong:');
            this.logError(e);
            process.exit(1);
        });
        this.bootDate = moment_1.default();
        this.version = package_json_1.default.version;
    }
    /**
     * Establishes connection with Discord.
     */
    establishConnection() {
        this.client.login(this.properties.token);
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
        const prefix = `[${chalk_1.default.dim.cyan(time.format('YYYY-MM-DD@'))}${chalk_1.default.cyan(time.format('HH:mm'))} ${chalk_1.default.yellow(shard.toString())}]`;
        const msg = args.map(a => (typeof a === 'string' ? a : util_1.default.inspect(a)));
        msg.unshift(prefix);
        if (this.shard && this.properties.logToMaster) {
            this.shard.send({ event: 'az.log', payload: { kind: 'log', message: msg.join(' ') } });
        }
        else {
            console.log(msg.join(' '));
        }
    }
    /**
     * Logs an error to the console with timestamp and shard id
     */
    logError(...args) {
        const time = moment_1.default();
        const shard = this.shard && this.shard.id || 0;
        const prefix = `[${chalk_1.default.dim.red(time.format('YYYY-MM-DD@'))}${chalk_1.default.red(time.format('HH:mm'))} ${chalk_1.default.yellow(shard.toString())}] `;
        const msg = args.map(a => (typeof a === 'string' ? a : util_1.default.inspect(a)));
        msg.unshift(prefix);
        if (this.shard && this.properties.logToMaster) {
            this.shard.send({ event: 'az.log', payload: { kind: 'error', message: msg.join(' ') } });
        }
        else {
            console.error(msg.join(' '));
        }
    }
    /**
     * Logs information to the console (only in debug mode)
     */
    logDebug(...args) {
        if (!this.properties.debug)
            return;
        const time = moment_1.default();
        const shard = this.shard && this.shard.id || 0;
        const prefix = `[${chalk_1.default.dim.cyan(time.format('YYYY-MM-DD@'))}${chalk_1.default.cyan(time.format('HH:mm'))} ${chalk_1.default.yellow(shard.toString())}]`;
        const msg = args.map(a => chalk_1.default.gray(typeof a === 'string' ? a : util_1.default.inspect(a)));
        msg.unshift(prefix);
        if (this.shard && this.properties.logToMaster) {
            this.shard.send({ event: 'az.log', payload: { kind: 'debug', message: msg.join(' ') } });
        }
        else {
            console.info(msg.join(' '));
        }
    }
}
Azarasi.Command = command_1.Command;
Azarasi.Module = module_1.Module;
Azarasi.Locale = locales_1.Locale;
exports.Azarasi = Azarasi;
var command_2 = require("./command");
exports.Command = command_2.Command;
var locales_2 = require("./locales");
exports.Locale = locales_2.Locale;
var module_2 = require("./module");
exports.Module = module_2.Module;
//# sourceMappingURL=index.js.map