// system file, please don't modify it

import path from "node:path"
import url from "node:url"
import * as discordEval from "discord-eval.ts"
import discord from "discord.js"
import tims from "tims"
import type yargsParser from "yargs-parser"

import * as handler from "@ghom/handler"

import config from "#config"
import * as argument from "#core/argument"
import env from "#core/env"
import * as logger from "#core/logger"
import * as util from "#core/util"

import { styleText } from "node:util"

const __filename = util.getCurrentFilename(import.meta)

export const commandHandler = new handler.Handler<ICommand>(
	util.srcPath("commands"),
	{
		pattern: /\.[tj]s$/,
		loader: async (filepath) => {
			const file = await import(url.pathToFileURL(filepath).href)
			if (file.default instanceof Command) return file.default
			throw new Error(`${filepath}: default export must be a Command instance`)
		},
		onLoad: async (filepath, command) => {
			command.native = /.native.[jt]s$/.test(filepath)
			command.filepath = filepath
			return commands.add(command)
		},
	},
)

export let defaultCommand: ICommand | null = null

export const commands = new (class CommandCollection extends discord.Collection<
	string,
	ICommand
> {
	public resolve(key: string): ICommand | undefined {
		for (const [name, command] of this) {
			if (
				key === name ||
				command.options.aliases?.some((alias) => key === alias)
			)
				return command
		}
	}

	public add(command: ICommand) {
		validateCommand(command)
		this.set(command.options.name, command)
	}
})()

export type MessageArguments<
	RestName extends string = string,
	RestRequired extends boolean = false,
	Positional extends readonly argument.Positional<
		any,
		any,
		any,
		any
	>[] = argument.Positional<any, any, any, any>[],
	Options extends readonly argument.Option<
		any,
		any,
		any,
		any
	>[] = argument.Option<any, any, any, any>[],
	Flags extends readonly argument.Flag<any>[] = argument.Flag<any>[],
> = {
	[K in RestName]: RestRequired extends true ? string : string | null
} & argument.Outputs<Positional> &
	argument.Outputs<Options> &
	argument.OutputFlags<Flags> &
	argument.OutputPositionalValues<Positional>

export type BaseMessage<InGuild extends boolean> = discord.Message<InGuild> & {
	triggerCooldown: () => void
	usedAsDefault: boolean
	isFromBotOwner: boolean
	isFromGuildOwner: boolean
	usedPrefix: string
	client: discord.Client<true>
	rest: string
	args: any
}

export type UnknownMessage = Omit<AnyMessage, "args"> & { args: any }

export type AnyMessage = GuildMessage | DirectMessage

export type GuildMessage = BaseMessage<true> & {
	channel: discord.SendableChannels & discord.GuildChannel & discord.TextChannel
	member: discord.GuildMember
}

export type DirectMessage = BaseMessage<false> & {
	channel: discord.DMChannel
}

export interface MiddlewareResult {
	/**
	 * If `false` is returned, the command will be stopped. <br>
	 * If a string is returned, the command will be stopped and the string will be displayed as an error message. <br>
	 * If `true` is returned, the command will continue.
	 */
	result: boolean | string
	data: any
}

export interface IMiddleware {
	readonly name: string
	readonly run: (
		context: any,
		data: any,
	) => Promise<MiddlewareResult> | MiddlewareResult
}

export type MiddlewareContext =
	| UnknownMessage
	| discord.ChatInputCommandInteraction

export class Middleware<Context extends MiddlewareContext> {
	constructor(
		public readonly name: string,
		public readonly run: (
			context: Context,
			data: any,
		) => Promise<MiddlewareResult> | MiddlewareResult,
	) {}
}

export interface CommandMessageType {
	guild: GuildMessage
	dm: DirectMessage
	all: AnyMessage
}

export interface ICommandOptions {
	channelType?: string
	name: string
	description: string
	longDescription?: util.Scrap<string, [message: any]>
	isDefault?: boolean
	aliases?: string[]
	cooldown?: util.Cooldown
	examples?: util.Scrap<string[], [message: any]>
	guildOwnerOnly?: util.Scrap<boolean, [message: any]>
	botOwnerOnly?: util.Scrap<boolean, [message: any]>
	userPermissions?: util.Scrap<discord.PermissionsString[], [message: any]>
	botPermissions?: util.Scrap<discord.PermissionsString[], [message: any]>
	allowRoles?: discord.RoleResolvable[]
	denyRoles?: discord.RoleResolvable[]
	middlewares?: IMiddleware[]
	rest?: argument.IRest
	positional?: argument.IPositional[]
	options?: argument.IOption[]
	flags?: argument.IFlag[]
	run: any
	subs?: ICommand[]
}

export interface CommandOptions<
	Type extends keyof CommandMessageType,
	RestName extends string,
	RestRequired extends boolean,
	Positional extends readonly argument.Positional<
		any,
		any,
		any,
		CommandMessageType[Type]
	>[],
	Options extends readonly argument.Option<
		any,
		any,
		any,
		CommandMessageType[Type]
	>[],
	Flags extends readonly argument.Flag<any>[],
> {
	channelType?: Type

	name: string
	/**
	 * Short description displayed in help menu
	 */
	description: string
	/**
	 * Description displayed in command detail
	 */
	longDescription?: util.Scrap<string, [message: CommandMessageType[Type]]>
	/**
	 * Use this command if prefix is given but without command matching
	 */
	isDefault?: boolean

	aliases?: string[]
	/**
	 * Cool down of command (in ms)
	 */
	cooldown?: util.Cooldown
	examples?: util.Scrap<string[], [message: CommandMessageType[Type]]>

	// Restriction flags and permissions
	guildOwnerOnly?: util.Scrap<boolean, [message: CommandMessageType[Type]]>
	botOwnerOnly?: util.Scrap<boolean, [message: CommandMessageType[Type]]>
	userPermissions?: util.Scrap<
		discord.PermissionsString[],
		[message: CommandMessageType[Type]]
	>
	botPermissions?: util.Scrap<
		discord.PermissionsString[],
		[message: CommandMessageType[Type]]
	>

	allowRoles?: discord.RoleResolvable[]
	denyRoles?: discord.RoleResolvable[]

	/**
	 * Middlewares can stop the command if returning a string (string is displayed as error message in discord)
	 */
	middlewares?: Middleware<CommandMessageType[Type]>[]

	/**
	 * The rest of message after excludes all other arguments.
	 */
	readonly rest?: argument.Rest<
		RestName,
		RestRequired,
		CommandMessageType[Type]
	>

	/**
	 * Yargs positional argument (e.g. `[arg] <arg>`)
	 */
	readonly positional?: Positional

	/**
	 * Yargs option arguments (e.g. `--myArgument=value`)
	 */
	readonly options?: Options

	/**
	 * Yargs flag arguments (e.g. `--myFlag -f`)
	 */
	readonly flags?: Flags

	run: (
		this: Command<Type, RestName, RestRequired, Positional, Options, Flags>,
		message: Omit<CommandMessageType[Type], "args"> & {
			args: MessageArguments<RestName, RestRequired, Positional, Options, Flags>
		},
	) => unknown

	/**
	 * Sub-commands
	 */
	subs?: (
		| Command<"guild", any, any, any, any, any>
		| Command<"dm", any, any, any, any, any>
		| Command<"all", any, any, any, any, any>
	)[]
}

export interface ICommand {
	options: ICommandOptions
	filepath?: string
	parent?: ICommand
	native: boolean
}

export class Command<
	const Type extends keyof CommandMessageType = "all",
	const RestName extends string = string,
	const RestRequired extends boolean = false,
	const Positional extends readonly argument.Positional<
		any,
		any,
		any,
		CommandMessageType[Type]
	>[] = argument.Positional<any, any, any, CommandMessageType[Type]>[],
	const Options extends readonly argument.Option<
		any,
		any,
		any,
		CommandMessageType[Type]
	>[] = argument.Option<any, any, any, CommandMessageType[Type]>[],
	const Flags extends readonly argument.Flag<any>[] = argument.Flag<any>[],
> {
	filepath?: string
	parent?: ICommand
	native = false

	constructor(
		public options: CommandOptions<
			Type,
			RestName,
			RestRequired,
			Positional,
			Options,
			Flags
		>,
	) {}
}

export function validateCommand(
	command: ICommand,
	parent?: ICommand,
): void | never {
	command.parent = parent
	command.filepath ??= parent?.filepath

	if (parent?.native) command.native = true

	if (command.options.isDefault) {
		if (defaultCommand)
			logger.error(
				`the ${styleText(
					"blueBright",
					command.options.name,
				)} command wants to be a default command but the ${styleText(
					"blueBright",
					defaultCommand.options.name,
				)} command is already the default command`,
				command.filepath ?? __filename,
			)
		else defaultCommand = command
	}

	const help: argument.IFlag = {
		name: "help",
		flag: "h",
		description: "Get help from the command",
	}

	if (!command.options.flags) command.options.flags = [help]
	else command.options.flags.push(help)

	for (const flag of command.options.flags)
		if (flag.flag)
			if (flag.flag.length !== 1)
				throw new Error(
					`The "${flag.name}" flag length of "${
						path ? `${path} ${command.options.name}` : command.options.name
					}" command must be equal to 1`,
				)

	util.validateCooldown(
		command.options.cooldown,
		command.options.run,
		command.options.name,
	)

	logger.log(
		`loaded command ${styleText("blueBright", commandBreadcrumb(command))}${
			command.native ? ` ${styleText("green", "native")}` : ""
		} ${styleText("grey", command.options.description)}`,
	)

	if (command.options.subs)
		for (const sub of command.options.subs) validateCommand(sub, command)
}

export function commandBreadcrumb(command: ICommand, separator = " "): string {
	return commandParents(command)
		.map((cmd) => cmd.options.name)
		.reverse()
		.join(separator)
}

export function commandParents(command: ICommand): ICommand[] {
	return command.parent
		? [command, ...commandParents(command.parent)]
		: [command]
}

export async function prepareCommand(
	message: UnknownMessage,
	cmd: ICommand,
	context?: {
		restPositional: string[]
		baseContent: string
		parsedArgs: yargsParser.Arguments
		key: string
	},
): Promise<util.SystemMessage | boolean> {
	const error = await util.checkCooldown(
		cmd.options.cooldown,
		`${cmd.options.name} command`,
		{
			authorId: message.author.id,
			channelId: message.channelId,
			guildId: message.guildId,
		},
		message,
	)

	if (error) return error

	const channelType = await util.scrap(cmd.options.channelType, message)

	if (isGuildMessage(message)) {
		if (channelType === "dm")
			return util.getSystemMessage("error", "This command must be used in DM.")

		if (util.scrap(cmd.options.guildOwnerOnly, message))
			if (
				message.guild.ownerId !== message.member.id &&
				env.BOT_OWNER !== message.member.id
			)
				return util.getSystemMessage("error", "You must be the guild owner.")

		if (cmd.options.botPermissions) {
			const member = await message.guild.members.fetch(message.client.user)

			const botPermissions = await util.scrap(
				cmd.options.botPermissions,
				message,
			)

			for (const permission of botPermissions)
				if (!member.permissions.has(permission, true))
					return util.getSystemMessage(
						"error",
						`I need the \`${permission}\` permission to call this command.`,
					)
		}

		if (cmd.options.userPermissions) {
			const userPermissions = await util.scrap(
				cmd.options.userPermissions,
				message,
			)

			for (const permission of userPermissions)
				if (!message.member.permissions.has(permission, true))
					return util.getSystemMessage(
						"error",
						`You need the \`${permission}\` permission to call this command.`,
					)
		}

		if (cmd.options.allowRoles) {
			const allowRoles = await util.scrap(cmd.options.allowRoles, message)

			if (
				message.member.roles.cache.every(
					(role) => !allowRoles.includes(role.id),
				)
			)
				return util.getSystemMessage(
					"error",
					`You need one of the following roles to call this command: ${allowRoles
						.map((id) => `<@&${id}>`)
						.join(", ")}`,
				)
		}

		if (cmd.options.denyRoles) {
			const denyRoles = await util.scrap(cmd.options.denyRoles, message)

			if (
				message.member.roles.cache.some((role) => denyRoles.includes(role.id))
			)
				return util.getSystemMessage(
					"error",
					`You can't call this command because you have one of the following roles: ${denyRoles
						.map((id) => `<@&${id}>`)
						.join(", ")}`,
				)
		}
	}

	if (channelType === "guild")
		if (isDirectMessage(message))
			return util.getSystemMessage(
				"error",
				"This command must be used in a guild.",
			)

	if (await util.scrap(cmd.options.botOwnerOnly, message))
		if (env.BOT_OWNER !== message.author.id)
			return util.getSystemMessage("error", "You must be my owner.")

	if (context) {
		if (cmd.options.positional) {
			const positionalList = await util.scrap(cmd.options.positional, message)

			for (const positional of positionalList) {
				const index = positionalList.indexOf(positional)
				let value = context.parsedArgs._[index]
				const given = value !== undefined && value !== null

				const set = (v: any) => {
					message.args[positional.name] = v
					message.args[index] = v
					value = v
				}

				if (value) value = argument.trimArgumentValue(value)

				set(value)

				if (!given) {
					if (await util.scrap(positional.required, message)) {
						if (positional.missingErrorMessage) {
							if (typeof positional.missingErrorMessage === "string")
								return util.getSystemMessage("error", {
									header: `Missing positional "${positional.name}"`,
									body: positional.missingErrorMessage,
								})

							return { embeds: [positional.missingErrorMessage] }
						}

						return util.getSystemMessage("error", {
							header: `Missing positional "${positional.name}"`,
							body: positional.description
								? `Description: ${positional.description}`
								: `Run the following command to learn more: ${await discordEval.code.stringify(
										{
											content: `${message.usedPrefix}${context.key} --help`,
										},
									)}`,
						})
					}

					set(null)
				}

				if (value !== null) {
					const casted = await argument.resolveType(
						positional,
						"positional",
						value,
						message,
						set,
						cmd,
					)

					if (casted !== true) return casted
				}

				if (value !== null && positional.validate) {
					const checked = await argument.validate(
						positional,
						"positional",
						value,
						message,
					)

					if (checked !== true) return checked
				}

				if (value === null && positional.default !== undefined) {
					set(await util.scrap(positional.default, message))
				}

				context.restPositional.shift()
			}
		}

		if (cmd.options.options) {
			const options = await util.scrap(cmd.options.options, message)

			for (const option of options) {
				let { given, value } = argument.resolveGivenArgument(
					context.parsedArgs,
					option,
				)

				const set = (v: any) => {
					message.args[option.name] = v
					value = v
				}

				if (value === true) value = undefined

				if (!given && (await util.scrap(option.required, message))) {
					if (option.missingErrorMessage) {
						if (typeof option.missingErrorMessage === "string")
							return util.getSystemMessage("error", {
								header: `Missing option "${option.name}"`,
								body: option.missingErrorMessage,
							})

						return { embeds: [option.missingErrorMessage] }
					}

					return util.getSystemMessage("error", {
						header: `Missing option "${option.name}"`,
						body: option.description
							? `Description: ${option.description}`
							: `Example: \`--${option.name}=someValue\``,
					})
				}

				set(value)

				if (value === undefined) {
					set(null)
				}

				if (value !== null) {
					const casted = await argument.resolveType(
						option,
						"argument",
						value,
						message,
						set,
						cmd,
					)

					if (casted !== true) return casted
				}

				if (value !== null && option.validate) {
					const checked = await argument.validate(
						option,
						"argument",
						value,
						message,
					)

					if (checked !== true) return checked
				}

				if (value === null && option.default !== undefined) {
					set(await util.scrap(option.default, message))
				}
			}
		}

		if (cmd.options.flags) {
			for (const flag of cmd.options.flags) {
				let { nameIsGiven, value } = argument.resolveGivenArgument(
					context.parsedArgs,
					flag,
				)

				const set = (v: boolean) => {
					message.args[flag.name] = v
					value = v
				}

				if (!nameIsGiven) set(false)
				else if (typeof value === "boolean") set(value)
				else if (/^(?:true|1|on|yes|oui)$/.test(value)) set(true)
				else if (/^(?:false|0|off|no|non)$/.test(value)) set(false)
				else {
					set(true)
					context.restPositional.unshift(value)
				}
			}
		}

		message.rest = context.restPositional.join(" ")

		if (cmd.options.rest) {
			const rest = await util.scrap(cmd.options.rest, message)

			if (rest.all) message.rest = context.baseContent

			if (message.rest.length === 0) {
				if (await util.scrap(rest.required, message)) {
					if (rest.missingErrorMessage) {
						if (typeof rest.missingErrorMessage === "string")
							return util.getSystemMessage("error", {
								header: `Missing rest "${rest.name}"`,
								body: rest.missingErrorMessage,
							})

						return { embeds: [rest.missingErrorMessage] }
					}

					return util.getSystemMessage("error", {
						header: `Missing rest "${rest.name}"`,
						body:
							rest.description ??
							"Please use `--help` flag for more information.",
					})
					// biome-ignore lint/style/noUselessElse: ??????
				} else if (rest.default) {
					message.args[rest.name] = await util.scrap(rest.default, message)
				}
			} else {
				message.args[rest.name] = message.rest
			}
		}
	}

	if (cmd.options.middlewares) {
		const result = await prepareMiddlewares(message, cmd.options.middlewares)
		if (result !== true) return result
	}

	return true
}

export async function prepareMiddlewares(
	context: MiddlewareContext,
	middlewares: IMiddleware[],
): Promise<util.SystemMessage | boolean> {
	let currentData: any = {}

	for (const middleware of middlewares) {
		const { result, data } = await middleware.run(context, currentData)

		currentData = {
			...currentData,
			...(data ?? {}),
		}

		if (typeof result === "string")
			return util.getSystemMessage("error", {
				header: `${
					middleware.name ? `"${middleware.name}" m` : "M"
				}iddleware error`,
				body: result,
			})

		if (!result) return false
	}

	return true
}

const commandGitURLs = new Map<string, string>()

export async function sendCommandDetails(
	message: Omit<AnyMessage, "args"> & { args: any },
	cmd: ICommand,
): Promise<void> {
	const { detailCommand, openSource } = config

	if (detailCommand) {
		const options = await detailCommand(message, cmd)
		await message.channel.send(options)

		return
	}

	const embed = new discord.EmbedBuilder()
		.setColor("Blurple")
		.setAuthor({
			name: "Command details",
			iconURL: message.client.user.displayAvatarURL(),
		})
		.setDescription(
			(await util.scrap(cmd.options.longDescription, message)) ??
				cmd.options.description ??
				"no description",
		)

	const breadcrumb = commandBreadcrumb(cmd)

	if (openSource && util.packageJSON.repository?.url && cmd.filepath) {
		let url = commandGitURLs.get(breadcrumb)

		if (!url) url = await util.getFileGitURL(cmd.filepath)

		if (url) {
			commandGitURLs.set(breadcrumb, url)
			embed.setURL(url)
		}
	}

	const title = [
		message.usedPrefix +
			(cmd.options.isDefault ? `[${breadcrumb}]` : breadcrumb),
	]

	if (cmd.options.positional) {
		const cmdPositional = await util.scrap(cmd.options.positional, message)

		for (const positional of cmdPositional) {
			const dft =
				positional.default !== undefined
					? `="${await util.scrap(positional.default, message)}"`
					: ""

			title.push(
				(await util.scrap(positional.required, message)) && !dft
					? `<${positional.name}>`
					: `[${positional.name}${dft}]`,
			)
		}
	}

	if (cmd.options.rest) {
		const rest = await util.scrap(cmd.options.rest, message)
		const dft =
			rest.default !== undefined
				? `="${await util.scrap(rest.default, message)}"`
				: ""

		title.push(
			(await util.scrap(rest.required, message))
				? `<...${rest.name}>`
				: `[...${rest.name}${dft}]`,
		)
	}

	if (cmd.options.flags) {
		for (const flag of cmd.options.flags) {
			title.push(`[--${flag.name}]`)
		}
	}

	if (cmd.options.options) {
		title.push("[OPTIONS]")

		const options: string[] = []
		const cmdOptions = await util.scrap(cmd.options.options, message)

		for (const arg of cmdOptions) {
			const dft =
				arg.default !== undefined
					? `="${util.scrap(arg.default, message)}"`
					: ""

			options.push(
				(await util.scrap(arg.required, message))
					? `\`--${arg.name}${dft}\` (\`${argument.getCastingDescriptionOf(
							arg,
						)}\`) ${arg.description ?? ""}`
					: `\`[--${arg.name}${dft}]\` (\`${argument.getCastingDescriptionOf(
							arg,
						)}\`) ${arg.description ?? ""}`,
			)
		}

		embed.addFields({
			name: "options",
			value: options.join("\n"),
			inline: false,
		})
	}

	embed.setTitle(title.join(" "))

	const specialPermissions = []

	if (await util.scrap(cmd.options.botOwnerOnly, message))
		specialPermissions.push("BOT_OWNER")
	if (await util.scrap(cmd.options.guildOwnerOnly, message))
		specialPermissions.push("GUILD_OWNER")

	if (cmd.options.aliases) {
		const aliases = cmd.options.aliases

		embed.addFields({
			name: "aliases",
			value: aliases.map((alias) => `\`${alias}\``).join(", "),
			inline: true,
		})
	}

	if (cmd.options.middlewares) {
		embed.addFields({
			name: "middlewares:",
			value: cmd.options.middlewares
				.map((middleware) => `*${middleware.name || "Anonymous"}*`)
				.join(" → "),
			inline: true,
		})
	}

	if (cmd.options.examples) {
		const examples = await util.scrap(cmd.options.examples, message)

		embed.addFields({
			name: "examples:",
			value: await discordEval.code.stringify({
				content: examples
					.map((example) => message.usedPrefix + example)
					.join("\n"),
			}),
			inline: false,
		})
	}

	if (cmd.options.botPermissions) {
		const botPermissions = await util.scrap(cmd.options.botPermissions, message)

		embed.addFields({
			name: "bot permissions",
			value: botPermissions.join(", "),
			inline: true,
		})
	}

	if (cmd.options.userPermissions) {
		const userPermissions = await util.scrap(
			cmd.options.userPermissions,
			message,
		)

		embed.addFields({
			name: "user permissions",
			value: userPermissions.join(", "),
			inline: true,
		})
	}

	if (specialPermissions.length > 0)
		embed.addFields({
			name: "special permissions",
			value: specialPermissions.map((perm) => `\`${perm}\``).join(", "),
			inline: true,
		})

	if (cmd.options.cooldown) {
		const coolDown = await util.scrap(cmd.options.cooldown.duration, message)

		embed.addFields({
			name: "cooldown",
			value: tims.duration(coolDown),
			inline: true,
		})
	}

	if (cmd.options.subs)
		embed.addFields({
			name: "sub commands:",
			value:
				(
					await Promise.all(
						cmd.options.subs.map(async (sub) => {
							const prepared = await prepareCommand(message, sub)
							if (prepared !== true) return ""
							return commandToListItem(message, sub)
						}),
					)
				)
					.filter((line) => line.length > 0)
					.join("\n")
					.trim() || "Sub commands are not accessible by you.",
			inline: false,
		})

	if (cmd.options.channelType !== "all")
		embed.setFooter({
			text: `This command can only be sent in ${cmd.options.channelType} channel.`,
		})

	await message.channel.send({ embeds: [embed] })
}

export function commandToListItem(
	message: UnknownMessage,
	cmd: ICommand,
): string {
	return `**${message.usedPrefix}${commandBreadcrumb(cmd, " ")}** - ${
		cmd.options.description ?? "no description"
	}`
}

export function isAnyMessage<
	Base extends discord.Message | discord.PartialMessage,
>(message: Base): message is Base & AnyMessage {
	return (
		!message.system &&
		!!message.channel &&
		!!message.author &&
		!message.webhookId
	)
}

export function isGuildMessage<
	Base extends discord.Message | discord.PartialMessage | UnknownMessage,
>(message: Base): message is Base & GuildMessage {
	return !!message.member && !!message.guild
}

export function isDirectMessage<
	Base extends discord.Message | discord.PartialMessage | UnknownMessage,
>(message: Base): message is Base & DirectMessage {
	return !!message.channel && message.channel.type === discord.ChannelType.DM
}
