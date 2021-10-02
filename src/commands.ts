import { SlashCommandBuilder } from "@discordjs/builders";
import { config } from "./config";

export const commands: Partial<SlashCommandBuilder>[] = [];

if (config.commands.radarr) {
    const movieCommand = new SlashCommandBuilder()
        .setName("movie")
        .setDescription("Add / view a movie")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Movie name")
                .setRequired(true));
    commands.push(movieCommand);
}

if (config.commands.sonarr) {
    const showCommand = new SlashCommandBuilder()
        .setName("show")
        .setDescription("Add / view a show")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Show name")
                .setRequired(true));
    commands.push(showCommand);
}

if (config.commands.sonarr || config.commands.radarr) {
    const queueCommand = new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Views the download queue");
    commands.push(queueCommand);

    const missingCommand = new SlashCommandBuilder()
        .setName("missing")
        .setDescription("Views missing shows & movies");
    commands.push(missingCommand);
}

if (config.commands.plex) {
    const scanCommand = new SlashCommandBuilder()
        .setName("scan")
        .setDescription("Scans a plex library");
    commands.push(scanCommand);
}
