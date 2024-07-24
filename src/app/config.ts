// system file, please don't modify it

import type * as discord from "discord.js"
import type * as zod from "zod"

import type * as pagination from "./pagination.ts"
import type * as command from "./command.ts"
import type * as logger from "./logger.ts"
import type * as slash from "./slash.ts"
import type * as util from "./util.ts"

export interface ConfigOptions<ZodSchema extends zod.ZodType<any, any, any>> {
  /**
   * Options for the Discord Client constructor
   */
  client: discord.ClientOptions

  /**
   * Custom Zod schema for custom values in the .env file
   */
  envSchema: ZodSchema

  /**
   * Custom permissions for the bot invitation link
   */
  permissions: discord.PermissionResolvable[]

  /**
   * Ignore bots messages for textual commands if enabled
   * @default false
   */
  ignoreBots?: boolean

  /**
   * Add a source link to the help command and make possible
   * to show the source code of any command if enabled
   * @default false
   */
  openSource?: boolean

  /**
   * Display the bot name in the console when the bot is ready
   * @default false
   */
  printNameOnReady?: boolean

  /**
   * Get the prefix for the bot from a message object
   * (using a database or cache for example)
   * @default () => env.BOT_PREFIX
   */
  getPrefix?: (message: command.NormalMessage) => Promise<string> | string

  /**
   * Custom help command for textual commands
   * @default command.sendCommandDetails
   */
  detailCommand?: (
    message: command.IMessage,
    command: command.ICommand,
  ) => Promise<util.SystemMessage> | util.SystemMessage

  /**
   * Custom help command for slash commands
   * @default slash.sendSlashCommandDetails
   */
  detailSlashCommand?: (
    interaction: slash.ISlashCommandInteraction,
    command: discord.ApplicationCommand,
  ) => Promise<util.SystemMessage> | util.SystemMessage

  /**
   * Custom emotes for the paginator (use guild emojis IDs or web emotes)
   * @default { first: "⏮️", back: "◀️", next: "▶️", last: "⏭️" }
   */
  paginatorEmojis?: pagination.PaginatorEmojis

  /**
   * Custom emotes for system messages (use guild emojis IDs or web emotes)
   * @default { error: "❌", success: "✅", warning: "⚠️", loading: "⏳" }
   */
  systemEmojis?: Partial<util.SystemEmojis>

  /**
   * Custom messages for the system
   * @default util.defaultSystemMessages
   */
  systemMessages?: Partial<util.SystemMessages>

  /**
   * Custom options for the system logger
   * @default <pre>{
   *   pattern: app.defaultLoggerPattern,
   *   colors: app.defaultLoggerColors,
   *   renders: app.defaultLoggerRenders
   * }</pre>
   */
  logger?: logger.LoggerOptions
}

export class Config<ZodSchema extends zod.ZodType<any, any, any>> {
  constructor(public readonly options: ConfigOptions<ZodSchema>) {}
}
