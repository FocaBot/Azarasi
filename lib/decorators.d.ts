import 'reflect-metadata';
import { Module } from './module';
import { CommandOptions } from './command';
/** Key for command metadata */
export declare const CommandMetaKey: unique symbol;
/** Command metadata structure */
export interface CommandMetadata {
    name: string;
    trigger?: RegExp;
    options: CommandOptions;
    handler: () => any;
}
/** Key for event metadata */
export declare const EventMetaKey: unique symbol;
/** Event metadata structure */
export interface EventMetadata {
    eventName: string;
    handler: () => any;
}
/**
 * Decorator syntax for module.registerCommand()
 * Can only be applied to methods in a module class.
 *
 * By default, the command name will be the same as the method name, but this can be
 * overridden by explicitly specifying it.
 *
 * @param name - Command name. If left blank, the method name will be used.
 * @param trigger - RegExp trigger.
 * @param options - Command options.
 */
export declare function registerCommand(mod: Module, name: string): void;
export declare function registerCommand(name: string, options?: CommandOptions): (mod: Module, name: string) => void;
export declare function registerCommand(trigger: RegExp, options?: CommandOptions): (mod: Module, name: string) => void;
export declare function registerCommand(options?: CommandOptions): (mod: Module, name: string) => void;
/**
 * Decorator syntax for module.registerEvent()
 *
 * The event name will be the same as the method name unless a name is explicitly set.
 *
 * @param evt - Event name
 */
export declare function registerEvent(mod: Module, evt: string): void;
export declare function registerEvent(evt?: string): (mod: Module, name: string) => void;
