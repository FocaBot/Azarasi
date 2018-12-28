import 'reflect-metadata';
import { Module } from './module';
import { CommandOptions } from './command';
/** @hidden Key for command metadata */
export declare const CommandMetaKey: unique symbol;
/** @hidden Command metadata structure */
export interface CommandMetadata {
    name: string;
    trigger?: RegExp;
    options: CommandOptions;
    handler: () => any;
}
/** @hidden Key for event metadata */
export declare const EventMetaKey: unique symbol;
/** @hidden Event metadata structure */
export interface EventMetadata {
    eventName: string;
    handler: () => any;
}
/**
 * Decorator syntax for [[Module.registerCommand]]
 *
 * Can only be applied to methods in a module class.
 *
 * By default, the command name will be the same as the method name, but this can be
 * overridden by explicitly specifying it.
 * @example
 * ```typescript
 *
 * import { registerCommand } from 'azarasi/lib/decorators'
 *
 * export class Ping extends Azarasi.Module {
 *   @registerCommand ping ({ msg } : CommandContext) {
 *     msg.reply('Pong!')
 *   }
 * }
 * ```
 */
export declare function registerCommand(mod: Module, name: string): void;
/**
 * Decorator syntax for [[Module.registerCommand]] with custom name and options.
 *
 * Can only be applied to methods in a module class.
 *
 * Use this syntax if you want the command name to be different from the method name.
 * @param name - Custom command name
 * @param options - Command options
 * @example
 * ```typescript
 *
 * import { registerCommand } from 'azarasi/lib/decorators'
 *
 * export class Ping extends Azarasi.Module {
 *   @registerCommand('superPing', { adminOnly: true })
 *   unrelatedName ({ msg } : CommandContext) {
 *     msg.reply('Super Pong!')
 *   }
 * }
 * ```
 */
export declare function registerCommand(name: string, options?: CommandOptions): (mod: Module, name: string) => void;
/**
 * Decorator syntax for [[Module.registerCommand]] with a RegExp trigger.
 *
 * Can only be applied to methods in a module class.
 *
 * Use this syntax if you want the command to be triggered when a message matches a regular expression.
 * @param trigger - Regular expression that triggers this command.
 * @param options - Custom command options
 * @example
 * ```typescript
 *
 * import { registerCommand } from 'azarasi/lib/decorators'
 *
 * export class Ping extends Azarasi.Module {
 *   @registerCommand(/^bada bing$/)
 *   insertOldGreentextReference ({ msg } : CommandContext) {
 *     msg.reply('bada boom!')
 *   }
 * }
 * ```
 */
export declare function registerCommand(trigger: RegExp, options?: CommandOptions): (mod: Module, name: string) => void;
/**
 * Decorator syntax for [[Module.registerCommand]] with custom options.
 *
 * Can only be applied to methods in a module class.
 *
 * Use this syntax if you want the command name to be the same as the method name, but still want to use custom options.
 * @example
 * ```typescript
 *
 * import { registerCommand } from 'azarasi/lib/decorators'
 *
 * export class Ping extends Azarasi.Module {
 *   @registerCommand({ ownerOnly: true })
 *   omegaPing ({ msg } : CommandContext) {
 *     msg.reply('Omega Pong!')
 *   }
 * }
 * ```
 */
export declare function registerCommand(options?: CommandOptions): (mod: Module, name: string) => void;
/**
 * Decorator syntax for [[Module.registerEvent]]
 *
 * Can only be applied to methods in a module class.
 *
 * The event name will be the same as the method name unless a name is explicitly set.
 * @example
 * ```typescript
 *
 * import { registerEvent } from 'azarasi/lib/decorators'
 *
 * export class Example extends Azarasi.Module {
 *   @registerEvent customEvent () {
 *     this.az.log('customEvent triggered!')
 *   }
 * }
 * ```
 */
export declare function registerEvent(mod: Module, evt: string): void;
/**
 * Decorator syntax for [[Module.registerEvent]]
 *
 * Can only be applied to methods in a module class.
 *
 * Use this syntax to listen to an event other than the method's name.
 * @example
 * ```typescript
 *
 * import { registerEvent } from 'azarasi/lib/decorators'
 *
 * export class Echo extends Azarasi.Module {
 *   @registerEvent('discord.message')
 *   handleMessage (msg : Discord.Message) {
 *     msg.channel.send(msg.content)
 *   }
 * }
 * ```
 */
export declare function registerEvent(evt?: string): (mod: Module, name: string) => void;
