import { SlashCommandBuilder } from "@discordjs/builders";

import { ICommand } from "../command";
import { radarr } from "../../services/radarr";
import { sonarr } from "../../services/sonarr";
import { clearState } from "../../state";

export const missingCommand: ICommand = {

    slashCommand: new SlashCommandBuilder()
        .setName("missing")
        .setDescription("Views missing shows & movies"),

    commandProcessor: async (interaction, state) => {
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
    },
}