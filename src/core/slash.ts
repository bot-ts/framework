// system file, please don't modify it

import url from "node:url"
import discord from "discord.js"

import * as handler from "@ghom/handler"

import config from "#config"
import * as command from "#core/command"
import env from "#core/env"
import logger from "#core/logger"
import * as util from "#core/util"

import { styleText } from "node:util"

const __filename = util.getCurrentFilename(import.meta)

export class SlashCommandError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "SlashCommandError"
	}
}

export const slashCommandHandler = new handler.Handler<ISlashCommand>(
	util.srcPath("slash"),
	{
		pattern: /\.[tj]s$/,
		loader: async (filepath) => {
			const file = await import(url.pathToFileURL(filepath).href)
			if (file.default instanceof SlashCommand) return file.default
			throw new Error(
				`${filepath}: default export must be a SlashCommand instance`,
			)
		},
		onLoad: async (filepath, command) => {
			command.native = /.native.[jt]s$/.test(filepath)
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
	middlewares?: command.IMiddleware[]
	run: (
		interaction: discord.ChatInputCommandInteraction,
	) => unknown | Promise<unknown>
	build?: (builder: discord.SlashCommandBuilder) => unknown | Promise<unknown>
}

export interface SlashCommandOptions<
	ChannelType extends SlashCommandChannelType,
	GuildOnly extends boolean,
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
	middlewares?: command.Middleware<
		SlashCommandInteraction<ChannelType, GuildOnly>
	>[]
	build?: (
		this: discord.SlashCommandBuilder,
		builder: discord.SlashCommandBuilder,
	) => unknown
	run: (
		this: SlashCommandInteraction<ChannelType, GuildOnly>,
		interaction: SlashCommandInteraction<ChannelType, GuildOnly>,
	) => unknown
}

export interface SlashCommandInteraction<
	ChannelType extends SlashCommandChannelType,
	GuildOnly extends boolean,
> extends discord.ChatInputCommandInteraction {
	channel: ChannelType extends "guild"
		? command.GuildMessage["channel"]
		: ChannelType extends "dm"
			? command.DirectMessage["channel"]
			: discord.AnyThreadChannel
	guild: GuildOnly extends true ? command.GuildMessage["guild"] : null
}

export class SlashCommand<
	ChannelType extends SlashCommandChannelType,
	GuildOnly extends boolean,
> {
	filepath?: string
	native = false
	builder = new discord.SlashCommandBuilder()

	constructor(public options: SlashCommandOptions<ChannelType, GuildOnly>) {}
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
				return bit | discord.PermissionFlagsBits[name]
			}, 0n),
		)

	command.options.build?.bind(command.builder)(command.builder)

	debugSlashCommandBuilder(command.builder)

	logger.log(
		`loaded command ${styleText("blueBright", `/${command.options.name}`)}${
			command.native ? styleText("green", " native") : ""
		} ${styleText("grey", command.options.description)}`,
	)
}

export async function registerSlashCommands(
	client: discord.Client<true>,
	guildId?: string,
) {
	try {
		const data = slashCommands.map((command) => command.builder.toJSON())

		if (guildId) {
			const guild = await client.guilds.fetch(guildId)
			await guild.commands.set(data)
		} else {
			await client.application.commands.set(data)
		}

		logger.log(
			`deployed ${styleText("blue", String(data.length))} slash commands${
				guildId ? ` to new guild ${styleText("blue", guildId)}` : ""
			}`,
		)
	} catch (error: any) {
		logger.error(error, __filename, true)
	}
}

export async function prepareSlashCommand(
	interaction: discord.ChatInputCommandInteraction,
	cmd: ISlashCommand,
): Promise<void | never> {
	if (cmd.options.botOwnerOnly && interaction.user.id !== env.BOT_OWNER)
		throw new SlashCommandError(
			"This command can only be used by the bot owner",
		)

	if (
		cmd.options.guildOnly ||
		(cmd.options.guildOnly !== false && cmd.options.channelType !== "dm")
	) {
		if (!interaction.inGuild() || !interaction.guild)
			throw new SlashCommandError("This command can only be used in a guild")

		if (
			cmd.options.guildOwnerOnly &&
			interaction.user.id !== interaction.guild.ownerId
		)
			throw new SlashCommandError(
				"This command can only be used by the guild owner",
			)

		if (cmd.options.allowRoles || cmd.options.denyRoles) {
			const member = await interaction.guild.members.fetch(interaction.user.id)

			if (cmd.options.allowRoles) {
				if (
					!member.roles.cache.some((role) =>
						cmd.options.allowRoles?.includes(role.id),
					)
				)
					throw new SlashCommandError(
						"You don't have the required role to use this command",
					)
			}

			if (cmd.options.denyRoles) {
				if (
					member.roles.cache.some((role) =>
						cmd.options.denyRoles?.includes(role.id),
					)
				)
					throw new SlashCommandError(
						"You have a role that is not allowed to use this command",
					)
			}
		}
	}

	if (cmd.options.channelType === "thread") {
		if (!interaction.channel || !interaction.channel.isThread())
			throw new SlashCommandError("This command can only be used in a thread")
	} else if (cmd.options.channelType === "dm") {
		if (!interaction.channel || !interaction.channel.isDMBased())
			throw new SlashCommandError("This command can only be used in a DM")
	}

	if (cmd.options.middlewares) {
		const result = await command.prepareMiddlewares(
			interaction,
			cmd.options.middlewares,
		)

		if (result !== true) {
			if (result === false)
				throw new SlashCommandError("This command is stopped by a middleware")
			throw result
		}
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

	if (!command)
		throw new SlashCommandError(`Command ${computed.name} not found`)

	await interaction.reply(
		detailSlashCommand
			? await detailSlashCommand(interaction, computed)
			: {
					embeds: [
						new discord.EmbedBuilder()
							.setAuthor({
								name: computed.name,
								iconURL: computed.client.user?.displayAvatarURL(),
								url: config.openSource
									? await util.getFileGitURL(command.filepath!)
									: undefined,
							})
							.setDescription(
								`</${computed.name}:${computed.id}> - ${
									computed.description || "no description"
								}`,
							)
							.setFooter(
								config.openSource
									? {
											text: util.convertDistPathToSrc(
												util.relativeRootPath(command.filepath!),
											),
										}
									: null,
							)
							.setFields(
								computed.options.map((option) => ({
									name: option.name,
									value: option.description || "no description",
									inline: true,
								})),
							),
					],
				},
	)
}

export function isSlashCommandOption(
	object: discord.ToAPIApplicationCommandOptions,
): object is discord.ToAPIApplicationCommandOptions &
	discord.APIApplicationCommandOption {
	return "type" in object
}

export function debugSlashCommandBuilder(
	builder: discord.SlashCommandBuilder | discord.ToAPIApplicationCommandOptions,
	path: string[] = [],
) {
	try {
		builder.toJSON()
	} catch (error: any) {
		let pathSegment: string

		if (builder instanceof discord.SlashCommandBuilder) {
			pathSegment = builder.name
		} else if (isSlashCommandOption(builder)) {
			pathSegment = `${discord.ApplicationCommandOptionType[builder.type]}Option(${builder.name})`
		} else {
			pathSegment = "unknown"
		}

		if ("options" in builder) {
			builder.options.forEach((option) =>
				debugSlashCommandBuilder(option, path.concat(pathSegment)),
			)
		} else {
			throw new SlashCommandError(
				`/${path.concat(pathSegment).join(" ")}: ${error.message}`,
			)
		}
	}
}
