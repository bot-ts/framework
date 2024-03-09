// system file, please don't modify it

import type * as discord from "discord.js"
import type * as command from "./command.js"
import type * as slash from "./slash.js"

export interface Config {
  ignoreBots?: boolean
  getPrefix: (message: command.NormalMessage) => Promise<string> | string
  detailCommand?: (
    message: command.IMessage,
    command: command.ICommand,
  ) =>
    | Promise<command.MessageCreateOptionsResolvable>
    | command.MessageCreateOptionsResolvable
  detailSlashCommand?: (
    interaction: slash.ISlashCommandInteraction,
    command: discord.ApplicationCommand,
  ) =>
    | Promise<slash.InteractionReplyOptionsResolvable>
    | slash.InteractionReplyOptionsResolvable
  client: discord.ClientOptions
}
