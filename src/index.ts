import "dotenv/config";
import * as discord from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest/v9";

import { commands } from "./interactions/commands";
import { config } from "./config";
import { processInteraction } from "./interactions/processor";

/////////////////////////////////////////////////////////////////

process.on("uncaughtException", (ex) => {
    console.error("uncaughtException", ex);
});

process.on("unhandledRejection", (ex) => {
    console.error("unhandledRejection", ex);
});

/////////////////////////////////////////////////////////////////

const client = new discord.Client({
    intents: [
        discord.GatewayIntentBits.Guilds,
        discord.GatewayIntentBits.GuildMessages,
        discord.GatewayIntentBits.MessageContent,
    ],
});

client.on("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("unhandledRejection", (ex) => {
    console.error("Discord error", ex);
});

client.on("interactionCreate", async (interaction) => {
    await processInteraction(interaction);
});

async function registerCommands() {
    const slashCommands = commands.map(command => command.slashCommand);

    await Promise.all(Array.from(config.bot.guids).map(async guildId => {
        try {
            const rest = new REST({ version: "9" }).setToken(config.bot.token);

            console.log(`Started registtering slash commands for guild ${guildId}...`);

            await rest.put(
                Routes.applicationGuildCommands(config.bot.userId, guildId),
                {
                    body: slashCommands,
                },
            );

            console.log(`Successfully to registered slash commands for guild ${guildId}`);

        } catch (ex) {
            console.error(`Failed to register slash commands for guild ${guildId}`, ex);
            throw ex;
        }
    }));
}

async function startup() {
    console.log("Startup");

    if (process.env.NODE_ENV === "development") {
        console.log("Environment variables", JSON.stringify(process.env));
    }

    await registerCommands();

    await client.login(config.bot.token);
}

startup();
