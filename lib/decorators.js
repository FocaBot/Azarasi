"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const module_1 = require("./module");
/** @hidden Key for command metadata */
exports.CommandMetaKey = Symbol('azarasiCommand');
/** @hidden Key for event metadata */
exports.EventMetaKey = Symbol('azarasiEvent');
/**
 * Helper function to define metadata.
 * @param target - Target object
 * @param key - Target key
 * @param obj - Metadata to push
 * @hidden
 */
function pushMetadata(target, key, obj) {
    const metadata = Reflect.getMetadata(key, target);
    if (metadata) {
        metadata.push(obj);
    }
    else {
        Reflect.defineMetadata(key, [obj], target);
    }
}
function registerCommand(arg1, arg2) {
    const injectMetadata = function (mod, name) {
        //@ts-ignore
        const target = mod[name];
        if (typeof target !== 'function')
            throw new Error('@registerCommand can only be used in module methods.');
        const meta = {
            name: typeof arg1 === 'string' ? arg1 : name,
            trigger: arg1 instanceof RegExp ? arg1 : undefined,
            options: {},
            handler: target
        };
        if (typeof arg2 === 'object') {
            meta.options = arg2;
        }
        else if (typeof arg1 === 'object' && !(arg1 instanceof module_1.Module || arg1 instanceof RegExp)) {
            meta.options = arg1;
        }
        // Try to guess argument types based on typescript metadata
        const paramTypes = Reflect.getMetadata('design:paramtypes', mod, name);
        if (paramTypes) {
            // Skip the first argument since it's always the command context.
            meta.options.argTypes = paramTypes.slice(1);
        }
        pushMetadata(mod, exports.CommandMetaKey, meta);
    };
    if (arg1 instanceof module_1.Module && typeof arg2 === 'string') {
        injectMetadata(arg1, arg2);
    }
    else {
        return injectMetadata;
    }
}
exports.registerCommand = registerCommand;
function registerEvent(arg1, arg2) {
    const injectMetadata = function (mod, name) {
        //@ts-ignore
        const target = mod[name];
        if (typeof target !== 'function')
            throw new Error('@registerEvent can only be used in module methods.');
        const meta = {
            eventName: typeof arg1 === 'string' ? arg1 : name,
            handler: target
        };
        pushMetadata(mod, exports.EventMetaKey, meta);
    };
    if (arg1 instanceof module_1.Module && typeof arg2 === 'string') {
        injectMetadata(arg1, arg2);
    }
    else {
        return injectMetadata;
    }
}
exports.registerEvent = registerEvent;
//# sourceMappingURL=decorators.js.map