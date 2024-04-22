// system file, please don't modify it

import type * as discord from "discord.js"
import type * as command from "./command.js"
import type * as slash from "./slash.js"

export interface Config {
  /**
   * Ignore bots messages for textual commands if enabled
   */
  ignoreBots?: boolean

  /**
   * Add a source link to the help command and make possible
   * to show the source code of any command if enabled
   */
  openSource?: boolean

  /**
   * Get the prefix for the bot from a message object
   * (using a database or cache for example)
   */
  getPrefix: (message: command.NormalMessage) => Promise<string> | string

  /**
   * Custom help command for textual commands
   */
  detailCommand?: (
    message: command.IMessage,
    command: command.ICommand,
  ) =>
    | Promise<command.MessageCreateOptionsResolvable>
    | command.MessageCreateOptionsResolvable

  /**
   * Custom help command for slash commands
   */
  detailSlashCommand?: (
    interaction: slash.ISlashCommandInteraction,
    command: discord.ApplicationCommand,
  ) =>
    | Promise<slash.InteractionReplyOptionsResolvable>
    | slash.InteractionReplyOptionsResolvable

  /**
   * Options for the Discord Client constructor
   */
  client: discord.ClientOptions
}
