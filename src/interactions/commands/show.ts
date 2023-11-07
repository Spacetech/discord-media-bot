import { ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder } from "@discordjs/builders";

import { ICommand } from "../command";
import { sonarr } from "../../services/sonarr";
import { IUserState, clearState } from "../../state";
import { APISelectMenuOption, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

export const showCommand: ICommand = {

    slashCommand: new SlashCommandBuilder()
        .setName("show")
        .setDescription("Add / view a show")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Show name")
                .setRequired(true)),

    commandProcessor: async (interaction, state) => {
        const showName = interaction.options.getString("name", true);

        if (!showName || showName.length === 0) {
            return { content: "Please provide a show name. e.g. /show Cosmos" };
        }

        const results = await Promise.all([sonarr.lookupShows(showName), sonarr.getSeries()]);

        const shows = (results[0] as any[]).slice(0, 25);
        const series = results[1];

        if (shows.length === 0) {
            return { content: "No shows found" };
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("select")
                    .setPlaceholder("Nothing selected")
                    .addOptions(
                        shows.map((show: any, index: number) => {
                            let label = `${show.title}`;
                            let description = "";

                            if (show.year && show.year > 0) {
                                label += ` (${show.year})`;
                            }

                            const showDetails = series.find((s: { title: any; }) => s.title === show.title);
                            if (showDetails) {
                                let total = 0;
                                let downloaded = 0;

                                for (const season of showDetails.seasons) {
                                    if (season.seasonNumber > 0) {
                                        total += season.statistics.episodeCount;
                                        downloaded += season.statistics.episodeFileCount;
                                    }
                                }

                                // fill out the statistics from the existing show info in the db
                                show.statistics = showDetails.statistics;

                                description = `${downloaded}/${total} episodes downloaded`;
                            }

                            return {
                                label: label.substring(0, 99),
                                description: description.length > 0 ? description : undefined,
                                value: `show,details,${index}`,
                            } as APISelectMenuOption;
                        })
                    )
            );

        clearState(state);
        state.sonarrShows = shows;

        return { content: "Select a show", components: [row] };
    },

    selectMenuProcessor: async (interaction, state, subCommand, selection) => {
        const show = state.sonarrShow ?? state.sonarrShows?.[parseInt(selection, 10)];
        if (show) {
            switch (subCommand) {
                case "details": {
                    state.sonarrShow = show;

                    const profiles = await sonarr.getQualityProfiles();

                    let description = "";

                    if (show.id !== undefined) {
                        description += `Monitored: ${show.monitored}\n`;
                        description += `Quality Profile: ${profiles.get(show.qualityProfileId)}\n`;
                        description += `Seasons: ${show.statistics.seasonCount}\n`;
                        description += `Episodes: ${show.statistics.episodeCount}\n`;
                        description += `Downloaded Episodes: ${show.statistics.episodeFileCount}\n\n`;
                    }

                    description += show.overview;

                    const embed = new EmbedBuilder()
                        .setColor("#0099ff")
                        .setTitle(show.title)
                        .setDescription(description)
                        .setImage(show.remotePoster);

                    const buttons: ButtonBuilder[] = [];

                    if (show.id === undefined) {
                        buttons.push(new ButtonBuilder()
                            .setCustomId("show,add")
                            .setLabel("Add show")
                            .setStyle(ButtonStyle.Primary));

                    } else {
                        buttons.push(new ButtonBuilder()
                            .setCustomId("show,search")
                            .setLabel("Search for missing episodes")
                            .setStyle(ButtonStyle.Primary));
                        buttons.push(new ButtonBuilder()
                            .setCustomId("show,quality")
                            .setLabel("Adjust search quality")
                            .setStyle(ButtonStyle.Secondary));
                    }

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(buttons);

                    return { embeds: [embed], components: [row] };
                }

                case "quality": {
                    const qualityProfiles = state.sonarrQualityProfiles;
                    if (qualityProfiles) {
                        const qualityProfile = qualityProfiles[parseInt(selection, 10)];
                        if (qualityProfile) {
                            show.qualityProfileId = qualityProfile[0];

                            await sonarr.updateShow(show);

                            await sonarr.searchShow(show.id);

                            return { content: `Changed "${show.title}" search profile to "${qualityProfile[1]}" and searched for the show` };
                        }

                        return { content: "Invalid profile" };
                    }

                    break;
                }
            }
        }

        return {
            content: "Missing context for command"
        };
    },

    buttonProcessor: async (interaction, state, subCommand, selection) => {
        let show = state.sonarrShow;
        if (show) {
            switch (subCommand) {
                case "add":
                    let title = show.title;

                    if (show.year && show.year > 0) {
                        title += ` (${show.year})`;
                    }

                    clearState(state);

                    const success = await sonarr.addShow(show);

                    return {
                        content: success ? `Added "${title}"` : `Failed to add "${title}"`,
                    }

                case "search":
                    await sonarr.searchShow(show.id);

                    clearState(state);

                    return { content: `Initiated search for "${show.title}"` };

                case "quality":
                    const profiles = await sonarr.getQualityProfiles();
                    const filteredProfiles = Array.from(profiles.entries());

                    state.sonarrQualityProfiles = {};

                    let num = 0;
                    for (const profile of filteredProfiles) {
                        state.sonarrQualityProfiles[num] = profile;
                        num++;
                    }

                    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("select")
                                .setPlaceholder("Nothing selected")
                                .addOptions(
                                    filteredProfiles.map((result: any, index: number) => {
                                        let label = `${result[1]}`;

                                        return {
                                            label: label.substring(0, 99),
                                            value: `show,quality,${index}`,
                                        };
                                    })
                                )
                        );

                    return { content: "Select the quality profile", components: [row] };
            }
        }

        return {
            content: "Missing context for command"
        };
    }

}