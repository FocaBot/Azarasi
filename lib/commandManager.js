"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("./command");
class CommandManager {
    constructor(az) {
        /** Registered command instances */
        this.registered = new Map();
        /** Plain text-triggered commands (includes all aliases) */
        this.plain = new Map();
        /** RegExp-triggered commands */
        this.regexes = new Map();
        this.az = az;
        az.events.on('ready', () => {
            this.mentionRegex = new RegExp(`^<@!?${az.client.user.id}>\\s?(\\S+)([\\w\\W]*)`);
        });
    }
    register(arg1, arg2, arg3) {
        // Command array
        if (arg1 instanceof Array) {
            return arg1.map(c => this.register(c));
        }
        let command;
        if (arg1 instanceof command_1.Command) {
            command = arg1;
        }
        else {
            const name = arg1.toString();
            if (typeof arg2 === 'function') {
                // Name, Handler
                const options = arg1 instanceof RegExp ? { regex: arg1 } : {};
                command = new command_1.Command(name, options, arg2);
            }
            else if (typeof arg2 === 'object' && typeof arg3 === 'function') {
                // Name, Options, Handler
                const options = arg1 instanceof RegExp ? Object.assign({}, arg2, { regex: arg1 }) : arg2;
                command = new command_1.Command(name, options, arg3);
            }
            else {
                throw new Error('No handler specified.');
            }
        }
        // Link Azarasi instance
        command.az = this.az;
        // Register triggers
        if (arg1 instanceof RegExp) {
            // RegExp command
            this.regexes.set(arg1, command);
        }
        else {
            const aliases = [command.name].concat(command.aliases || []);
            aliases.forEach(alias => this.plain.set(alias, command));
        }
        // Check if the command already exists and log a warning if it does.
        if (this.registered.has(command.name)) {
            this.az.log(`WARNING: A command called "${command.name}" already exists! The previous command will be overwritten.`);
        }
        // Map command
        this.registered.set(command.name, command);
        return command;
    }
    /**
     * Find a command by its key (name, alias, regex)
     * @param key - The key to find
     */
    get(key) {
        const k = key.toString();
        return this.registered.get(k) || this.plain.get(k);
    }
    unregister(cmd) {
        if (cmd instanceof Array) {
            return cmd.forEach(c => this.unregister(c));
        }
        const command = cmd instanceof command_1.Command ? cmd : this.get(cmd);
        if (!command)
            throw new Error('Command not found');
        // Remove link
        delete command.az;
        // Remove all references
        this.registered.forEach((val, key, map) => val === command && map.delete(key));
        this.plain.forEach((val, key, map) => val === command && map.delete(key));
        this.regexes.forEach((val, key, map) => val === command && map.delete(key));
    }
    /**
     * Process a message
     * @param msg - Discord Message
     * @param content - Overrides msg.content
     */
    async processMessage(msg, content = msg.content) {
        const az = this.az;
        const s = await az.settings.getForGuild(msg.guild);
        let commandName;
        let args = '';
        // Global prefix
        let pfx = az.properties.prefix;
        // Selfbot public prefix
        if (az.properties.selfBot && az.properties.publicPrefix && msg.author.id !== az.client.user.id) {
            pfx = az.properties.publicPrefix;
        }
        // Guild Prefix
        if (s.prefix && content.toLowerCase().indexOf(s.prefix.toLowerCase()) === 0) {
            pfx = s.prefix;
        }
        // Prefixed command
        if (pfx && content.toLowerCase().indexOf(pfx.toLowerCase()) === 0) {
            const cmdText = content.slice(pfx.length).trim().split(' ');
            commandName = cmdText[0].toLowerCase();
            args = cmdText.slice(1).join(' ');
        }
        // Bot mention
        const match = this.mentionRegex ? content.match(this.mentionRegex) : false;
        if (match) {
            commandName = match[1].toLowerCase();
            args = match[2].trim();
        }
        // Regex commands
        for (const regexCmd of this.regexes.keys()) {
            const match = regexCmd.exec(content);
            if (match) {
                commandName = regexCmd.toString();
                args = match;
            }
        }
        // Get the command
        if (!commandName)
            return;
        const command = this.get(commandName);
        if (!command)
            return;
        if (command.argSeparator && typeof args === 'string')
            args = args.split(command.argSeparator);
        // Run the command
        try {
            this.run(command, msg, args);
        }
        catch (e) {
            az.logError(e);
        }
    }
    run(cmd, msg, args) {
        const az = this.az;
        // Get the command
        const command = (cmd instanceof command_1.Command) ? cmd : this.get(cmd);
        const name = (cmd instanceof command_1.Command) ? cmd.name : cmd;
        if (!command)
            return false;
        // Check if it can be executed
        if (!msg.guild && !command.allowDM)
            return;
        if (az.properties.selfBot && !command.everyone && msg.author.id !== az.client.user.id)
            return;
        if (command.ownerOnly && !az.permissions.isOwner(msg.author))
            return;
        if (command.requiredPermissions && !msg.member.hasPermission(command.requiredPermissions))
            return;
        if (command.requiredRoles && !az.permissions.hasRoles(command.requiredRoles, msg.author, msg.guild))
            return;
        const a = !command.regex && command.includeCommandNameInArgs ? [name].concat(args) : args;
        //@ts-ignore
        command.exec(msg, a);
    }
}
exports.CommandManager = CommandManager;
//# sourceMappingURL=commandManager.js.map