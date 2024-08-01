// system file, please don't modify it

import url from "url"
import discord from "discord.js"
import * as rest from "@discordjs/rest"
import v10 from "discord-api-types/v10"
import path from "path"

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
      return file.default as ISlashCommand
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
  run: (
    interaction: discord.ChatInputCommandInteraction,
  ) => unknown | Promise<unknown>
  build?: (builder: discord.SlashCommandBuilder) => unknown | Promise<unknown>
}

export interface SlashCommandOptions {
  name: string
  description: string
  channelType?: SlashCommandChannelType
  guildOnly?: boolean
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
    this: discord.ChatInputCommandInteraction,
    interaction: discord.ChatInputCommandInteraction,
  ) => unknown
}

export class SlashCommand {
  filepath?: string
  native = false
  builder = new discord.SlashCommandBuilder()

  constructor(public options: SlashCommandOptions) {}
}

export interface ISlashCommand {
  filepath?: string
  native: boolean
  builder: discord.SlashCommandBuilder
  options: ISlashCommandOptions
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
    `loaded command ${util.styleText(
      "blueBright",
      "/" + command.options.name,
    )}${
      command.native ? util.styleText("green", " native") : ""
    } ${util.styleText("grey", command.options.description)}`,
  )
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
      `deployed ${util.styleText("blue", String(data.length))} slash commands${
        guildId ? ` to new guild ${util.styleText("blue", guildId)}` : ""
      }`,
    )
  } catch (error: any) {
    logger.error(error, __filename, true)
  }
}

export async function prepareSlashCommand(
  interaction: discord.ChatInputCommandInteraction,
  command: ISlashCommand,
): Promise<void | never> {
  if (command.options.botOwnerOnly && interaction.user.id !== env.BOT_OWNER)
    throw new Error("This command can only be used by the bot owner")

  if (
    command.options.guildOnly ||
    (command.options.guildOnly !== false &&
      command.options.channelType !== "dm")
  ) {
    if (!interaction.inGuild() || !interaction.guild)
      throw new Error("This command can only be used in a guild")

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

  if (command.options.channelType === "thread") {
    if (!interaction.channel || !interaction.channel.isThread())
      throw new Error("This command can only be used in a thread")
  } else if (command.options.channelType === "dm") {
    if (!interaction.channel || !interaction.channel.isDMBased())
      throw new Error("This command can only be used in a DM")
  }
}

export function slashCommandToListItem(
  computed: discord.ApplicationCommand,
): string {
  return `</${computed.name}:${computed.id}> - ${
    computed.description || "no description"
  }`
}

export async function sendSlashCommandDetails(
  interaction: discord.ChatInputCommandInteraction,
  computed: discord.ApplicationCommand,
) {
  const { detailSlashCommand } = config

  const command = slashCommands.get(computed.name)

  if (!command) throw new Error(`Command ${computed.name} not found`)

  await interaction.reply(
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
          description: `Use directly: </${computed.name}:${
            computed.id
          }>\nDescription: ${computed.description || "no description"}`,
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
