import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, MessageSelectOptionData } from "discord.js";

import { ICommand } from "../command";
import { radarr } from "../../services/radarr";
import { IUserState, clearState } from "../../state";

export const movieCommand: ICommand = {

    slashCommand: new SlashCommandBuilder()
        .setName("movie")
        .setDescription("Add / view a movie")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Movie name")
                .setRequired(true)),

    commandProcessor: async (interaction: CommandInteraction, state: IUserState) => {
        const movieName = interaction.options.getString("name");

        if (!movieName || movieName.length === 0) {
            return { content: "Please provide a movie name. e.g. !movie Iron Man" };
        }

        const results = await Promise.all([radarr.lookupMovies(movieName), radarr.getMovieQueue()]);

        const movies = (results[0] as any[]).slice(0, 25);
        const queue = results[1].records;

        if (movies.length === 0) {
            return { content: "No movies found" };
        }

        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("select")
                    .setPlaceholder("Nothing selected")
                    .addOptions(
                        movies.map((movie: any, index: number) => {
                            let label = `${movie.title} (${movie.year})`;
                            let description = "";

                            if (movie.hasFile) {
                                if (movie.movieFile && movie.movieFile.quality && movie.movieFile.quality.quality) {
                                    description = `Already downloaded - ${movie.movieFile.quality.quality.name}`;
                                } else {
                                    description = "Already downloaded";
                                }

                            } else if (movie.monitored) {
                                let queuedMatch = undefined;

                                for (let j = 0; j < queue.length; j++) {
                                    const queued = queue[j];
                                    if (queued.movie && queued.movie.id === movie.id) {
                                        queuedMatch = queued;
                                        break;
                                    }
                                }

                                if (queuedMatch) {
                                    if (queuedMatch.status) {
                                        description = `${queuedMatch.status}. Time left: ${queuedMatch.timeleft ? queuedMatch.timeleft : "unknown"}`;
                                    } else {
                                        description = "Processing download";
                                    }

                                } else {
                                    description = "Already monitored";
                                }
                            }

                            let option: MessageSelectOptionData = {
                                label: label.substring(0, 99),
                                description,
                                value: `movie,details,${index}`,
                            };

                            return option;
                        })
                    )
            );

        clearState(state);
        state.radarrMovies = movies;

        return { content: "Select a movie", components: [row] };
    },

    selectMenuProcessor: async (interaction, state, subCommand, selection) => {
        const movie = state.radarrMovie ?? state.radarrMovies?.[parseInt(selection, 10)];
        if (movie) {
            switch (subCommand) {
                case "details": {
                    const embed = new MessageEmbed()
                        .setColor("#0099ff")
                        .setTitle(`${movie.title} (${movie.year})`)
                        .setDescription(movie.overview)
                        .setImage(movie.remotePoster);

                    const buttons: MessageButton[] = [];

                    if (!movie.monitored && !movie.hasFile) {
                        buttons.push(new MessageButton()
                            .setCustomId("movie,add")
                            .setLabel("Add movie")
                            .setStyle("PRIMARY"));

                    } else {
                        buttons.push(new MessageButton()
                            .setCustomId("movie,search")
                            .setLabel(movie.hasFile ? "Search for a replacement" : "Search")
                            .setStyle("PRIMARY"));
                    }

                    const row = new MessageActionRow()
                        .addComponents(buttons);

                    clearState(state);
                    state.radarrMovie = movie;

                    return { embeds: [embed], components: [row] };
                }

                case "download": {
                    const searchResult = state.radarrSearchResults?.[parseInt(selection, 10)];
                    if (searchResult) {
                        clearState(state);

                        const success = await radarr.downloadMovie(searchResult);

                        return {
                            content: success ? `Downloading ${searchResult.title}` : `Failed to download ${searchResult.title}`
                        };
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
        let movie = state.radarrMovie;
        if (movie) {
            switch (subCommand) {
                case "add": {
                    const success = await radarr.addMovie(movie);

                    clearState(state);

                    return {
                        content: success ? `Added "${movie.title} (${movie.year})"` : `Failed to add "${movie.title} (${movie.year})"`
                    };
                }

                case "search": {
                    const searchResults = (await radarr.findDownloads(movie.id) as any[])
                        .slice(0, 25);
                    if (searchResults.length === 0) {
                        return { content: "No results found" };
                    }

                    const row = new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId("select")
                                .setPlaceholder("Nothing selected")
                                .addOptions(
                                    searchResults.map((result: any, index: number) => {
                                        let label = `${result.title}`;
                                        let description = `Size: ${(result.size / Math.pow(1024, 3)).toFixed(1)}gb. ${result.seeders} seeders / ${result.leechers} leechers`;

                                        let option: MessageSelectOptionData = {
                                            label: label.substring(0, 99),
                                            description,
                                            value: `movie,download,${index}`,
                                        };

                                        return option;
                                    })
                                )
                        );

                    clearState(state);
                    state.radarrMovie = movie;
                    state.radarrSearchResults = searchResults;

                    return { content: "Select the download", components: [row] };
                }
            }
        }

        return {
            content: "Missing context for command"
        };
    }

}