import { Interaction } from "discord.js";
import { commands } from "./commands";
import { config } from "../config";
import { getState } from "../state";

const ephemeral = config.commands.ephemeral;

export async function processInteraction(interaction: Interaction): Promise<void> {
    try {
        if (interaction.isCommand()) {
            const command = commands.find(command => command.slashCommand.name === interaction.commandName);
            if (command?.commandProcessor) {
                await interaction.deferReply({ ephemeral });

                const state = getState(interaction.user.id);
                const reply = await command.commandProcessor(interaction, state);

                await interaction.editReply(reply);

            } else {
                await interaction.reply({ content: `Unknown command "${interaction.commandName}"`, ephemeral });
            }

        } else if (interaction.isSelectMenu()) {
            const [commandName, subCommand, selection] = interaction.values[0].split(",");

            const command = commands.find(command => command.slashCommand.name === commandName);
            if (command?.selectMenuProcessor) {
                await interaction.deferReply({ ephemeral });

                const state = getState(interaction.user.id);
                const reply = await command.selectMenuProcessor(interaction, state, subCommand, selection);

                await interaction.editReply(reply);

            } else {
                await interaction.reply({ content: `Unknown select menu command "${commandName}"`, ephemeral });
            }

        } else if (interaction.isButton()) {
            const [commandName, subCommand, selection] = interaction.customId.split(",");

            const command = commands.find(command => command.slashCommand.name === commandName);
            if (command?.buttonProcessor) {
                await interaction.deferReply({ ephemeral });

                const state = getState(interaction.user.id);
                const reply = await command.buttonProcessor(interaction, state, subCommand, selection);

                await interaction.editReply(reply);

            } else {
                await interaction.reply({ content: `Unknown button command "${commandName}"`, ephemeral });
            }
        }

    } catch (ex) {
        console.error(ex);

        try {
            await (interaction as any).editReply({ content: "An error occurred", ephemeral });
        } catch {
            // ignore
        }
    }
}
