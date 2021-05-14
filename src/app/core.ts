import { join } from "path"
import prettify from "ghom-prettify"
import dayjs from "dayjs"
import chalk from "chalk"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import toObject from "dayjs/plugin/toObject"
import discord from "discord.js"
import EventEmitter from "events"

import * as logger from "./logger"

export const startedAt = Date.now()

export function uptime(): number {
  return Date.now() - startedAt
}

export type FullClient = discord.Client & {
  user: discord.ClientUser & { id: `${bigint}` }
}

export function isFullClient(client: discord.Client): client is FullClient {
  return client.user?.id !== undefined
}

/**
 * Resolve `T` value from `T | (() => T)`
 * @param item - resolvable
 * @param args - parameters for resolvable function
 */
export function scrap<T, A extends any[] = []>(
  item: Scrap<T, A>,
  ...args: A
): T | Promise<T> {
  // @ts-ignore
  return typeof item === "function" ? item(...args) : item
}

export type Scrap<T, A extends any[] = []> =
  | T
  | ((...args: A) => T | Promise<T>)

export function slug(...words: string[]): string {
  return words.join("-")
}

/**
 * Make a path from root of project and return it
 * @param path
 */
export function rootPath(...path: string[]): string {
  return join(process.cwd(), ...path)
}

/**
 * Simple cache for manage temporary values
 */
export const cache = new (class Cache {
  private data: { [key: string]: any } = {}

  get<T>(key: string): T | undefined {
    return this.data[key]
  }

  set(key: string, value: any) {
    this.data[key] = value
  }

  delete(key: string) {
    delete this.data[key]
  }

  ensure<T>(key: string, defaultValue: T): T {
    let value = this.get<T>(key)
    if (value === undefined) {
      value = defaultValue
      this.set(key, value)
    }
    return value
  }
})()

export interface Code {
  lang?: string
  content: string
}

export const code = {
  pattern: /^```(\S+)?\s(.+[^\\])```$/is,
  /**
   * extract the code from code block and return code
   */
  parse(raw: string): Code | undefined {
    const match = this.pattern.exec(raw)
    if (!match) return
    return {
      lang: match[1],
      content: match[2],
    }
  },
  /**
   * inject the code in the code block and return code block
   */
  stringify({ lang, content }: Code): string {
    return "```" + (lang ?? "") + "\n" + content + "\n```"
  },
  /**
   * format the code using prettier and return it
   */
  format: prettify.format,
}

const locale = process.env.LOCALE

import(`dayjs/locale/${locale ?? "en"}`)
  .then(() => dayjs.locale(locale ?? "en"))
  .catch(() =>
    logger.warn(
      `The ${chalk.bold(
        locale
      )} locale is incorrect, please use an existing locale code.`,
      "core"
    )
  )

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.utc(1)

if (process.env.TIMEZONE) dayjs.tz.setDefault(process.env.TIMEZONE)

export { dayjs }

export function forceTextSize(
  text: string | number,
  size: number,
  before = false
): string {
  text = String(text)
  if (text.length < size) {
    return before
      ? " ".repeat(size - text.length) + text
      : text + " ".repeat(size - text.length)
  } else if (text.length > size) {
    return text.slice(0, size)
  } else {
    return text
  }
}

export interface EventEmitters {
  message:
    | discord.TextChannel
    | discord.DMChannel
    | discord.NewsChannel
    | discord.User
    | discord.GuildMember
    | discord.Guild
  // channelCreate: discord.Guild
  // channelDelete: discord.Guild
  // channelPinsUpdate: discord.Guild
  // channelUpdate: discord.Guild
  // emojiCreate: discord.Guild
  // emojiDelete: discord.Guild
  // emojiUpdate: discord.Guild
  // guildBanAdd: discord.Guild | discord.User
  // guildBanRemove: discord.Guild | discord.User
  // guildDelete: discord.Guild
  // guildUnavailable: discord.Guild
  // guildIntegrationsUpdate: discord.Guild
  // guildMemberAdd: discord.GuildMember
  // guildMemberAvailable: discord.GuildMember | discord.PartialGuildMember
  // guildMemberRemove: discord.GuildMember | discord.PartialGuildMember
  // guildMemberSpeaking: discord.GuildMember | discord.PartialGuildMember
  // guildMemberUpdate: discord.GuildMember | discord.PartialGuildMember
  // guildUpdate: discord.Guild
  // inviteCreate: discord.Guild
  // inviteDelete: discord.Guild
  // messageDelete:
  //   | discord.Message
  //   | discord.TextChannel | discord.DMChannel | discord.NewsChannel
  //   | discord.User
  //   | discord.GuildMember
  //   | discord.Guild
  // messageReactionRemoveAll:
  //   | discord.Message
  //   | discord.PartialMessage
  //   | discord.TextChannel | discord.DMChannel | discord.NewsChannel
  //   | discord.User
  //   | discord.GuildMember
  //   | discord.Guild
  // messageReactionRemoveEmoji:
  //   | discord.Message
  //   | discord.TextChannel | discord.DMChannel | discord.NewsChannel
  //   | discord.User
  //   | discord.GuildMember
  //   | discord.Guild
  // messageDeleteBulk:
  //   | discord.Message
  //   | discord.TextChannel | discord.DMChannel | discord.NewsChannel
  //   | discord.User
  //   | discord.GuildMember
  //   | discord.Guild
  // messageReactionAdd:
  //   | discord.Message
  //   | discord.TextChannel | discord.DMChannel | discord.NewsChannel
  //   | discord.User
  //   | discord.GuildMember
  //   | discord.Guild
  // messageReactionRemove:
  //   | discord.MessageReaction
  //   | discord.Message
  //   | discord.TextChannel | discord.DMChannel | discord.NewsChannel
  //   | discord.User
  //   | discord.GuildMember
  //   | discord.Guild
  // messageUpdate:
  //   | discord.Message
  //   | discord.TextChannel | discord.DMChannel | discord.NewsChannel
  //   | discord.User
  //   | discord.GuildMember
  //   | discord.Guild
  // presenceUpdate: discord.User
  // roleCreate: discord.Guild
  // roleDelete: discord.Guild
  // roleUpdate: discord.Guild | discord.Role
  // userUpdate: discord.User | discord.PartialUser
  // webhookUpdate: discord.TextChannel | discord.DMChannel | discord.NewsChannel
}

//export const subEmitter = new EventEmitter()

// export function once<
//   Event extends keyof Pick<discord.ClientEvents, keyof EventEmitters>
// >(
//   event: Event,
//   emitter: EventEmitters[Event] & { id: string },
//   cb: (...args: discord.ClientEvents[Event]) => unknown
// ) {
//   // @ts-ignore
//   subEmitter.once(`${event}:${emitter.id}`, cb)
// }
//
// export function emit<
//   Event extends keyof Pick<discord.ClientEvents, keyof EventEmitters>
// >(event: Event, emitter: EventEmitters[Event] & { id: string }, ...args: discord.ClientEvents[Event]) {
//   subEmitter.emit(`${event}:${emitter.id}`, ...args)
// }

export const messageEmitter = new EventEmitter()

export function onceMessage<
  Event extends keyof Pick<discord.ClientEvents, keyof EventEmitters>
>(
  emitter: EventEmitters[Event],
  cb: (...args: discord.ClientEvents[Event]) => unknown
) {
  // @ts-ignore
  messageEmitter.once(emitter.id, cb)
}

export function emitMessage<
  Event extends keyof Pick<discord.ClientEvents, keyof EventEmitters>
>(emitter: EventEmitters[Event], ...args: discord.ClientEvents[Event]) {
  messageEmitter.emit(emitter.id, ...args)
}
