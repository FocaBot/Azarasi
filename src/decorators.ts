import 'reflect-metadata'
import { Module } from './module'
import { CommandOptions } from './command'

/** @hidden Key for command metadata */
export const CommandMetaKey = Symbol('azarasiCommand')
/** @hidden Command metadata structure */
export interface CommandMetadata {
  name : string,
  trigger? : RegExp,
  options : CommandOptions
  handler : ()=> any
}

/** @hidden Key for event metadata */
export const EventMetaKey = Symbol('azarasiEvent')
/** @hidden Event metadata structure */
export interface EventMetadata {
  eventName : string,
  handler : ()=> any
}

/**
 * Helper function to define metadata.
 * @param target - Target object
 * @param key - Target key
 * @param obj - Metadata to push
 * @hidden
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
export function registerCommand(mod : Module, name : string) : void
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
export function registerCommand(name : string, options? : CommandOptions) : (mod : Module, name : string)=> void
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
export function registerCommand(trigger : RegExp, options? : CommandOptions) : (mod : Module, name : string)=> void
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
export function registerCommand(options? : CommandOptions) : (mod : Module, name : string)=> void
export function registerCommand(arg1? : string | RegExp | CommandOptions | Module, arg2? : CommandOptions | string) {
  const injectMetadata = function (mod : Module, name : string) {
    //@ts-ignore
    const target = mod[name]
    if (typeof target !== 'function') throw new Error('@registerCommand can only be used in module methods.')

    const meta : CommandMetadata = {
      name: typeof arg1 === 'string' ? arg1 : name,
      trigger: arg1 instanceof RegExp ? arg1 : undefined,
      options: {} as CommandOptions,
      handler: target
    }

    if (typeof arg2 === 'object') {
      meta.options = arg2
    } else if (typeof arg1 === 'object' && !(arg1 instanceof Module || arg1 instanceof RegExp)) {
      meta.options = arg1
    }

    // Try to guess argument types based on typescript metadata
    const paramTypes = Reflect.getMetadata('design:paramtypes', mod, name)
    if (paramTypes && !meta.options.argTypes) {
      // Skip the first argument since it's always the command context.
      meta.options.argTypes = paramTypes.slice(1)
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
export function registerEvent(mod : Module, evt : string) : void
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
export function registerEvent(evt? : string) : (mod : Module, name : string)=> void
export function registerEvent(arg1? : Module | string, arg2? : string) {
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
