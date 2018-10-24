"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function registerCommand(arg1, arg2) {
    return function (mod, name) {
        //@ts-ignore
        const target = mod[name];
        let nameOrTrigger = name;
        let commandOptions = {};
        if (typeof target !== 'function')
            throw new Error('@registerCommand() can only be used in module methods.');
        if (typeof arg1 === 'string' || arg1 instanceof RegExp) {
            nameOrTrigger = arg1;
            if (typeof arg2 === 'object')
                commandOptions = arg2;
        }
        else if (typeof arg1 === 'object') {
            commandOptions = arg1;
        }
        //@ts-ignore
        mod.registerCommand(nameOrTrigger, commandOptions, target);
    };
}
exports.registerCommand = registerCommand;
/**
 * Decorator syntax for module.registerEvent()
 *
 * The event name will be the same as the method name unless a name is explicitly set.
 *
 * @param evt - Event name
 */
function registerEvent(evt) {
    return function (mod, name) {
        //@ts-ignore
        const target = mod[name];
        const eventName = evt || name;
        if (typeof target !== 'function')
            throw new Error('@registerEvent() can only be used in module methods.');
        mod.registerEvent(eventName, target);
    };
}
exports.registerEvent = registerEvent;
//# sourceMappingURL=decorators.js.map