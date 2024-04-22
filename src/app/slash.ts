// system file, please don't modify it

import url from "url"
import discord from "discord.js"
import * as rest from "@discordjs/rest"
import v10 from "discord-api-types/v10"
import path from "path"
import chalk from "chalk"

import * as handler from "@ghom/handler"
import * as logger from "./logger.js"
import * as util from "./util.js"

import { config } from "../config.js"

import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

export const slashCommandHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "slash"),
  {
    pattern: /\.js$/,
    loader: async (filepath) => {
      const file = await import(url.pathToFileURL(filepath).href)
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
  options?: Record<string, SlashCommandOption<SlashCommandOptionTypeName>>
}

export interface SlashCommandOptions<
  GuildOnly extends boolean,
  ChannelType extends SlashCommandChannelType,
  Options extends Record<
    string,
    SlashCommandOption<SlashCommandOptionTypeName>
  >,
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
    this: SlashCommandInteraction<GuildOnly, ChannelType, Options>,
    interaction: SlashCommandInteraction<GuildOnly, ChannelType, Options>,
  ) => unknown
  options?: Options
}

export class SlashCommand<
  GuildOnly extends boolean,
  ChannelType extends SlashCommandChannelType,
  Options extends Record<
    string,
    SlashCommandOption<SlashCommandOptionTypeName>
  >,
> {
  filepath?: string
  native = false
  builder = new discord.SlashCommandBuilder()

  constructor(
    public options: SlashCommandOptions<GuildOnly, ChannelType, Options>,
  ) {}
}

export interface SlashCommandOption<Type extends SlashCommandOptionTypeName> {
  description: string
  type: Type
  required?: boolean
  default?: NoInfer<TypeNameToType<Type>>
}

export interface ISlashCommand {
  filepath?: string
  native: boolean
  builder: discord.SlashCommandBuilder
  options: ISlashCommandOptions
}

export interface ISlashCommandInteraction
  extends Omit<
    discord.CommandInteraction,
    "guild" | "guildId" | "channel" | "options"
  > {
  base: discord.CommandInteraction
  guild?: discord.Guild
  guildId?: string
  channel:
    | discord.ThreadChannel
    | discord.NewsChannel
    | discord.DMChannel
    | discord.TextChannel
    | discord.TextBasedChannel
    | discord.GuildTextBasedChannel
  options: Record<string, any>
}

export interface SlashCommandInteraction<
  GuildOnly extends boolean,
  ChannelType extends SlashCommandChannelType,
  Options extends Record<
    string,
    SlashCommandOption<SlashCommandOptionTypeName>
  >,
> extends Omit<
    discord.CommandInteraction,
    "guild" | "guildId" | "channel" | "options"
  > {
  base: GuildOnly extends true
    ? discord.CommandInteraction<"raw" | "cached">
    : discord.CommandInteraction
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
  options: {
    [K in keyof Options]: SlashCommandOptionToType<Options[K]>
  }
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

  if (command.options.options) {
    for (const name in command.options.options) {
      const option = command.options.options[name]

      const build = <Option extends discord.ApplicationCommandOptionBase>(
        option: Option,
      ) => {
        option.setName(name)

        if (option.description) option.setDescription(option.description)
        if (option.required) option.setRequired(option.required)

        return option
      }

      switch (option.type) {
        case "Attachment":
          command.builder.addAttachmentOption(build)
          break
        case "Boolean":
          command.builder.addBooleanOption(build)
          break
        case "Channel":
          command.builder.addChannelOption(build)
          break
        case "Integer":
          command.builder.addIntegerOption(build)
          break
        case "Mentionable":
          command.builder.addMentionableOption(build)
          break
        case "Number":
          command.builder.addNumberOption(build)
          break
        case "Role":
          command.builder.addRoleOption(build)
          break
        case "String":
          command.builder.addStringOption(build)
          break
        case "User":
          command.builder.addUserOption(build)
          break
        case "Subcommand":
          command.builder.addSubcommand((option) => {
            option.setName(name)

            if (option.description) option.setDescription(option.description)

            return option
          })
          break
        case "SubcommandGroup":
          command.builder.addSubcommandGroup((option) => {
            option.setName(name)

            if (option.description) option.setDescription(option.description)

            return option
          })
          break
        default:
          throw new Error(
            `Unknown slash command option type "${option.type}" for option "${name}"`,
          )
      }
    }
  }

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
    base: interaction,
    ...interaction,
    guild: undefined,
    guildId: undefined,
    channel: interaction.channel!,
    options: {},
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

  if (command.options.options) {
    for (const name in command.options.options) {
      const option = command.options.options[name]

      let value = interaction.options.get(name) ?? option.default ?? null

      if (option.required && value === null)
        return new discord.EmbedBuilder()
          .setColor("Red")
          .setDescription(`Option "${name}" is required`)

      output.options[name] = value
    }
  }

  return output
}

export function slashCommandToListItem(
  computed: discord.ApplicationCommand,
): string {
  return `</${computed.name}:${computed.id}> - ${
    computed.description || "no description"
  }`
}

export async function sendSlashCommandDetails(
  interaction: ISlashCommandInteraction,
  computed: discord.ApplicationCommand,
) {
  interaction.reply(
    config.detailSlashCommand
      ? await config.detailSlashCommand(interaction, computed)
      : {
          embeds: [
            new discord.EmbedBuilder()
              .setColor("Blurple")
              .setAuthor({
                name: computed.name,
                iconURL: computed.client.user?.displayAvatarURL(),
              })
              .setDescription(computed.description || "no description"),
          ],
        },
  )
}

export type InteractionReplyOptionsResolvable =
  | string
  | discord.MessagePayload
  | discord.InteractionReplyOptions

export type SlashCommandOptionTypeName =
  keyof typeof discord.ApplicationCommandOptionType

export type SlashCommandOptionToType<
  Option extends SlashCommandOption<SlashCommandOptionTypeName>,
> = Option["required"] extends true
  ? TypeNameToType<Option["type"]>
  : Option["default"] extends TypeNameToType<Option["type"]>
    ? TypeNameToType<Option["type"]>
    : TypeNameToType<Option["type"]> | null

export type TypeNameToType<TypeName extends SlashCommandOptionTypeName> =
  TypeName extends "String"
    ? string
    : TypeName extends "Integer"
      ? number
      : TypeName extends "Boolean"
        ? boolean
        : TypeName extends "User"
          ? discord.User
          : TypeName extends "Channel"
            ? discord.Channel
            : TypeName extends "Role"
              ? discord.Role
              : TypeName extends "Mentionable"
                ? discord.User | discord.Role | discord.Channel
                : TypeName extends "Number"
                  ? number
                  : TypeName extends "Attachment"
                    ? discord.Attachment
                    : never
