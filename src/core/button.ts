import * as handler from "@ghom/handler"

import url from "node:url"
import discord from "discord.js"

import env from "#core/env"
import * as logger from "#core/logger"
import * as util from "#core/util"

import { styleText } from "node:util"

export const buttonHandler = new handler.Handler<IButton>(
	util.srcPath("buttons"),
	{
		pattern: /\.[jt]s$/,
		loader: async (filepath) => {
			const file = await import(url.pathToFileURL(filepath).href)
			if (file.default instanceof Button) return file.default
			throw new Error(`${filepath}: default export must be a Button instance`)
		},
		onLoad: async (filepath, button) => {
			button.native = /.native.[jt]s$/.test(filepath)
			button.filepath = filepath
			buttons.add(button)
		},
	},
)

export const buttons = new (class ButtonCollection extends discord.Collection<
	string,
	IButton
> {
	add(button: IButton): this {
		this.validate(button)
		return this.set(button.options.name, button)
	}

	validate(button: IButton): void | never {
		if (this.has(button.options.name)) {
			throw new Error(`Button key "${button.options.name}" is not unique.`)
		}

		util.validateCooldown(
			button.options.cooldown,
			button.options.run,
			button.options.name,
		)

		Object.defineProperty(button.options.run, "name", {
			value: util.generateDebugName({
				name: button.options.name,
				type: "button",
			}),
		})

		logger.log(
			`loaded button ${styleText("blueBright", button.options.name)}${
				button.native ? ` ${styleText("green", "native")}` : ""
			} ${styleText("grey", button.options.description)}`,
		)
	}
})()

export interface IButton {
	options: {
		name: string
		description: string
		guildOnly?: boolean
		adminOnly?: boolean
		botOwnerOnly?: boolean
		cooldown?: util.Cooldown
		builder?: (button: discord.ButtonBuilder, ...params: any[]) => unknown
		run: (interaction: ButtonSystemInteraction, ...params: any[]) => unknown
	}
	filepath?: string
	native: boolean
	create(...params: any[]): discord.ButtonBuilder
}

/**
 * The parameters that the button will receive.
 * @example
 * ```ts
 * export type BuyButtonParams = { article: string, quantity: number }
 * ```
 */
export type ButtonParams = Record<string, string | boolean | number> | null

export interface ButtonOptions<Params extends ButtonParams> {
	name: string
	description: string
	guildOnly?: boolean
	adminOnly?: boolean
	botOwnerOnly?: boolean
	cooldown?: util.Cooldown
	builder?: (button: discord.ButtonBuilder, params: Params) => unknown
	run: (
		this: ButtonOptions<Params>,
		interaction: ButtonSystemInteraction,
		params: Params,
	) => unknown
}

/**
 * Represents a button handler. <br>
 * See the {@link https://ghom.gitbook.io/bot.ts/usage/create-a-button guide} for more information.
 */
export class Button<Params extends ButtonParams = null> {
	filepath?: string
	native = false

	constructor(public options: ButtonOptions<Params>) {}

	public create(): discord.ButtonBuilder
	public create(params: Params): discord.ButtonBuilder
	public create(params?: Params): discord.ButtonBuilder {
		return createButton(this, params!)
	}
}

export const BUTTON_CODE_SEPARATOR = ";://i//?;"

export function decodeButtonCustomId(customId: string): [string, ButtonParams] {
	const [key, params] = customId.split(BUTTON_CODE_SEPARATOR)
	try {
		return [key, JSON.parse(params)]
	} catch {
		return [key, null]
	}
}

export function encodeButtonCustomId(
	key: string,
	params: ButtonParams,
): string {
	return `${key}${BUTTON_CODE_SEPARATOR}${JSON.stringify(params)}`
}

export function createButton<Params extends ButtonParams>(
	handler: Button<Params>,
	params: Params,
): discord.ButtonBuilder {
	const button = new discord.ButtonBuilder()
		.setCustomId(encodeButtonCustomId(handler.options.name, params))
		.setStyle(discord.ButtonStyle.Primary)

	handler.options.builder?.(button, params)

	return button
}

export async function prepareButton(
	interaction: ButtonSystemInteraction,
	button: IButton,
): Promise<util.SystemMessage | void> {
	const error = await util.checkCooldown(
		button.options.cooldown,
		`${button.options.name} button`,
		{
			authorId: interaction.user.id,
			channelId: interaction.channelId,
			guildId: interaction.guildId,
		},
		interaction,
	)

	if (error) return error

	if (interaction.inGuild()) {
		if (
			button.options.adminOnly &&
			!(
				await (
					await interaction.client.guilds.fetch(interaction.guildId)
				).members.fetch(interaction.user)
			)?.permissions.has("Administrator")
		) {
			return util.getSystemMessage(
				"error",
				"You need to be an administrator to use this button.",
			)
		}
	} else {
		if (button.options.guildOnly) {
			return util.getSystemMessage(
				"error",
				"This button is only available in a guild.",
			)
		}
	}

	if (button.options.botOwnerOnly && interaction.user.id !== env.BOT_OWNER) {
		return util.getSystemMessage(
			"error",
			"This button is only available to the bot owner.",
		)
	}
}

export type ButtonSystemInteraction =
	discord.ButtonInteraction<discord.CacheType> & {
		triggerCooldown: () => void
	}
