import { Azarasi } from '.';
import moment, { MomentFormatSpecification, MomentInput } from 'moment';
/**
 * Provides translations
 */
export declare class Locale {
    /** ISO_639-1 code of the locale */
    readonly isoCode: string;
    /** ISO 3166-1 alpha-2 code of the country variant */
    readonly countryCode: string;
    /** ISO code + Locale code */
    readonly localeCode: string;
    /** Locale strings */
    strings: LocaleStrings;
    /** Locale command mappings */
    commandMappings: CommandMappings;
    /**
     * Instantiates a new locale
     * @param isoCode - ISO_639-1 code of the locale.
     * @param countryCode - ISO 3166-1 alpha-2 code of the country variant.
     */
    constructor(isoCode: string, countryCode: string);
    /**
     * Load strings object
     * @param strings - Strings object
     */
    loadStrings(strings: LocaleStrings): void;
    /**
     * Load command mappings
     * @param commandMappings - Mappings
     */
    loadCommands(commandMappings: CommandMappings): void;
    /**
     * Generates a string from a template and escapes @here and @everyone mentions.
     * Each argument replaces {n} in the input template.
     * @param template - Template string
     * @example
     * locale.gen("User {1} joined the server!", "TheBITLINK") // User TheBITLINK joined the server!
     * locale.gen("Not enough votes ({1}/{2})", count, required) // Not enough votes (4/9)
     */
    gen(template: string, ...args: string[]): string;
    /**
     * Generates a string from a template without escaping @here and @everyone mentions.
     * Each argument replaces {n} in the input template.
     * @param template - Template string
     * @example
     * locale.gen("User {1} joined the server!", "TheBITLINK") // User TheBITLINK joined the server!
     * locale.gen("Not enough votes ({1}/{2})", count, required) // Not enough votes (4/9)
     * locale.ugen("This is a {1} mention", '@here') // This is a @here mention
     */
    ugen(template: string, ...args: string[]): string;
    /**
     * Returns a moment instance set to current locale
     */
    moment(input: MomentInput, format?: MomentFormatSpecification, strict?: boolean): moment.Moment;
    /**
     * Attempts to transform numbers, dates, etc. to the current locale.
     */
    transform(input: any): string;
}
/**
 * Manages translations
 */
export declare class LocaleManager {
    private readonly az;
    /** Loaded Locales */
    loaded: Map<string, Locale>;
    /** Base path for locale files */
    basePath: string;
    /** Default locale */
    defaultLocale?: Locale;
    constructor(az: Azarasi);
    /**
     * Load the specified locale
     * @param name - Name of the locale to load
     */
    loadLocale(name: string): Locale | undefined;
    /**
     * Unloads the specified locale
     * @param name - Locale name
     */
    unloadLocale(name: string): void;
    /**
     * Reload the specified locale
     * @param name - Locale name
     */
    reloadLocale(name: string): void;
    /**
     * Get locale by name
     * @param name - Locale name
     */
    getLocale(name: string): Locale | undefined;
}
/**
 * Locale Strings
 * @hidden
 */
export declare type LocaleStrings = {
    [key: string]: string | LocaleStrings;
};
/**
 * Command Mappings
 * @hidden
 */
export declare type CommandMappings = {
    [key: string]: string;
};
