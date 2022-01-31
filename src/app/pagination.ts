import discord from "discord.js"

import * as logger from "./logger.js"

import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

export type PaginatorKey = "previous" | "next" | "start" | "end"

/** As Snowflakes or icons */
export type PaginatorEmojis = Record<PaginatorKey, string>
export type PaginatorLabels = Record<PaginatorKey, string>

export type Page = discord.MessageEmbed | string

export interface PaginatorOptions {
  useReactions?: boolean
  useButtonLabels?: boolean
  buttonStyle?: discord.MessageButtonStyleResolvable
  channel: discord.TextBasedChannel
  filter?: (
    reaction: discord.MessageReaction | discord.PartialMessageReaction,
    user: discord.User | discord.PartialUser
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
  protected _messageID: string | undefined

  public emojis: PaginatorEmojis

  protected constructor(public readonly options: PaginatorOptions) {
    if (options.customEmojis || Paginator.defaults.customEmojis)
      this.emojis = Object.assign(
        Paginator.defaultEmojis,
        options.customEmojis ?? Paginator.defaults.customEmojis
      )
    else this.emojis = Paginator.defaultEmojis

    this.resetDeactivationTimeout()

    Promise.resolve(this.getCurrentPage())
      .then(async (page) => {
        const message = await options.channel.send(await this.formatPage(page))

        this._messageID = message.id

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
          new discord.MessageActionRow().addComponents(
            Paginator.keys.map((key) => {
              const button = new discord.MessageButton()
                .setCustomId("pagination-" + key)
                .setStyle(
                  this.options.buttonStyle ??
                    Paginator.defaults.buttonStyle ??
                    "SECONDARY"
                )

              if (
                this.options.useButtonLabels ??
                Paginator.defaults.useButtonLabels
              )
                button.setLabel(
                  this.options.customLabels?.[key] ??
                    Paginator.defaults.customLabels?.[key] ??
                    key
                )
              else button.setEmoji(this.emojis[key])

              button.setDisabled(
                disabled ||
                  (key === "start" && this._pageIndex === 0) ||
                  (key === "end" && this._pageIndex === pageCount - 1)
              )

              return button
            })
          ),
        ]
  }

  protected async formatPage(page: Page, withoutComponents?: true) {
    const components = withoutComponents
      ? undefined
      : await this.getComponents()

    return typeof page === "string"
      ? { content: page, components }
      : { embeds: [page], components }
  }

  protected abstract getCurrentPage(): Promise<Page> | Page
  protected abstract getPageCount(): Promise<number> | number

  public async handleInteraction(interaction: discord.ButtonInteraction) {
    const key = interaction.customId.replace("pagination-", "") as PaginatorKey

    await this.updatePageIndex(key)

    await interaction
      .update(await this.formatPage(await this.getCurrentPage()))
      .catch((error) => logger.error(error, __filename, true))
  }

  public async handleReaction(
    reaction: discord.MessageReaction | discord.PartialMessageReaction,
    user: discord.User | discord.PartialUser
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
      if (this._messageID)
        await this.options.channel.messages.cache
          .get(this._messageID)
          ?.edit(await this.formatPage(await this.getCurrentPage()))
          .catch((error: any) => logger.error(error, __filename, true))
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
      this.options.idleTime ?? Paginator.defaults.idleTime ?? 60000
    )
  }

  public async deactivate() {
    if (!this._messageID) return

    clearTimeout(this._deactivation as NodeJS.Timeout)

    const message = await this.options.channel.messages.cache.get(
      this._messageID
    )

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
      (paginator) => paginator._messageID !== this._messageID
    )
  }

  public static getByMessage(
    message:
      | discord.PartialMessage
      | discord.ButtonInteraction<discord.CacheType>["message"]
  ): Paginator | undefined {
    return this.instances.find(
      (paginator) => paginator._messageID === message.id
    )
  }
}

export class DynamicPaginator extends Paginator {
  constructor(
    public readonly options: PaginatorOptions & DynamicPaginatorOptions
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
    public readonly options: PaginatorOptions & StaticPaginatorOptions
  ) {
    super(options)

    if (options.pages.length === 0)
      options.pages.push(options.placeHolder ?? Paginator.defaultPlaceHolder)
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
