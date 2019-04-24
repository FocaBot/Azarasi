"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Guild {
    constructor(az, discordGuild) {
        this.az = az;
        this.discordGuild = discordGuild;
        this.data = Object.assign({}, Guild.defaultData(), { async save() { } });
        if (this.discordGuild) {
            // Subscribe to external updates
            this.az.data.subscribe('_AzEvent.GuildData', (msg) => {
                if (msg.type === 'updated' && this.discordGuild && msg.guild === this.discordGuild.id) {
                    this.init();
                }
            }).then(sub => this.unsubscribe = sub.off);
        }
    }
    /**
     * Initializes guild data
     */
    async init() {
        if (!this.discordGuild)
            return;
        const data = await this.az.data.get(`Guild:${this.discordGuild.id}`);
        this.data = Object.assign({}, Guild.defaultData(), data, { save: () => this.saveData() });
    }
    /**
     * Should return data that will be used for default on new guilds
     */
    static defaultData() {
        return {};
    }
    /**
     * Saves Guild Data
     */
    async saveData() {
        if (!this.discordGuild)
            return;
        await this.az.data.set(`Guild:${this.discordGuild.id}`, this.data);
        // Notify other instances about the change
        this.az.data.set('AzEvent.GuildData', {
            type: 'updated',
            guild: this.discordGuild.id
        });
    }
}
exports.Guild = Guild;
/**
 * Manages persistent data for guilds
 */
class GuildManager {
    constructor(az) {
        this.guilds = new Map();
        this.az = az;
    }
    /**
     * Get data for a guild. If no guild is specified, dummy (default) values will be used.
     * @param guild - Guild to get
     */
    async getGuild(guild) {
        if (!guild)
            return new Guild(this.az);
        if (this.guilds.has(guild.id)) {
            return this.guilds.get(guild.id);
        }
        else {
            const g = new Guild(this.az, guild);
            await g.init();
            this.guilds.set(guild.id, g);
            return g;
        }
    }
}
exports.GuildManager = GuildManager;
//# sourceMappingURL=guilds.js.map