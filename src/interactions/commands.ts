import { ICommand } from "./command";
import { missingCommand } from "./commands/missing";
import { movieCommand } from "./commands/movie";
import { scanCommand } from "./commands/scan";
import { queueCommand } from "./commands/queue";
import { showCommand } from "./commands/show";
import { config } from "../config";

export const commands: ICommand[] = [];

if (config.commands.radarr) {
    commands.push(movieCommand);
}

if (config.commands.sonarr) {
    commands.push(showCommand);
}

if (config.commands.sonarr || config.commands.radarr) {
    commands.push(queueCommand);
    commands.push(missingCommand);
}

if (config.commands.plex) {
    commands.push(scanCommand);
}
