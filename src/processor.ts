import { ButtonInteraction, CommandInteraction, InteractionReplyOptions, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import { plex } from "./services/plex";
import { radarr } from "./services/radarr";
import { sonarr } from "./services/sonarr";
import { clearState, getState } from "./state";

export async function processCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    const state = getState(interaction.user.id);

    switch (interaction.commandName) {

        case "scan":
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
                                    label,
                                    description,
                                    value: `scan,${library.key}`,
                                };

                                return option;
                            })
                        )
                );

            return { content: "Select a library", components: [row] };

        case "queue": {
            const results = await Promise.all([radarr.getMovieQueue(), sonarr.getShowQueue(), sonarr.getSeries()]); // , lidarr.getQueue()

            const queue = results[0].records.concat(results[1].records);//.concat(results[3].records);
            const series = results[2];

            let replyContent: string;

            if (queue.length > 0) {
                replyContent = `Download queue. Queued movies: ${results[0].total}. Queued episodes: ${results[1].total}:\n`; //  Queued music: ${results[3].total}
                replyContent += "```nimrod\n";

                for (let i = 0; i < queue.length; i++) {
                    const queued = queue[i];

                    replyContent += `${i + 1}) `;

                    if (queued.seriesId) {
                        const showDetails = series.find((s: { id: any; }) => s.id === queued.seriesId);
                        const episodeDetails = await sonarr.getEpisode(queued.episodeId);
                        const episode = episodeDetails[0];

                        replyContent += ` ${showDetails.title}`;
                        replyContent += ` - S${episode.seasonNumber}E${episode.episodeNumber}`;
                        replyContent += ` - ${queued.status}.`;
                        if (queued.timeleft) {
                            replyContent += ` Time left: ${queued.timeleft}`;
                        } else {
                            replyContent += ` (${((queued.size - queued.sizeleft) / queued.size * 100).toFixed(2)}%)`;
                        }

                    } else {
                        replyContent += ` ${queued.title}`;
                        replyContent += ` - ${queued.status}.`;
                        if (queued.timeleft) {
                            replyContent += ` Time left: ${queued.timeleft}`;
                        }
                    }

                    replyContent += "\n";
                }

                replyContent += "```";
                // replyContent += "Say !{number} to cancel.";

            } else {
                replyContent = "Nothing in the download queue";
            }

            clearState(state);
            state.queue = queue;

            return { content: replyContent };
        }

        case "missing": {
            const results = await Promise.all([sonarr.getSeries(), sonarr.getMissingEpisodes()]);

            const series = results[0];
            const missingEpisodes = results[1];

            let replyContent: string;

            if (missingEpisodes.length > 0) {
                replyContent = "Missing episodes:\n";
                replyContent += "```nimrod\n";

                replyContent += "0) Search for all missing\n";

                for (let i = 0; i < missingEpisodes.length; i++) {
                    const episode = missingEpisodes[i];

                    replyContent += `${i + 1}) `;

                    const showDetails = series.find((s: { id: any; }) => s.id === episode.seriesId);

                    replyContent += ` ${showDetails.title}`;
                    replyContent += ` - S${episode.seasonNumber}E${episode.episodeNumber}`;

                    // reply += ` - ${queued.status}.`;
                    // if (queued.timeleft) {
                    //     reply += ` Time left: ${queued.timeleft}`;
                    // } else {
                    //     reply += ` (${((queued.size - queued.sizeleft) / queued.size * 100).toFixed(2)}%)`;
                    // }

                    replyContent += "\n";
                }

                replyContent += "```";

                replyContent += "Say !{number} to download / search.";

            } else {
                replyContent = "No missing episodes";
            }

            clearState(state);
            state.sonarrMissing = missingEpisodes;

            return { content: replyContent };
        }

        case "movie": {
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
                                    label,
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
        }

        case "show": {
            const showName = interaction.options.getString("name");

            if (!showName || showName.length === 0) {
                return { content: "Please provide a show name. e.g. /show Cosmos" };
            }

            const results = await Promise.all([sonarr.lookupShows(showName), sonarr.getSeries()]);

            const shows = (results[0] as any[]).slice(0, 25);
            const series = results[1];

            if (shows.length === 0) {
                return { content: "No shows found" };
            }

            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
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

                                    description = `${downloaded}/${total} episodes downloaded`;
                                }

                                let option: MessageSelectOptionData = {
                                    label,
                                    description,
                                    value: `show,details,${index}`,
                                };

                                return option;
                            })
                        )
                );

            clearState(state);
            state.sonarrShows = shows;

            return { content: "Select a show", components: [row] };
        }
    }

    return { content: `Unknown command "${interaction.commandName}"` };
}

export async function processSelectMenu(interaction: SelectMenuInteraction): Promise<InteractionReplyOptions> {
    const state = getState(interaction.user.id);

    const [command, subCommand, selection] = interaction.values[0].split(",");

    switch (command) {

        case "scan":
            const success = await plex.refreshLibrary(subCommand);

            return {
                content: success ? "Initiated scan for library" : "Failed to initiate scan for library"
            };

        case "movie":
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

            } else {
                return {
                    content: "Missing context for command"
                };
            }

            break;

        case "show":
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

                        const embed = new MessageEmbed()
                            .setColor("#0099ff")
                            .setTitle(show.title)
                            .setDescription(description)
                            .setImage(show.remotePoster);

                        const buttons: MessageButton[] = [];

                        if (show.id === undefined) {
                            buttons.push(new MessageButton()
                                .setCustomId("show,add")
                                .setLabel("Add show")
                                .setStyle("PRIMARY"));

                        } else {
                            buttons.push(new MessageButton()
                                .setCustomId("show,search")
                                .setLabel("Search for missing episodes")
                                .setStyle("PRIMARY"));
                            buttons.push(new MessageButton()
                                .setCustomId("show,quality")
                                .setLabel("Adjust search quality")
                                .setStyle("SECONDARY"));
                        }

                        const row = new MessageActionRow()
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

            } else {
                return {
                    content: "Missing context for command"
                };
            }

            break;
    }

    return { content: "Unknown select menu command" };
}

export async function processButton(interaction: ButtonInteraction) {
    const state = getState(interaction.user.id);

    const [command, subCommand, selection] = interaction.customId.split(",");

    switch (command) {

        case "movie":
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
                        let searchResults = await radarr.findDownloads(movie.id) as any[];
                        if (searchResults.length === 0) {
                            return { content: "No results found" };
                        }

                        searchResults = searchResults
                            .slice(0, 25)
                            .filter((result: { mappingResult: any; }) => result.mappingResult);

                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageSelectMenu()
                                    .setCustomId("select")
                                    .setPlaceholder("Nothing selected")
                                    .addOptions(
                                        searchResults.map((result: any, index: number) => {
                                            let label = `${result.title}`;
                                            let description = `${result.seeders} seeders / ${result.leechers} leechers`;

                                            let option: MessageSelectOptionData = {
                                                label,
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

            break;

        case "show":
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

                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageSelectMenu()
                                    .setCustomId("select")
                                    .setPlaceholder("Nothing selected")
                                    .addOptions(
                                        filteredProfiles.map((result: any, index: number) => {
                                            let label = `${result[1]}`;

                                            let option: MessageSelectOptionData = {
                                                label,
                                                value: `show,quality,${index}`,
                                            };

                                            return option;
                                        })
                                    )
                            );

                        return { content: "Select the quality profile", components: [row] };
                }
            }

            break;
    }

    return { content: "Unknown button command" };
}
