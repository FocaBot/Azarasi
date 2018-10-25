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
     * Register a command and link it to this Azarasi instance.
     * @param command - [[Command]] instance to register
     */
    register(command: Command): Command;
    /**
     * Register an array of commands and link them to this Azarasi instance.
     * @param commands - Array of [[Command]] instances to register
     */
    register(commands: Command[]): Command[];
    /**
     * Register a command.
     * @param name - Command name
     * @param options - Command options
     * @param handler - Command handler
     */
    register(name: string, options: CommandOptions, handler: CommandHandler): Command;
    /**
     * Register a regex triggered command.
     * @param trigger - Command trigger
     * @param options - Command options
     * @param handler - Command handler
     */
    register(trigger: RegExp, options: CommandOptions, handler: CommandHandler): Command;
    /**
     * Register a command with the default options.
     * @param name - Command name
     * @param handler - Command handler
     */
    register(name: string, handler: CommandHandler): Command;
    /**
     * Register a regex triggered command with the default options.
     * @param trigger - Command trigger
     * @param handler - Command handler
     */
    register(trigger: RegExp, handler: CommandHandler): Command;
    /**
     * Find a command by its key (name, alias, regex)
     * @param key - The key to find
     */
    get(key: string | RegExp): Command | undefined;
    /**
     * Unregisters a command
     * @param name - Command to unregister (name)
     */
    unregister(name: string): void;
    /**
     * Unregisters a regex triggered command.
     * @param trigger - Command to unregister (RegExp trigger)
     */
    unregister(trigger: RegExp): void;
    /**
     * Unregisters a command instance.
     * @param command - Command instance to unregister
     */
    unregister(command: Command): void;
    /**
     * Unregisters multiple command instances.
     * @param commands - Command instances to unregister
     */
    unregister(commands: Command[]): void;
    /**
     * Process a message
     * @param msg - Discord Message
     * @param content - Overrides msg.content
     */
    processMessage(msg: Discord.Message, content?: string): Promise<void>;
    run(cmd: string | Command | RegExp, msg: Discord.Message, args: string | string[] | RegExpExecArray): false | undefined;
}
