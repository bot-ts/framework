import { join } from "path"
import prettify from "ghom-prettify"
import dayjs from "dayjs"
import chalk from "chalk"
import utc from "dayjs/plugin/utc"
import relative from "dayjs/plugin/relativeTime"
import timezone from "dayjs/plugin/timezone"
import toObject from "dayjs/plugin/toObject"
import discord from "discord.js"
import EventEmitter from "events"
import * as prettier from "prettier"

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
  stringify({
    lang,
    content,
    format,
  }: Code & { format?: true | prettier.Options }): string {
    return (
      "```" +
      (lang ?? "") +
      "\n" +
      (format
        ? prettify.format(content, lang, format === true ? undefined : format)
        : content) +
      "\n```"
    )
  },
  /**
   * format the code using prettier and return it
   */
  format: prettify.format,
}

const locale = process.env.BOT_LOCALE

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
dayjs.extend(relative)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.utc(1)

if (process.env.BOT_TIMEZONE) dayjs.tz.setDefault(process.env.BOT_TIMEZONE)

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
}

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
