import { SlashCommandBuilder } from "@discordjs/builders";

import { ICommand } from "../command";
import { radarr } from "../../services/radarr";
import { sonarr } from "../../services/sonarr";
import { clearState } from "../../state";

export const queueCommand: ICommand = {

    slashCommand: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Views the download queue"),

    commandProcessor: async (interaction, state) => {
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
    },
}