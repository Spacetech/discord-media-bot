
class Config {

    public get bot() {
        return {
            userId: this.getEnvironmentVariable("BOT_USER_ID"),
            token: this.getEnvironmentVariable("BOT_TOKEN"),
            guids: this.getEnvironmentVariable("BOT_GUILDS")?.split(",") ?? undefined,
        };
    }

    public get commands() {
        return {
            ephemeral: this.getOptionalEnvironmentVariable("COMMANDS_EPHEMERAL") === "1",
            plex: this.getOptionalEnvironmentVariable("COMMANDS_ENABLE_PLEX") === "1",
            sonarr: this.getOptionalEnvironmentVariable("COMMANDS_ENABLE_SONARR") === "1",
            radarr: this.getOptionalEnvironmentVariable("COMMANDS_ENABLE_RADARR") === "1",

            // lidarr commands are not implemented
            // lidarr: this.getOptionalEnvironmentVariable("COMMANDS_ENABLE_LIDARR") === "1",
        };
    }

    public get plex() {
        return {
            url: this.getEnvironmentVariable("PLEX_URL"),
            token: this.getEnvironmentVariable("PLEX_TOKEN"),
        };
    }

    public get sonarr() {
        return {
            url: this.getEnvironmentVariable("SONARR_URL"),
            apiKey: this.getEnvironmentVariable("SONARR_API_KEY"),
            defaultMediaPath: this.getEnvironmentVariable("SONARR_DEFAULT_MEDIA_PATH"),
            defaultQualityProfileId: parseInt(this.getEnvironmentVariable("SONARR_DEFAULT_QUALITY_PROFILE_ID"), 10),
        };
    }

    public get radarr() {
        return {
            url: this.getEnvironmentVariable("RADARR_URL"),
            apiKey: this.getEnvironmentVariable("RADARR_API_KEY"),
            defaultMediaPath: this.getEnvironmentVariable("RADARR_DEFAULT_MEDIA_PATH"),
            defaultQualityProfileId: parseInt(this.getEnvironmentVariable("RADARR_DEFAULT_QUALITY_PROFILE_ID"), 10),
        };
    }

    public get lidarr() {
        return {
            url: this.getEnvironmentVariable("LIDARR_URL"),
            apiKey: this.getEnvironmentVariable("LIDARR_API_KEY"),
            defaultMediaPath: this.getEnvironmentVariable("LIDARR_DEFAULT_MEDIA_PATH"),
            defaultQualityProfileId: parseInt(this.getEnvironmentVariable("LIDARR_DEFAULT_QUALITY_PROFILE_ID"), 10),
            defaultMetadataProfileId: parseInt(this.getEnvironmentVariable("LIDARR_DEFAULT_METADATA_PROFILE_ID"), 10),
        };
    }

    private getEnvironmentVariable(name: string): string {
        const value = this.getOptionalEnvironmentVariable(name);
        if (typeof (value) !== "string" || value.length === 0) {
            throw new Error(`Missing environment variable ${name}`);
        }

        return value;
    }

    private getOptionalEnvironmentVariable(name: string): string | undefined {
        return process.env[name];
    }
}

export const config = new Config();
