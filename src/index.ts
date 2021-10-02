import * as discord from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest/v9";

import { processButton, processCommand, processSelectMenu } from "./processor";
import { commands } from "./commands";
import { config } from "./config";

const ephemeral = config.commands.ephemeral;

/////////////////////////////////////////////////////////////////

process.on("uncaughtException", (ex) => {
    console.error("uncaughtException", ex);
});

process.on("unhandledRejection", (ex) => {
    console.error("unhandledRejection", ex);
});

/////////////////////////////////////////////////////////////////

const client = new discord.Client({ intents: [discord.Intents.FLAGS.GUILDS] });

client.on("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("unhandledRejection", (ex) => {
    console.error("Discord error", ex);
});

client.on("interactionCreate", async (interaction) => {
    let deferredReply = false;

    try {
        if (interaction.isCommand()) {
            await interaction.deferReply({ ephemeral });
            deferredReply = true;

            const reply = await processCommand(interaction);
            await interaction.editReply(reply);

        } else if (interaction.isSelectMenu()) {
            await interaction.deferReply({ ephemeral });
            deferredReply = true;

            const reply = await processSelectMenu(interaction);
            await interaction.editReply(reply);

        } else if (interaction.isButton()) {
            await interaction.deferReply({ ephemeral });
            deferredReply = true;

            const reply = await processButton(interaction);
            await interaction.editReply(reply);
        }

    } catch (ex) {
        console.error(ex);

        try {
            await (interaction as any).editReply({ content: "An error occurred" });
        } catch {
            // ignore
        }
    }
});

async function registerCommands() {
    await Promise.all(Array.from(config.bot.guids).map(async guildId => {
        const rest = new REST({ version: "9" }).setToken(config.bot.token);

        console.log('Started refreshing application (/) commands.', guildId);

        await rest.put(
            Routes.applicationGuildCommands(config.bot.userId, guildId),
            {
                body: commands,
            },
        );

        console.log('Successfully reloaded application (/) commands.', guildId);
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
