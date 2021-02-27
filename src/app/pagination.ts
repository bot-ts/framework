import Events from "events"
import Discord from "discord.js"

/** As Snowflakes or icons */
export interface PaginatorEmojis {
  previous: string
  next: string
  start: string
  end: string
}

export class Paginator extends Events.EventEmitter {
  static paginations: Paginator[] = []

  private pageIndex = 0
  private deactivation?: NodeJS.Timeout
  messageID: string | undefined
  emojis: PaginatorEmojis = {
    previous: "◀️",
    next: "▶️",
    start: "⏪",
    end: "⏩",
  }

  /**
   * @constructor
   * @param pages - Array of pages
   * @param {TextChannel | DMChannel | NewsChannel} channel - Channel where send the paginator message
   * @param {Function} filter - Used to filter what reactionMessage is valid
   * @param {number} idlTime - Time between last action and paginator deactivation in milliseconds. (default: 1 min)
   * @param {Partial<PaginatorEmojis>} customEmojis - Custom emojis to overwrite
   */
  constructor(
    public pages: (Discord.MessageEmbed | string)[],
    public channel:
      | Discord.TextChannel
      | Discord.DMChannel
      | Discord.NewsChannel,
    public filter: (
      reaction: Discord.MessageReaction,
      user: Discord.User | Discord.PartialUser
    ) => boolean,
    public idlTime: number = 60000,
    customEmojis?: Partial<PaginatorEmojis>
  ) {
    super()

    if (pages.length === 0) return

    if (idlTime) this.idlTime = idlTime

    if (customEmojis) Object.assign(this.emojis, customEmojis)

    this.deactivation = this.resetDeactivationTimeout()

    channel.send(this.currentPage).then(async (message) => {
      this.messageID = message.id

      if (this.pages.length > 1)
        for (const key of ["start", "previous", "next", "end"])
          await message.react(this.emojis[key as keyof PaginatorEmojis])
    })

    Paginator.paginations.push(this)
  }

  private get currentPage(): Discord.MessageEmbed | string {
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
    reaction: Discord.MessageReaction,
    user: Discord.User | Discord.PartialUser
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

      reaction.users.remove(user as Discord.User).catch()
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

    Paginator.paginations = Paginator.paginations.filter((paginator) => {
      return paginator.messageID !== this.messageID
    })
  }

  public static getByMessage(
    message: Discord.Message | Discord.PartialMessage
  ): Paginator | undefined {
    return this.paginations.find((paginator) => {
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
