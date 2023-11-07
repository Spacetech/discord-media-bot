import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, ChatInputCommandInteraction, InteractionReplyOptions, SelectMenuInteraction } from "discord.js";
import { IUserState } from "../state";

export interface ICommand {
    slashCommand: Partial<SlashCommandBuilder>;

    commandProcessor?(interaction: ChatInputCommandInteraction, state: IUserState): Promise<InteractionReplyOptions>;
    selectMenuProcessor?(interaction: SelectMenuInteraction, state: IUserState, subCommand: string, selection: string): Promise<InteractionReplyOptions>;
    buttonProcessor?(interaction: ButtonInteraction, state: IUserState, subCommand: string, selection: string): Promise<InteractionReplyOptions>;
}
