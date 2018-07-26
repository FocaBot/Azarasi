import Azarasi from '.';
import Discord from 'discord.js';
import { Module } from './module';
export declare class ModuleManager {
    /** Currently loaded modules */
    loaded: Map<string, Module>;
    /** Path to modules directory */
    modulePath: string;
    /** Module dependency relations */
    dependencies: ModuleDependency[];
    /** Azarasi instance */
    az: Azarasi;
    constructor(az: Azarasi);
    initializeHotReloading(): void;
    /**
     * Loads the specified modules
     * @param modules - Modules to load
     */
    load(modules: string[] | string): void;
    /**
     * Unregister all resources bound to the specified module.
     * Run this before unloading or reloading a module.
     * @param module - Module to clean
     */
    private shutdown(module);
    /**
     * Unloads the specified module and all its dependants
     * @param modules - Modules to unload
     */
    unload(modules: string[] | string): void;
    /**
     * Reloads the specified module and all its dependants
     * @param modules - Modules to unload
     */
    reload(modules: string[] | string): void;
    /**
     * Get module by name
     * @param name - Name of the desired module
     */
    get<T extends Module>(name: string): T;
    /**
     * Register module dependency (don't call this directly, use [[Module.requireModule]] instead)
     * @param module
     * @param dependsOn
     */
    registerDependency(module: Module, dependsOn: string): void;
    /**
     * Enables a module for a specific guild
     * @param guild
     * @param mod - Module name or instance
     */
    enableModuleForGuild(guild: Discord.Guild, module: Module | string): Promise<void>;
    /**
     * Disables a module only in a specific guild
     * @param guild
     * @param mod - Module name or instance
     */
    disableModuleForGuild(guild: Discord.Guild, module: Module | string): Promise<void>;
    /**
     * Checks if a module is disabled in a guild.
     * @param {Discord.Guild} guild
     * @param {string|BotModule} mod - Module name or instance
     */
    isModuleDisabledForGuild(guild: Discord.Guild, module: Module | string): Promise<boolean>;
}
export interface ModuleDependency {
    module: string;
    dependsOn: string;
}
