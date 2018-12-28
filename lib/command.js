"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            });
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