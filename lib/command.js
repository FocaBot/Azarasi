"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
/**
 * Represents a bot command.
 */
class Command {
    constructor(name, arg1, arg2) {
        this.name = name.toLowerCase();
        if (typeof arg1 === 'function') {
            // The handler is the second argument
            this.handler = arg1;
        }
        else if (typeof arg2 === 'function') {
            this.handler = arg2;
            Object.assign(this, arg1);
        }
        else {
            throw new Error('No handler specified.');
        }
        // Checks
        if (this.regex) {
            if (this.aliases)
                throw new Error("A RegExp command can't specify aliases.");
            if (this.argSeparator || this.includeCommandNameInArgs)
                throw new Error("A RegExp command can't have additional arguments.");
        }
    }
    async exec(msg, args) {
        if (!this.az)
            throw new Error('This command is not registered.');
        try {
            const guild = await this.az.guilds.getGuild(msg.guild);
            const guildData = guild.data;
            const guildSettings = await this.az.settings.getForGuild(msg.guild);
            const guildLocale = await this.az.locales.getLocale(guildSettings.locale || this.az.properties.locale || '');
            const permissions = await this.az.permissions.mapPermissions(msg.author, msg.guild);
            // Check if command execution is not restricted
            if (guildSettings.restrict && !permissions.isDJ)
                return;
            // Check if the message was sent in the command channel
            if (guildSettings.commandChannel && guildSettings.commandChannel !== msg.channel.id && !permissions.isAdmin)
                return;
            // Check for other restrictions
            if (guildData.permissionOverrides && guildData.permissionOverrides[this.name]) {
                switch (guildData.permissionOverrides[this.name]) {
                    case 'dj':
                        if (!permissions.isDJ)
                            return;
                        break;
                    case 'admin':
                        if (!permissions.isAdmin)
                            return;
                        break;
                }
            }
            else {
                if (this.adminOnly && !permissions.isAdmin)
                    return;
                if (this.djOnly && !permissions.isDJ)
                    return;
            }
            if (this.module && await this.module.isDisabledForGuild(msg.guild))
                return;
            // Args to pass to the handler
            let plainArgs = typeof args === 'string' ? [args] : args;
            // Transform/Parse arguments if there's an "argTypes" parameter.
            if (this.argTypes && this.argTypes.length) {
                let typeIndex = 0;
                plainArgs = await Promise.all(plainArgs.map((arg, i) => {
                    // Use the last known type if no type is specified for the current argument
                    if (this.argTypes[i] != null)
                        typeIndex = i;
                    const type = this.argTypes[typeIndex];
                    switch (type) {
                        case String:
                            return arg;
                        case Number:
                            return parseFloat(arg);
                        case Boolean:
                            if (['true', '1', 'y', 'yes', 'on'].indexOf(arg.toLowerCase()) >= 0)
                                return true;
                            if (['false', '0', 'n', 'no', 'off'].indexOf(arg.toLowerCase()) >= 0)
                                return false;
                            return undefined;
                        case discord_js_1.default.User:
                            const userId = arg.match(/\d+/);
                            if (userId) {
                                return this.az.client.fetchUser(userId[0]).catch(() => undefined);
                            }
                            return undefined;
                        case discord_js_1.default.GuildMember:
                            const memberId = arg.match(/\d+/);
                            if (memberId) {
                                return msg.guild.fetchMember(memberId[0]).catch(() => undefined);
                            }
                            return undefined;
                        case discord_js_1.default.TextChannel:
                            const channelId = arg.match(/\d+/);
                            if (channelId) {
                                return msg.guild.channels.find(c => c.type === 'text' && c.id === channelId[0]);
                            }
                            return undefined;
                        default:
                            throw new Error(`Couldn't parse argument #${i + 1} of command ${this.name}. ` +
                                `Invalid type specified. (${type.name}).` +
                                'Valid types are: String, Boolean, Number, User, GuildMember, TextChannel');
                    }
                }));
            }
            await this.handler.call(this.module || this, {
                // Message
                msg,
                message: msg,
                m: msg,
                // Arguments
                args,
                arguments: args,
                a: args,
                // Data
                guildData,
                data: guildData,
                d: guildData,
                // Settings
                guildSettings,
                settings: guildSettings,
                s: guildSettings,
                // Locale
                guildLocale,
                locale: guildLocale,
                l: guildLocale,
                // Permissions
                permissions,
                perms: permissions,
                p: permissions,
                // Client
                b: msg.client,
                bot: msg.client,
                client: msg.client,
                // Azarasi
                core: this.az,
                azarasi: this.az,
                az: this.az
            }, ...plainArgs);
        }
        catch (e) {
            this.az.logError(e);
        }
    }
    toString() {
        return this.name;
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map