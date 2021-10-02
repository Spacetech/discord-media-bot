import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction, InteractionReplyOptions, SelectMenuInteraction } from "discord.js";
import { IUserState } from "../state";

export interface ICommand {
    slashCommand: Partial<SlashCommandBuilder>;

    commandProcessor?(interaction: CommandInteraction, state: IUserState): Promise<InteractionReplyOptions>;
    selectMenuProcessor?(interaction: SelectMenuInteraction, state: IUserState, subCommand: string, selection: string): Promise<InteractionReplyOptions>;
    buttonProcessor?(interaction: ButtonInteraction, state: IUserState, subCommand: string, selection: string): Promise<InteractionReplyOptions>;
}
