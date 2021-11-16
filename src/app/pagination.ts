import discord from "discord.js"

import * as logger from "./logger.js"

/** As Snowflakes or icons */
export interface PaginatorEmojis {
  previous: string
  next: string
  start: string
  end: string
}

export type Page = discord.MessageEmbed | string

export interface PaginatorOptions {
  useReactions?: boolean
  useButtonLabels?: boolean
  channel: discord.TextBasedChannels
  filter?: (
    reaction: discord.MessageReaction | discord.PartialMessageReaction,
    user: discord.User | discord.PartialUser
  ) => boolean
  idleTime?: number
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
  static buttonNames: (keyof PaginatorEmojis)[] = [
    "start",
    "previous",
    "next",
    "end",
  ]
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
    options.idleTime ??= Paginator.defaults.idleTime ?? 60000

    if (options.customEmojis || Paginator.defaults.customEmojis)
      this.emojis = Object.assign(
        Paginator.defaultEmojis,
        options.customEmojis ?? Paginator.defaults.customEmojis
      )
    else this.emojis = Paginator.defaultEmojis

    this.resetDeactivationTimeout()

    Promise.resolve(this.getCurrentPage())
      .then(async (page) => {
        const message = await options.channel.send(this.formatPage(page))

        this._messageID = message.id

        if (options.useReactions ?? Paginator.defaults.useReactions)
          for (const key of Paginator.buttonNames)
            await message.react(this.emojis[key])
      })
      .catch((error) =>
        logger.error(error, "pagination:Paginator:constructor", true)
      )

    Paginator.instances.push(this)
  }

  protected get components() {
    return this.options.useReactions ?? Paginator.defaults.useReactions
      ? undefined
      : [
          new discord.MessageActionRow().addComponents(
            Paginator.buttonNames.map((buttonName) => {
              const button = new discord.MessageButton()
                .setCustomId("pagination-" + buttonName)
                .setStyle("SECONDARY")

              if (
                this.options.useButtonLabels ??
                Paginator.defaults.useButtonLabels
              )
                button.setLabel(buttonName)
              else button.setEmoji(this.emojis[buttonName])

              return button
            })
          ),
        ]
  }

  protected formatPage(page: Page) {
    return typeof page === "string"
      ? { content: page, components: this.components }
      : { embeds: [page], components: this.components }
  }

  protected abstract getCurrentPage(): Promise<Page> | Page
  protected abstract getPageCount(): Promise<number> | number

  public async handleInteraction(interaction: discord.ButtonInteraction) {
    const key = interaction.customId.replace(
      "pagination-",
      ""
    ) as keyof PaginatorEmojis

    await this.updatePageIndex(key)

    Promise.resolve(this.getCurrentPage()).then((page) => {
      interaction
        .update(this.formatPage(page))
        .catch((error) =>
          logger.error(error, "pagination:Paginator:handleInteraction", true)
        )
    })
  }

  public async handleReaction(
    reaction: discord.MessageReaction | discord.PartialMessageReaction,
    user: discord.User | discord.PartialUser
  ) {
    const filter = this.options.filter ?? Paginator.defaults.filter

    if (filter && !filter(reaction, user)) return

    const { emoji } = reaction
    const emojiID = emoji.id || emoji.name

    let currentKey: keyof PaginatorEmojis | null = null

    for (const key of Paginator.buttonNames)
      if (this.emojis[key] === emojiID) currentKey = key

    const updated = await this.updatePageIndex(currentKey)

    if (updated) {
      Promise.resolve(this.getCurrentPage()).then((page) => {
        if (this._messageID)
          this.options.channel.messages.cache
            .get(this._messageID)
            ?.edit(this.formatPage(page))
            .catch((error) =>
              logger.error(error, "pagination:Paginator:handleReaction", true)
            )
      })

      this.resetDeactivationTimeout()

      reaction.users.remove(user as discord.User).catch()
    }
  }

  private async updatePageIndex(
    key: keyof PaginatorEmojis | null
  ): Promise<boolean> {
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
      this.options.idleTime
    )
  }

  public async deactivate() {
    if (!this._messageID) return

    clearTimeout(this._deactivation as NodeJS.Timeout)

    // remove reactions if message is not deleted and if is in guild
    const message = await this.options.channel.messages.cache.get(
      this._messageID
    )
    if (message && message.channel.isText())
      await message.reactions?.removeAll().catch()

    Paginator.instances = Paginator.instances.filter((paginator) => {
      return paginator._messageID !== this._messageID
    })
  }

  public static getByMessage(
    message:
      | discord.Message
      | discord.PartialMessage
      | discord.ButtonInteraction<discord.CacheType>["message"]
  ): Paginator | undefined {
    return this.instances.find((paginator) => {
      return paginator._messageID === message.id
    })
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
