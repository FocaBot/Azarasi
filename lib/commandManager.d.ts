import Discord from 'discord.js';
import { Azarasi } from '.';
import { Command, CommandHandler, CommandOptions } from './command';
export declare class CommandManager {
    /** Azarasi instance */
    private readonly az;
    private mentionRegex?;
    /** Registered command instances */
    registered: Map<string, Command>;
    /** Plain text-triggered commands (includes all aliases) */
    plain: Map<string, Command>;
    /** RegExp-triggered commands */
    regexes: Map<RegExp, Command>;
    constructor(az: Azarasi);
    /**
     * Register command(s)
     * @param command - [[Command]] instance to register
     * @param commands - Array of [[Command]] instances to register
     * @param name - Command name
     * @param trigger - Command trigger (RegExp)
     * @param options - Command options
     * @param handler - Command handler
     */
    register(command: Command): Command;
    register(commands: Command[]): Command[];
    register(name: string, options: CommandOptions, handler: CommandHandler): Command;
    register(trigger: RegExp, options: CommandOptions, handler: CommandHandler): Command;
    register(name: string, handler: CommandHandler): Command;
    register(trigger: RegExp, handler: CommandHandler): Command;
    /**
     * Find a command by its key (name, alias, regex)
     * @param key - The key to find
     */
    get(key: string | RegExp): Command | undefined;
    /**
     * Unregisters command(s)
     * @param name - The command to unregister (name)
     * @param trigger - The command to unregister (regex)
     * @param command - The command to unregister
     * @param commands - The commands to unregister
     */
    unregister(name: string): void;
    unregister(trigger: RegExp): void;
    unregister(command: Command): void;
    unregister(commands: Command[]): void;
    /**
     * Process a message
     * @param msg - Discord Message
     * @param content - Overrides msg.content
     */
    processMessage(msg: Discord.Message, content?: string): Promise<void>;
    run(cmd: string | Command | RegExp, msg: Discord.Message, args: string | string[] | RegExpExecArray): false | undefined;
}
