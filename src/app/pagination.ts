import events from "events"
import discord from "discord.js"

/** As Snowflakes or icons */
export interface PaginatorEmojis {
  previous: string
  next: string
  start: string
  end: string
}

export interface PaginatorOptions {
  pages: (discord.MessageEmbed | string)[]
  channel: discord.TextChannel | discord.DMChannel | discord.NewsChannel
  filter?: (
    reaction: discord.MessageReaction,
    user: discord.User | discord.PartialUser
  ) => boolean
  idlTime?: number
  customEmojis?: Partial<PaginatorEmojis>
  placeHolder?: discord.MessageEmbed | string
}

export class Paginator extends events.EventEmitter {
  static paginators: Paginator[] = []

  private filter: (
    reaction: discord.MessageReaction,
    user: discord.User | discord.PartialUser
  ) => boolean
  private pages: (discord.MessageEmbed | string)[]
  private channel: discord.TextChannel | discord.DMChannel | discord.NewsChannel
  private idlTime: number
  private pageIndex = 0
  private deactivation?: NodeJS.Timeout
  messageID: string | undefined
  emojis: PaginatorEmojis = {
    previous: "◀️",
    next: "▶️",
    start: "⏪",
    end: "⏩",
  }

  constructor(options: PaginatorOptions) {
    super()

    const { pages, filter, idlTime, channel, placeHolder, customEmojis } =
      options

    this.filter = filter ?? (() => true)
    this.idlTime = idlTime ?? 60000
    this.pages = pages
    this.channel = channel

    if (pages.length === 0) {
      if (placeHolder) pages.push(placeHolder)
      else return
    }

    if (customEmojis) Object.assign(this.emojis, customEmojis)

    this.deactivation = this.resetDeactivationTimeout()

    channel.send(this.currentPage).then(async (message) => {
      this.messageID = message.id

      if (this.pages.length > 1)
        for (const key of ["start", "previous", "next", "end"])
          await message.react(this.emojis[key as keyof PaginatorEmojis])
    })

    Paginator.paginators.push(this)
  }

  private get currentPage(): discord.MessageEmbed | string {
    return this.pages[this.pageIndex]
  }

  private render() {
    if (this.messageID) {
      this.channel.messages.cache
        .get(this.messageID)
        ?.edit(this.currentPage)
        .catch()
    }
  }

  public handleReaction(
    reaction: discord.MessageReaction,
    user: discord.User | discord.PartialUser
  ) {
    if (!this.filter(reaction, user)) return

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
          this.pageIndex = 0
          break
        case "end":
          this.pageIndex = this.pages.length - 1
          break
        case "next":
          this.pageIndex++
          if (this.pageIndex > this.pages.length - 1) {
            this.pageIndex = 0
          }
          break
        case "previous":
          this.pageIndex--
          if (this.pageIndex < 0) {
            this.pageIndex = this.pages.length - 1
          }
      }

      this.render()

      this.deactivation = this.resetDeactivationTimeout()

      reaction.users.remove(user as discord.User).catch()
    }
  }

  private resetDeactivationTimeout() {
    clearTimeout(this.deactivation as NodeJS.Timeout)
    return setTimeout(() => this.deactivate().catch(), this.idlTime)
  }

  public async deactivate() {
    if (!this.messageID) return

    clearTimeout(this.deactivation as NodeJS.Timeout)

    // remove reactions if message is not deleted and if is in guild
    const message = await this.channel.messages.cache.get(this.messageID)
    if (message && message.channel.type === "text")
      await message.reactions?.removeAll()

    Paginator.paginators = Paginator.paginators.filter((paginator) => {
      return paginator.messageID !== this.messageID
    })
  }

  public static getByMessage(
    message: discord.Message | discord.PartialMessage
  ): Paginator | undefined {
    return this.paginators.find((paginator) => {
      return paginator.messageID === message.id
    })
  }

  public static divider<T>(items: T[], itemCountByDivision: number): T[][] {
    const divided: T[][] = []
    const divisionCount = Math.ceil(items.length / itemCountByDivision)
    for (let i = 0; i < divisionCount; i++) {
      divided.push(
        items.slice(itemCountByDivision * i, itemCountByDivision * (i + 1))
      )
    }
    return divided
  }
}
