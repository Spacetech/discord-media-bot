import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction, InteractionReplyOptions, SelectMenuInteraction } from "discord.js";
import { IUserState } from "../state";

export interface ICommand {
    slashCommand: Partial<SlashCommandBuilder>;

    commandProcessor?(interaction: CommandInteraction, state: IUserState): Promise<InteractionReplyOptions>;
    selectMenuProcessor?(interaction: SelectMenuInteraction, state: IUserState, selection: string, subCommand: string | undefined): Promise<InteractionReplyOptions>;
    buttonProcessor?(interaction: ButtonInteraction, state: IUserState, selection: string, subCommand: string | undefined): Promise<InteractionReplyOptions>;
}
