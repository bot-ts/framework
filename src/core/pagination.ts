// system file, please don't modify it

import discord from "discord.js"

import config from "#config"

import * as logger from "#core/logger"
import * as util from "#core/util"

import paginationButton from "#buttons/pagination.native"

const __filename = util.getCurrentFilename(import.meta)

const sendToTarget = async (
	target: PaginatorTarget,
	page: Page,
): Promise<discord.Message> => {
	if (target instanceof discord.Message) return target.edit(page)
	if (target instanceof discord.ChatInputCommandInteraction)
		return target.editReply(page)
	return target.send(page)
}

const updateTargetMessage = async (
	target: PaginatorTarget,
	page: Page,
	messageId?: string,
) => {
	if (target instanceof discord.Message) return target.edit(page)
	if (target instanceof discord.ChatInputCommandInteraction)
		return target.editReply(page)
	const message = await getTargetMessage(target, messageId)
	if (message) await message.edit(page)
}

const getTargetMessage = async (
	target: PaginatorTarget,
	messageId?: string,
): Promise<discord.Message | undefined> => {
	if (target instanceof discord.Message) return target
	if (target instanceof discord.ChatInputCommandInteraction)
		return target.fetchReply()
	return target.messages.fetch(messageId as string)
}

export type PaginatorTarget =
	| discord.SendableChannels
	| discord.Message
	| discord.ChatInputCommandInteraction

export type PaginatorKey = "previous" | "next" | "start" | "end"

/** As Snowflakes for guild emojis or icons for web emotes */
export type PaginatorEmojis = Record<PaginatorKey, string>
export type PaginatorLabels = Record<PaginatorKey, string>

export type Page = util.SystemMessage

export interface PaginatorOptions {
	useReactions?: boolean
	useButtonLabels?: boolean
	buttonStyle?: discord.ButtonStyle
	target: PaginatorTarget
	filter?: (
		reaction: discord.MessageReaction | discord.PartialMessageReaction,
		user: discord.User | discord.PartialUser,
	) => boolean
	idleTime?: number
	customLabels?: Partial<PaginatorLabels>
	customEmojis?: Partial<PaginatorEmojis>
	placeHolder?: Page
}

export interface DynamicPaginatorOptions {
	fetchPage: (pageIndex: number) => Promise<Page> | Page
	fetchPageCount: () => Promise<number> | number
}

export interface StaticPaginatorOptions {
	pages: (Page | Promise<Page>)[]
}

export abstract class Paginator {
	static defaults: Partial<PaginatorOptions> = {}
	static instances: Paginator[] = []
	static defaultPlaceHolder = "Oops, no data found"
	static keys: PaginatorKey[] = ["start", "previous", "next", "end"]
	static defaultEmojis: PaginatorEmojis = {
		previous: "◀️",
		next: "▶️",
		start: "⏪",
		end: "⏩",
	}

	protected _pageIndex = 0
	protected _deactivation?: NodeJS.Timeout
	protected _messageId: string | undefined

	public emojis: PaginatorEmojis

	protected constructor(public readonly options: PaginatorOptions) {
		if (options.customEmojis || Paginator.defaults.customEmojis)
			this.emojis = Object.assign(
				Paginator.defaultEmojis,
				options.customEmojis ?? Paginator.defaults.customEmojis,
			)
		else this.emojis = Paginator.defaultEmojis

		this.resetDeactivationTimeout()

		Promise.resolve(this.getCurrentPage())
			.then(async (page) => {
				const message = await sendToTarget(
					options.target,
					await this.formatPage(page),
				)

				this._messageId = message.id

				const pageCount = await this.getPageCount()

				if (
					(options.useReactions ?? Paginator.defaults.useReactions) &&
					pageCount > 1
				)
					for (const key of Paginator.keys)
						await message.react(this.emojis[key])
			})
			.catch((error) => logger.error(error, __filename, true))

		Paginator.instances.push(this)
	}

	protected async getComponents(disabled?: boolean) {
		const pageCount = await this.getPageCount()

		return (this.options.useReactions ?? Paginator.defaults.useReactions) ||
			pageCount < 2
			? undefined
			: [
					new discord.ActionRowBuilder<discord.MessageActionRowComponentBuilder>().addComponents(
						Paginator.keys.map((key) => {
							const button = paginationButton
								.create({ key })
								.setStyle(
									this.options.buttonStyle ??
										Paginator.defaults.buttonStyle ??
										discord.ButtonStyle.Secondary,
								)

							if (
								this.options.useButtonLabels ??
								Paginator.defaults.useButtonLabels
							)
								button.setLabel(
									this.options.customLabels?.[key] ??
										Paginator.defaults.customLabels?.[key] ??
										key,
								)
							else button.setEmoji(this.emojis[key])

							button.setDisabled(
								disabled ||
									(key === "start" && this._pageIndex === 0) ||
									(key === "end" && this._pageIndex === pageCount - 1),
							)

							return button
						}),
					),
				]
	}

	protected async formatPage(
		page: Page,
		withoutComponents?: true,
	): Promise<Page> {
		const components = withoutComponents
			? undefined
			: await this.getComponents()

		return {
			...page,
			components,
		}
	}

	protected abstract getCurrentPage(): Promise<Page> | Page
	protected abstract getPageCount(): Promise<number> | number

	public async handleInteraction(
		interaction: discord.ButtonInteraction,
		key: PaginatorKey,
	) {
		await this.updatePageIndex(key)

		await interaction.message
			.edit(await this.formatPage(await this.getCurrentPage()))
			.catch((error) => logger.error(error, __filename, true))

		await interaction.deferUpdate()
	}

	public async handleReaction(
		reaction: discord.MessageReaction | discord.PartialMessageReaction,
		user: discord.User | discord.PartialUser,
	) {
		reaction.users.remove(user as discord.User).catch()

		const filter = this.options.filter ?? Paginator.defaults.filter

		if (filter && !filter(reaction, user)) return

		const { emoji } = reaction
		const emojiID = emoji.id || emoji.name

		let currentKey: PaginatorKey | null = null

		for (const key of Paginator.keys)
			if (this.emojis[key] === emojiID) currentKey = key

		const updated = await this.updatePageIndex(currentKey)

		if (updated) {
			await updateTargetMessage(
				this.options.target,
				await this.formatPage(await this.getCurrentPage()),
				this._messageId,
			).catch((error: any) => logger.error(error, __filename, true))
		}
	}

	private async updatePageIndex(key: PaginatorKey | null): Promise<boolean> {
		this.resetDeactivationTimeout()

		const pageCount = await this.getPageCount()

		if (key) {
			switch (key) {
				case "start":
					this._pageIndex = 0
					break
				case "end":
					if (pageCount === -1) return false
					this._pageIndex = pageCount - 1
					break
				case "next":
					this._pageIndex++
					if (pageCount !== -1 && this._pageIndex > pageCount - 1) {
						this._pageIndex = 0
					}
					break
				case "previous":
					this._pageIndex--
					if (pageCount !== -1) {
						if (this._pageIndex < 0) {
							this._pageIndex = pageCount - 1
						}
					} else {
						this._pageIndex = 0
					}
			}

			return true
		}

		return false
	}

	private resetDeactivationTimeout() {
		clearTimeout(this._deactivation as NodeJS.Timeout)
		this._deactivation = setTimeout(
			() => this.deactivate().catch(),
			this.options.idleTime ?? Paginator.defaults.idleTime ?? 60000,
		)
	}

	public async deactivate() {
		if (!this._messageId) return

		clearTimeout(this._deactivation as NodeJS.Timeout)

		const message = await getTargetMessage(this.options.target, this._messageId)

		// if message is not deleted
		if (message && !message.deletable)
			if (this.options.useReactions ?? Paginator.defaults.useReactions)
				await message.reactions?.removeAll().catch()
			else {
				// await this._interaction?.editReply(
				//   await this.formatPage(
				//     await this.getCurrentPage()
				//   )
				// )
			}

		Paginator.instances = Paginator.instances.filter(
			(paginator) => paginator._messageId !== this._messageId,
		)
	}

	public static getByMessage(
		message:
			| discord.PartialMessage
			| discord.ButtonInteraction<discord.CacheType>["message"],
	): Paginator | undefined {
		return Paginator.instances.find(
			(paginator) => paginator._messageId === message.id,
		)
	}
}

export class DynamicPaginator extends Paginator {
	constructor(
		public override readonly options: PaginatorOptions &
			DynamicPaginatorOptions,
	) {
		super(options)
	}

	protected getPageCount() {
		return this.options.fetchPageCount()
	}

	protected async getCurrentPage(): Promise<Page> {
		return (
			(await this.options.fetchPage(this._pageIndex)) ||
			this.options.placeHolder ||
			Paginator.defaultPlaceHolder
		)
	}
}

export class StaticPaginator extends Paginator {
	constructor(
		public override readonly options: PaginatorOptions & StaticPaginatorOptions,
	) {
		super(options)

		if (options.pages.length === 0)
			options.pages.push(
				options.placeHolder ?? { content: Paginator.defaultPlaceHolder },
			)
	}

	protected getPageCount(): number {
		return this.options.pages.length
	}

	protected getCurrentPage(): Promise<Page> | Page {
		return (
			this.options.pages[this._pageIndex] ||
			this.options.placeHolder ||
			Paginator.defaultPlaceHolder
		)
	}
}

export async function initPagination() {
	const { paginatorEmojis } = config
	if (paginatorEmojis) Paginator.defaultEmojis = paginatorEmojis
}
