// system file, please don't modify it

import url from "url"
import discord from "discord.js"
import * as rest from "@discordjs/rest"
import v10 from "discord-api-types/v10"
import path from "path"
import chalk from "chalk"

import * as handler from "@ghom/handler"

import env from "#env"
import logger from "#logger"
import config from "#config"

import * as util from "./util.ts"

import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

export const slashCommandHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "slash"),
  {
    pattern: /\.js$/,
    loader: async (filepath) => {
      const file = await import(url.pathToFileURL(filepath).href)
      return file.default as ISlashCommand | ISlashCommandGroup
    },
    onLoad: async (filepath, command) => {
      command.native = filepath.endsWith("native.js")
      command.filepath = filepath
      return slashCommands.add(command)
    },
  },
)

export const slashCommands = new (class extends discord.Collection<
  string,
  ISlashCommand | ISlashCommandGroup
> {
  add(command: ISlashCommand | ISlashCommandGroup) {
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

export interface ISlashCommandGroupOptions {
  name: string
  description: string
  guildOnly?: boolean
  guildOwnerOnly?: boolean
  botOwnerOnly?: boolean
  userPermissions?: util.PermissionsNames[]
  allowRoles?: discord.RoleResolvable[]
  denyRoles?: discord.RoleResolvable[]
  commands: (ISlashCommand | ISlashCommandGroup)[]
}

export interface SlashCommandOptions<
  Options extends Record<
    string,
    SlashCommandOption<SlashCommandOptionTypeName>
  >,
> {
  name: string
  description: string
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
    this: SlashCommandInteraction<Options>,
    interaction: SlashCommandInteraction<Options>,
  ) => unknown
  options?: Options
}

export interface SlashCommandGroupOptions {
  name: string
  description: string
  guildOwnerOnly?: boolean
  botOwnerOnly?: boolean
  userPermissions?: discord.PermissionsString[]
  allowRoles?: discord.RoleResolvable[]
  denyRoles?: discord.RoleResolvable[]
  commands: (SlashCommand<any> | SlashCommandGroup)[]
}

export interface ISlashCommandBase {
  filepath?: string
  native: boolean
  builder: discord.SlashCommandBuilder
}

export interface ISlashCommand extends ISlashCommandBase {
  options: ISlashCommandOptions
}

export interface ISlashCommandGroup extends ISlashCommandBase {
  options: ISlashCommandGroupOptions
}

abstract class SlashCommandBase {
  filepath?: string
  native = false
  builder = new discord.SlashCommandBuilder()
}

export class SlashCommand<
  Options extends Record<
    string,
    SlashCommandOption<SlashCommandOptionTypeName>
  >,
> extends SlashCommandBase {
  constructor(public options: SlashCommandOptions<Options>) {
    super()
  }
}

export class SlashCommandGroup extends SlashCommandBase {
  constructor(public options: SlashCommandGroupOptions) {
    super()
  }
}

export interface SlashCommandOption<Type extends SlashCommandOptionTypeName> {
  description: string
  type: Type
  required?: boolean
  default?: NoInfer<TypeNameToType<Type>>
}

export interface ISlashCommandInteraction {
  base: discord.CommandInteraction
  client: discord.Client<true>
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
  Options extends Record<
    string,
    SlashCommandOption<SlashCommandOptionTypeName>
  >,
> {
  base: discord.CommandInteraction<"raw" | "cached">
  client: discord.Client<true>
  guild: discord.Guild
  guildId: string
  channel:
    | discord.ThreadChannel
    | discord.NewsChannel
    | discord.DMChannel
    | discord.TextChannel
    | discord.TextBasedChannel
    | discord.GuildTextBasedChannel
  options: {
    [K in keyof Options]: SlashCommandOptionToType<Options[K]>
  }
}

export function validateSlashCommand(
  command: ISlashCommand | ISlashCommandGroup,
) {
  command.builder
    .setName(command.options.name)
    .setDescription(command.options.description)

  if (command.options.userPermissions)
    command.builder.setDefaultMemberPermissions(
      command.options.userPermissions.reduce((bit, name) => {
        return bit | v10.PermissionFlagsBits[name]
      }, 0n),
    )

  if (isSlashCommandGroup(command)) {
    if (command.options.commands.length === 0)
      throw new Error("Slash command group must have at least one command")

    for (const subcommand of command.options.commands) {
      if (isSlashCommandGroup(subcommand)) {
        command.builder.addSubcommandGroup((group) => {
          group
            .setName(subcommand.options.name)
            .setDescription(subcommand.options.description)
          validateSlashCommand(subcommand)
          return group
        })
      } else {
        command.builder.addSubcommand((builder) => {
          builder
            .setName(subcommand.options.name)
            .setDescription(subcommand.options.description)
          validateSlashCommand(subcommand)
          return builder
        })
      }
    }
  } else {
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
}

export async function registerSlashCommands(guildId?: string) {
  const api = new rest.REST({ version: "10" }).setToken(env.BOT_TOKEN)

  try {
    const data = (await api.put(
      guildId
        ? v10.Routes.applicationGuildCommands(env.BOT_ID, guildId)
        : v10.Routes.applicationCommands(env.BOT_ID),
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
  command: ISlashCommand | ISlashCommandGroup,
): Promise<ISlashCommandInteraction | never> {
  const output: ISlashCommandInteraction = {
    base: interaction,
    client: interaction.client,
    guild: undefined,
    guildId: undefined,
    channel: interaction.channel!,
    options: {},
  }

  if (command.options.botOwnerOnly && interaction.user.id !== env.BOT_OWNER)
    throw new Error("This command can only be used by the bot owner")

  if (command.options.guildOnly) {
    if (!interaction.inGuild() || !interaction.guild)
      throw new Error("This command can only be used in a guild")

    output.guild = interaction.guild
    output.guildId = interaction.guildId

    if (
      command.options.guildOwnerOnly &&
      interaction.user.id !== interaction.guild.ownerId
    )
      throw new Error("This command can only be used by the guild owner")

    if (command.options.allowRoles || command.options.denyRoles) {
      const member = await interaction.guild.members.fetch(interaction.user.id)

      if (command.options.allowRoles) {
        if (
          !member.roles.cache.some((role) =>
            command.options.allowRoles?.includes(role.id),
          )
        )
          throw new Error(
            "You don't have the required role to use this command",
          )
      }

      if (command.options.denyRoles) {
        if (
          member.roles.cache.some((role) =>
            command.options.denyRoles?.includes(role.id),
          )
        )
          throw new Error(
            "You have a role that is not allowed to use this command",
          )
      }
    }
  }

  if (isSlashCommandGroup(command)) {
    const cmd = command.options.commands.find(
      (cmd) => cmd.options.name === interaction.command.get.get(), ??????
    )

    if (!cmd) throw new Error(`Subcommand "${subcommand}" not found in group`)

    return prepareSlashCommand(interaction, cmd)
  } else {
    if (command.options.options) {
      for (const name in command.options.options) {
        const option = command.options.options[name]

        const value = interaction.options.get(name) ?? option.default ?? null

        if (option.required && value === null)
          throw new Error(`Option "${name}" is required`)

        output.options[name] = value
      }
    }
  }

  if (interaction.options.data.length > 0) {
    output.options = interaction.options.data.reduce(
      (acc, option) => {
        if (option.name in output.options) return acc
        acc[option.name] = option.value
        return acc
      },
      {} as Record<string, any>,
    )
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
  const { detailSlashCommand } = config

  const command = slashCommands.get(computed.name)

  if (!command) throw new Error(`Command ${computed.name} not found`)

  await interaction.base.reply(
    detailSlashCommand
      ? await detailSlashCommand(interaction, computed)
      : await util.getSystemMessage("default", {
          author: {
            name: computed.name,
            iconURL: computed.client.user?.displayAvatarURL(),
            url: config.openSource
              ? await util.getFileGitURL(command.filepath!)
              : undefined,
          },
          description: `Use directly: </${computed.name}:${computed.id}>\nDescription: ${computed.description || "no description"}`,
          footer: config.openSource
            ? {
                text: util.convertDistPathToSrc(
                  util.rootPath(command.filepath!),
                ),
              }
            : undefined,
          fields: computed.options.map((option) => ({
            name: option.name,
            value: option.description || "no description",
            inline: true,
          })),
        }),
  )
}

export type SlashCommandOptionTypeName = Omit<
  keyof typeof discord.ApplicationCommandOptionType,
  "Subcommand" | "SubcommandGroup"
>

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

export function isSlashCommandGroup(
  command: ISlashCommand | ISlashCommandGroup,
): command is ISlashCommandGroup {
  return "commands" in command
}
