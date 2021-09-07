import events from "events"
import discord from "discord.js"
import * as core from "./core.js"
import * as logger from "./logger.js"

/** As Snowflakes or icons */
export interface PaginatorEmojis {
  previous: string
  next: string
  start: string
  end: string
}

export type Page = discord.MessageEmbed | string

export interface PaginatorOptions<Data = undefined> {
  data?: Data
  pages: Page[] | ((pageIndex: number, data: Data) => Promise<Page> | Page)
  pageCount?: number
  channel:
    | discord.TextChannel
    | discord.DMChannel
    | discord.NewsChannel
    | discord.TextBasedChannels
  filter?: (
    reaction: discord.MessageReaction | discord.PartialMessageReaction,
    user: discord.User | discord.PartialUser
  ) => boolean
  idleTime?: number | "none"
  customEmojis?: Partial<PaginatorEmojis>
  placeHolder?: Page
}

export class Paginator extends events.EventEmitter {
  static instances: Paginator[] = []

  private _pageIndex = 0
  private _deactivation?: NodeJS.Timeout
  private _messageID: string | undefined

  public emojis: PaginatorEmojis = {
    previous: "◀️",
    next: "▶️",
    start: "⏪",
    end: "⏩",
  }

  get pageIndex(): number {
    return this._pageIndex
  }

  get messageID() {
    return this._messageID
  }

  get pageCount(): number {
    return Array.isArray(this.options.pages)
      ? this.options.pages.length
      : this.options.pageCount ?? -1
  }

  constructor(public readonly options: PaginatorOptions) {
    super()

    options.idleTime ??= 60000

    if (Array.isArray(options.pages)) {
      if (options.pages.length === 0) {
        options.pages.push(options.placeHolder ?? "Oops, no data found.")
      }
    }

    if (options.customEmojis) Object.assign(this.emojis, options.customEmojis)

    this._deactivation = this.resetDeactivationTimeout()

    this.getCurrentPage().then(async (page) => {
      const message =
        typeof page === "string"
          ? await options.channel.send(page)
          : await options.channel.send({ embeds: [page] })

      this._messageID = message.id

      if (this.pageCount > 1 || this.pageCount === -1)
        for (const key of ["start", "previous", "next", "end"])
          await message.react(this.emojis[key as keyof PaginatorEmojis])
    })

    Paginator.instances.push(this)
  }

  private render() {
    this.getCurrentPage().then((page) => {
      if (this.messageID)
        if (typeof page === "string") {
          this.options.channel.messages.cache
            .get(this.messageID)
            ?.edit(page)
            .catch(logger.error)
        } else {
          this.options.channel.messages.cache
            .get(this.messageID)
            ?.edit({ embeds: [page] })
            .catch(logger.error)
        }
    })
  }

  public handleReaction(
    reaction: discord.MessageReaction | discord.PartialMessageReaction,
    user: discord.User | discord.PartialUser
  ) {
    if (this.options.filter && !this.options.filter(reaction, user)) return

    const { emoji } = reaction
    const emojiID = emoji.id || emoji.name

    let currentKey: keyof PaginatorEmojis | null = null
    for (const key in this.emojis) {
      if (this.emojis[key as keyof PaginatorEmojis] === emojiID) {
        currentKey = key as keyof PaginatorEmojis
      }
    }

    if (currentKey) {
      switch (currentKey) {
        case "start":
          this._pageIndex = 0
          break
        case "end":
          if (this.pageCount === -1) return
          this._pageIndex = this.pageCount - 1
          break
        case "next":
          this._pageIndex++
          if (this.pageCount !== -1 && this.pageIndex > this.pageCount - 1) {
            this._pageIndex = 0
          }
          break
        case "previous":
          this._pageIndex--
          if (this.pageCount !== -1) {
            if (this.pageIndex < 0) {
              this._pageIndex = this.pageCount - 1
            }
          } else {
            this._pageIndex = 0
          }
      }

      this.render()

      this._deactivation = this.resetDeactivationTimeout()

      reaction.users.remove(user as discord.User).catch()
    }
  }

  private resetDeactivationTimeout() {
    if (this.options.idleTime === "none") return
    clearTimeout(this._deactivation as NodeJS.Timeout)
    return setTimeout(() => this.deactivate().catch(), this.options.idleTime)
  }

  private async getCurrentPage() {
    if (Array.isArray(this.options.pages)) {
      return this.options.pages[this.pageIndex]
    }

    const page = await this.options.pages(this.pageIndex, this.options.data)

    return page || this.options.placeHolder || "Oops, no data found"
  }

  public async deactivate() {
    if (!this.messageID) return

    clearTimeout(this._deactivation as NodeJS.Timeout)

    // remove reactions if message is not deleted and if is in guild
    const message = await this.options.channel.messages.cache.get(
      this.messageID
    )
    if (message && message.channel.isText())
      await message.reactions?.removeAll()

    Paginator.instances = Paginator.instances.filter((paginator) => {
      return paginator.messageID !== this.messageID
    })
  }

  public static getByMessage(
    message: discord.Message | discord.PartialMessage
  ): Paginator | undefined {
    return this.instances.find((paginator) => {
      return paginator.messageID === message.id
    })
  }

  public static divider = core.divider
}
