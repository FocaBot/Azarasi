import { Module } from './module';
import { CommandOptions } from './command';
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
export declare function registerEvent(evt?: string): (mod: Module, name: string) => void;
