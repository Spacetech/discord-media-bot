import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageActionRow, MessageSelectMenu, MessageSelectOptionData } from "discord.js";

import { ICommand } from "../command";
import { plex } from "../../services/plex";

export const scanCommand: ICommand = {

    slashCommand: new SlashCommandBuilder()
        .setName("scan")
        .setDescription("Scan a plex library"),

    commandProcessor: async () => {
        const libraries = await plex.getLibraries();

        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("select")
                    .setPlaceholder("Nothing selected")
                    .addOptions(
                        libraries.map((library: any) => {
                            let label = `${library.title}`;
                            let description = "";

                            let option: MessageSelectOptionData = {
                                label: label.substring(0, 99),
                                description,
                                value: `scan,${library.title},${library.key}`,
                            };

                            return option;
                        })
                    )
            );

        return { content: "Select a library", components: [row] };
    },

    selectMenuProcessor: async (interaction, state, subCommand, selection) => {
        const success = await plex.refreshLibrary(selection);

        return {
            content: success ? `Initiated scan for library "${subCommand}"` : `Failed to initiate scan for library "${subCommand}"`
        };
    }
}