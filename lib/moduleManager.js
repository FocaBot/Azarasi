"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const chokidar_1 = __importDefault(require("chokidar"));
const module_1 = require("./module");
class ModuleManager {
    constructor(az) {
        /** Currently loaded modules */
        this.loaded = new Map();
        /** Module dependency relations */
        this.dependencies = [];
        this.az = az;
        this.modulePath = az.properties.modulePath || './modules/';
        if (az.properties.watch) {
            this.initializeHotReloading();
        }
    }
    initializeHotReloading() {
        chokidar_1.default.watch(this.modulePath).on('change', (p) => setTimeout(() => {
            const moduleName = p
                .replace(this.modulePath, '')
                .split(path_1.default.sep)[1]
                .split('.')[0];
            if (this.loaded.get(moduleName)) {
                this.az.logDebug(`Reloading "${moduleName}" (file change)`);
                this.reload(moduleName);
            }
        }, 100));
    }
    /**
     * Loads the specified modules
     * @param modules - Modules to load
     */
    load(modules) {
        const m = typeof modules === 'string' ? [modules] : modules;
        if (!(m instanceof Array))
            throw new Error('This function only accepts strings or arrays.');
        for (const moduleName of m) {
            let reloading = false;
            // Check if the module isn't loaded already
            if (this.loaded.has(moduleName)) {
                const mod = this.loaded.get(moduleName);
                if (mod.state === module_1.ModuleState.Loaded || mod.state === module_1.ModuleState.Unloading)
                    continue;
                reloading = mod.state === module_1.ModuleState.Reloading;
            }
            // Load module
            const Mod = require(path_1.default.join(this.modulePath, moduleName));
            const ModConstructor = Mod.default || Mod;
            const mod = new ModConstructor(this.az, moduleName);
            if (!(mod instanceof module_1.Module))
                throw new Error(`${moduleName} is not a module!`);
            if (mod.init)
                mod.init();
            if (mod.ready)
                this.az.ready ? mod.ready() : this.az.events.once('ready', () => mod.ready());
            mod.state = module_1.ModuleState.Loaded;
            this.loaded.set(moduleName, mod);
            if (!reloading)
                this.az.logDebug(`Loaded module "${moduleName}".`);
        }
    }
    /**
     * Unregister all resources bound to the specified module.
     * Run this before unloading or reloading a module.
     * @param module - Module to clean
     */
    shutdown(module) {
        const mod = module instanceof module_1.Module ? module : this.loaded.get(module);
        if (!mod || mod.state === module_1.ModuleState.Loaded)
            return; // Don't run this on modules that aren't unloading or reloading
        if (mod.shutdown)
            mod.shutdown();
        // Unregister setting parameters
        for (const param of this.az.settings.schema) {
            if (param[1].module && param[1].module === mod)
                mod.unregisterParameter(param[0]);
        }
        // Unregister event listeners
        for (const event of mod.events) {
            mod.unregisterEvent(event.name, event.originalHandler);
        }
        // Unregister commands
        for (const cmd of mod.commands.values()) {
            this.az.commands.unregister(cmd);
        }
        // Remove dependencies
        this.dependencies.forEach((dep, i) => {
            if (dep.module === mod.id)
                return this.dependencies.splice(i, 1);
        });
    }
    /**
     * Unloads the specified module and all its dependants
     * @param modules - Modules to unload
     */
    unload(modules) {
        const m = typeof modules === 'string' ? [modules] : modules;
        if (!(m instanceof Array))
            throw new Error('This function only accepts strings or arrays.');
        for (const moduleName of m) {
            const mod = this.loaded.get(moduleName);
            if (!mod || (mod.state !== module_1.ModuleState.Loaded && mod.state !== module_1.ModuleState.Errored))
                continue;
            mod.state = module_1.ModuleState.Unloading;
            // Dependencies
            this.dependencies.forEach((dep, i) => {
                if (dep.dependsOn === moduleName) {
                    this.az.logDebug(`Unloading module "${dep.module}" (depends on "${moduleName}").`);
                    this.unload(dep.module);
                }
            });
            this.shutdown(mod);
            this.loaded.delete(moduleName);
            this.az.logDebug(`Unloaded module "${moduleName}".`);
        }
    }
    /**
     * Reloads the specified module and all its dependants
     * @param modules - Modules to unload
     */
    reload(modules) {
        const m = typeof modules === 'string' ? [modules] : modules;
        if (!(m instanceof Array))
            throw new Error('This function only accepts strings or arrays.');
        for (const moduleName of m) {
            const mod = this.loaded.get(moduleName);
            if (!mod || (mod.state !== module_1.ModuleState.Loaded && mod.state !== module_1.ModuleState.Errored))
                continue;
            mod.state = module_1.ModuleState.Reloading;
            this.shutdown(mod);
            try {
                this.purgeCache(moduleName);
                this.load(moduleName);
                this.az.logDebug(`Reloaded module "${moduleName}".`);
                // Dependencies
                this.dependencies.forEach((dep, i) => {
                    if (dep.dependsOn === moduleName) {
                        this.az.logDebug(`Reloading module ${dep.module} (depends on "${moduleName}").`);
                        this.reload(dep.module);
                    }
                });
            }
            catch (e) {
                this.az.logError(`Error while reloading "${moduleName}":\n`, e);
                mod.state = module_1.ModuleState.Errored;
            }
        }
    }
    /**
     * Purge require cache for module.
     */
    purgeCache(modName, relative = true) {
        const modId = require.resolve(relative ? path_1.default.join(this.modulePath, modName) : modName);
        const mod = require.cache[modId];
        // Only purge module files
        if (!mod || mod.filename.indexOf(this.modulePath) != 0)
            return;
        delete require.cache[modId];
        for (let child of mod.children) {
            if (require.cache[child.id])
                this.purgeCache(child.id, false);
        }
    }
    /**
     * Get module by name
     * @param name - Name of the desired module
     */
    get(name) {
        const mod = this.loaded.get(name);
        if (!mod || mod.state !== module_1.ModuleState.Loaded)
            throw new Error('The specified module is not loaded.');
        return mod;
    }
    /**
     * Register module dependency (don't call this directly, use [[Module.requireModule]] instead)
     * @param module
     * @param dependsOn
     */
    registerDependency(module, dependsOn) {
        try {
            if (!this.loaded.has(dependsOn)) {
                this.az.logDebug(`Loading "${dependsOn}" (dependency of "${module.id}").`);
                this.load(dependsOn);
            }
            this.dependencies.push({ module: module.id, dependsOn });
        }
        catch (e) {
            throw new Error('Invalid dependency.');
        }
    }
    /**
     * Enables a module for a specific guild
     * @param guild
     * @param mod - Module name or instance
     */
    async enableModuleForGuild(guild, module) {
        const g = await this.az.guilds.getGuild(guild);
        const mod = module instanceof module_1.Module ? module : this.loaded.get(module);
        if (!mod)
            throw new Error('No such module.');
        if (!g.data.disabledModules)
            g.data.disabledModules = {};
        g.data.disabledModules[mod.id] = false;
        await g.saveData();
    }
    /**
     * Disables a module only in a specific guild
     * @param guild
     * @param mod - Module name or instance
     */
    async disableModuleForGuild(guild, module) {
        const g = await this.az.guilds.getGuild(guild);
        const mod = module instanceof module_1.Module ? module : this.loaded.get(module);
        if (!mod)
            throw new Error('No such module.');
        if (!mod.allowDisabling)
            throw new Error('This module cannot be disabled.');
        if (!g.data.disabledModules)
            g.data.disabledModules = {};
        g.data.disabledModules[mod.id] = true;
        await g.saveData();
    }
    /**
     * Checks if a module is disabled in a guild.
     * @param {Discord.Guild} guild
     * @param {string|BotModule} mod - Module name or instance
     */
    async isModuleDisabledForGuild(guild, module) {
        const g = await this.az.guilds.getGuild(guild);
        const mod = module instanceof module_1.Module ? module : this.loaded.get(module);
        if (!mod)
            return true;
        if (!mod.allowDisabling)
            return false;
        if (g.data.disabledModules && g.data.disabledModules[mod.id] != null) {
            if (g.data.disabledModules[mod.id] === true)
                return true;
            if (g.data.disabledModules[mod.id] === false)
                return false;
            return mod.defaultDisabled;
        }
        return mod.defaultDisabled;
    }
}
exports.ModuleManager = ModuleManager;
//# sourceMappingURL=moduleManager.js.map