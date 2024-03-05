// system file, please don't modify it

import discord, { Guild } from "discord.js"
import * as rest from "@discordjs/rest"
import v10 from "discord-api-types/v10"
import path from "path"
import chalk from "chalk"

import * as handler from "@ghom/handler"
import * as logger from "./logger.js"
import * as util from "./util.js"

import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

export const slashCommandHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "slash"),
  {
    pattern: /\.js$/,
    loader: async (filepath) => {
      const file = await import("file://" + filepath)
      return file.default as ISlashCommand
    },
    onLoad: async (filepath, command) => {
      command.filepath = filepath
      command.native = filepath.endsWith("native.js")
      slashCommands.add(command)
    },
  },
)

export const slashCommands = new (class extends discord.Collection<
  string,
  ISlashCommand
> {
  add(command: ISlashCommand) {
    validateSlashCommand(command)
    this.set(command.options.name, command)
  }
})()

export type SlashCommandChannelType = "guild" | "dm" | "thread"

export interface ISlashCommandOptions {
  name: string
  description: string
  channelType?: SlashCommandChannelType
  guildOnly?: boolean
  guildOwnerOnly?: boolean
  botOwnerOnly?: boolean
  userPermissions?: util.PermissionsNames[]
  allowRoles?: discord.RoleResolvable[]
  denyRoles?: discord.RoleResolvable[]
  run: (interaction: ISlashCommandInteraction) => unknown | Promise<unknown>
  build?: (builder: discord.SlashCommandBuilder) => unknown | Promise<unknown>
}

export interface SlashCommandOptions<
  GuildOnly extends boolean,
  ChannelType extends SlashCommandChannelType,
> {
  name: string
  description: string
  channelType?: ChannelType
  guildOnly?: GuildOnly
  guildOwnerOnly?: boolean
  botOwnerOnly?: boolean
  userPermissions?: discord.PermissionsString[]
  allowRoles?: discord.RoleResolvable[]
  denyRoles?: discord.RoleResolvable[]
  build?: (
    this: discord.SlashCommandBuilder,
    builder: discord.SlashCommandBuilder,
  ) => unknown
  run: (
    this: SlashCommandInteraction<GuildOnly, ChannelType>,
    interaction: SlashCommandInteraction<GuildOnly, ChannelType>,
  ) => unknown
}

export class SlashCommand<
  GuildOnly extends boolean,
  ChannelType extends SlashCommandChannelType,
> {
  filepath?: string
  native = false
  builder = new discord.SlashCommandBuilder()

  constructor(public options: SlashCommandOptions<GuildOnly, ChannelType>) {}
}

export interface ISlashCommand {
  filepath?: string
  native: boolean
  builder: discord.SlashCommandBuilder
  options: ISlashCommandOptions
}

export interface ISlashCommandInteraction
  extends Omit<discord.CommandInteraction, "guild" | "guildId" | "channel"> {
  guild?: discord.Guild
  guildId?: string
  channel:
    | discord.ThreadChannel
    | discord.NewsChannel
    | discord.DMChannel
    | discord.TextChannel
    | discord.TextBasedChannel
    | discord.GuildTextBasedChannel
}

export interface SlashCommandInteraction<
  GuildOnly extends boolean,
  ChannelType extends SlashCommandChannelType,
> extends Omit<discord.CommandInteraction, "guild" | "guildId" | "channel"> {
  guild: GuildOnly extends true ? discord.Guild : undefined
  guildId: GuildOnly extends true ? string : undefined
  channel: ChannelType extends "dm"
    ? discord.DMChannel
    : ChannelType extends "thread"
      ? discord.ThreadChannel
      : GuildOnly extends true
        ? discord.GuildTextBasedChannel
        : ChannelType extends "guild"
          ? discord.GuildTextBasedChannel
          : discord.TextBasedChannel
}

export function validateSlashCommand(command: ISlashCommand) {
  command.builder
    .setName(command.options.name)
    .setDescription(command.options.description)

  if (command.options.userPermissions)
    command.builder.setDefaultMemberPermissions(
      command.options.userPermissions.reduce((bit, name) => {
        return bit | v10.PermissionFlagsBits[name]
      }, 0n),
    )

  command.options.build?.bind(command.builder)(command.builder)

  logger.log(
    `loaded command ${chalk.blueBright("/" + command.options.name)}${
      command.native ? chalk.green(" native") : ""
    } ${chalk.grey(command.options.description)}`,
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
      },
    )) as unknown[]

    logger.log(
      `deployed ${chalk.blue(data.length)} slash commands${
        guildId ? ` to new guild ${chalk.blue(guildId)}` : ""
      }`,
    )
  } catch (error: any) {
    logger.error(error, __filename, true)
  }
}

export async function prepareSlashCommand(
  interaction: discord.CommandInteraction,
  command: ISlashCommand,
): Promise<ISlashCommandInteraction | discord.EmbedBuilder> {
  // @ts-ignore
  const output: ISlashCommandInteraction = {
    ...interaction,
    guild: undefined,
    guildId: undefined,
    channel: interaction.channel!,
  }

  if (
    command.options.botOwnerOnly &&
    interaction.user.id !== process.env.BOT_OWNER
  )
    return new discord.EmbedBuilder()
      .setColor("Red")
      .setDescription("This command can only be used by the bot owner")

  if (
    command.options.guildOnly ||
    (command.options.guildOnly !== false &&
      command.options.channelType !== "dm")
  ) {
    if (!interaction.inGuild() || !interaction.guild)
      return new discord.EmbedBuilder()
        .setColor("Red")
        .setDescription("This command can only be used in a guild")

    output.guild = interaction.guild
    output.guildId = interaction.guildId

    if (
      command.options.guildOwnerOnly &&
      interaction.user.id !== interaction.guild.ownerId
    )
      return new discord.EmbedBuilder()
        .setColor("Red")
        .setDescription("This command can only be used by the guild owner")

    if (command.options.allowRoles || command.options.denyRoles) {
      const member = await interaction.guild.members.fetch(interaction.user.id)

      if (command.options.allowRoles) {
        if (
          !member.roles.cache.some((role) =>
            command.options.allowRoles?.includes(role.id),
          )
        )
          return new discord.EmbedBuilder()
            .setColor("Red")
            .setDescription(
              "You don't have the required role to use this command",
            )
      }

      if (command.options.denyRoles) {
        if (
          member.roles.cache.some((role) =>
            command.options.denyRoles?.includes(role.id),
          )
        )
          return new discord.EmbedBuilder()
            .setColor("Red")
            .setDescription(
              "You have a role that is not allowed to use this command",
            )
      }
    }
  }

  if (command.options.channelType === "thread") {
    if (!interaction.channel || !interaction.channel.isThread())
      return new discord.EmbedBuilder()
        .setColor("Red")
        .setDescription("This command can only be used in a thread")
  } else if (command.options.channelType === "dm") {
    if (!interaction.channel || !interaction.channel.isDMBased())
      return new discord.EmbedBuilder()
        .setColor("Red")
        .setDescription("This command can only be used in a DM")
  }

  return output
}
