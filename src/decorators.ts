import 'reflect-metadata'
import { Module } from './module'
import { CommandOptions } from './command'

/** Key for command metadata */
export const CommandMetaKey = Symbol('azarasiCommand')
/** Command metadata structure */
export interface CommandMetadata {
  name : string,
  trigger ?: RegExp,
  options : CommandOptions
  handler : ()=> any
}

/** Key for event metadata */
export const EventMetaKey = Symbol('azarasiEvent')
/** Event metadata structure */
export interface EventMetadata {
  eventName : string,
  handler : ()=> any
}

/**
 * Helper function to define metadata.
 * @param target - Target object
 * @param key - Target key
 * @param obj - Metadata to push
 */
function pushMetadata<T>(target : object, key : symbol, obj : T) {
  const metadata : T[]  = Reflect.getMetadata(key, target)
  if (metadata) {
    metadata.push(obj)
  } else {
    Reflect.defineMetadata(key, [ obj ], target)
  }
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
export function registerCommand(mod : Module, name : string) : void
export function registerCommand(name : string, options ?: CommandOptions) : (mod : Module, name : string)=> void
export function registerCommand(trigger : RegExp, options ?: CommandOptions) : (mod : Module, name : string)=> void
export function registerCommand(options ?: CommandOptions) : (mod : Module, name : string)=> void
export function registerCommand(arg1 ?: string | RegExp | CommandOptions | Module, arg2 ?: CommandOptions | string) {
  const injectMetadata = function (mod : Module, name : string) {
    //@ts-ignore
    const target = mod[name]
    if (typeof target !== 'function') throw new Error('@registerCommand can only be used in module methods.')

    const meta : CommandMetadata = {
      name: typeof arg1 === 'string' ? arg1 : name,
      trigger: arg1 instanceof RegExp ? arg1 : undefined,
      options: {},
      handler: target
    }

    if (typeof arg2 === 'object') {
      meta.options = arg2
    } else if (typeof arg1 === 'object' && !(arg1 instanceof Module || arg1 instanceof RegExp)) {
      meta.options = arg1
    }

    pushMetadata(mod, CommandMetaKey, meta)
  }

  if (arg1 instanceof Module && typeof arg2 === 'string') {
    injectMetadata(arg1, arg2)
  } else {
    return injectMetadata
  }
}

/**
 * Decorator syntax for module.registerEvent()
 *
 * The event name will be the same as the method name unless a name is explicitly set.
 *
 * @param evt - Event name
 */
export function registerEvent(mod : Module, evt : string) : void
export function registerEvent(evt ?: string) : (mod : Module, name : string)=> void
export function registerEvent(arg1 ?: Module | string, arg2 ?: string) {
  const injectMetadata = function (mod : Module, name : string) {
    //@ts-ignore
    const target = mod[name]
    if (typeof target !== 'function') throw new Error('@registerEvent can only be used in module methods.')

    const meta : EventMetadata = {
      eventName: typeof arg1 === 'string' ? arg1 : name,
      handler: target
    }

    pushMetadata(mod, EventMetaKey, meta)
  }

  if (arg1 instanceof Module && typeof arg2 === 'string') {
    injectMetadata(arg1, arg2)
  } else {
    return injectMetadata
  }
}
