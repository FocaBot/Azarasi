import { Module } from './module'
import { CommandOptions } from './command'

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
export function registerCommand(name : string, options ?: CommandOptions) : (mod : Module, name : string)=> void
export function registerCommand(trigger : RegExp, options ?: CommandOptions) : (mod : Module, name : string)=> void
export function registerCommand(options ?: CommandOptions) : (mod : Module, name : string)=> void
export function registerCommand(arg1 ?: string | RegExp | CommandOptions, arg2 ?: CommandOptions) {
  return function (mod : Module, name : string) {
    //@ts-ignore
    const target = mod[name]
    let nameOrTrigger : string | RegExp = name
    let commandOptions : CommandOptions = {}

    if (typeof target !== 'function') throw new Error('@registerCommand() can only be used in module methods.')
    if (typeof arg1 === 'string' || arg1 instanceof RegExp) {
      nameOrTrigger = arg1
      if (typeof arg2 === 'object') commandOptions = arg2
    } else if (typeof arg1 === 'object') {
      commandOptions = arg1
    }

    //@ts-ignore
    mod.registerCommand(nameOrTrigger, commandOptions, target)
  }
}

/**
 * Decorator syntax for module.registerEvent()
 *
 * The event name will be the same as the method name unless a name is explicitly set.
 *
 * @param evt - Event name
 */
export function registerEvent(evt ?: string) {
  return function (mod : Module, name : string) {
    //@ts-ignore
    const target = mod[name]
    const eventName = evt || name

    if (typeof target !== 'function') throw new Error('@registerEvent() can only be used in module methods.')

    mod.registerEvent(eventName, target)
  }
}
