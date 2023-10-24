// system file, please don't modify it

import discord from "discord.js"
import * as builders from "@discordjs/builders"
import * as rest from "@discordjs/rest"
import v10 from "discord-api-types/v10"
import path from "path"
import chalk from "chalk"

import * as handler from "@ghom/handler"
import * as logger from "./logger.js"

import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

export const slashCommandHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "slash"),
  {
    pattern: /\.js$/,
    onLoad: async (filepath) => {
      const file = await import("file://" + filepath)
      const command = file.default as SlashCommand
      command.filepath = filepath
      command.native = filepath.endsWith("native.js")
      slashCommands.add(command)
    },
  }
)

export const slashCommands = new (class extends discord.Collection<
  string,
  SlashCommand
> {
  add(command: SlashCommand) {
    validateSlashCommand(command)
    this.set(command.options.name, command)
  }
})()

export interface SlashCommandOptions {
  name: string
  description: string
  build?: (
    this: builders.SlashCommandBuilder,
    builder: builders.SlashCommandBuilder
  ) => unknown
  run: (
    this: discord.CommandInteraction,
    interaction: discord.CommandInteraction
  ) => unknown
}

export class SlashCommand {
  filepath?: string
  native = false
  builder = new builders.SlashCommandBuilder()

  constructor(public options: SlashCommandOptions) {}
}

export function validateSlashCommand(command: SlashCommand) {
  command.builder
    .setName(command.options.name)
    .setDescription(command.options.description)

  command.options.build?.bind(command.builder)(command.builder)

  logger.log(
    `loaded command ${chalk.blueBright("/" + command.options.name)}${
      command.native ? chalk.green(" native") : ""
    } ${chalk.grey(command.options.description)}`
  )
}

export async function registerSlashCommands(guildId?: string) {
  const api = new rest.REST({ version: "10" }).setToken(process.env.BOT_TOKEN!)

  try {
    const data = (await api.put(
      guildId
        ? v10.Routes.applicationGuildCommands(process.env.BOT_ID!, guildId)
        : v10.Routes.applicationCommands(process.env.BOT_ID!),
      {
        body: slashCommands.map((cmd) => cmd.builder.toJSON()),
      }
    )) as unknown[]

    logger.log(
      `deployed ${chalk.blue(data.length)} slash commands${
        guildId ? ` to new guild ${chalk.blue(guildId)}` : ""
      }`
    )
  } catch (error: any) {
    logger.error(error, __filename, true)
  }
}
