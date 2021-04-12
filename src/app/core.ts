import { join } from "path"
import prettify from "ghom-prettify"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import toObject from "dayjs/plugin/toObject"

import * as logger from "./logger"

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

import(`dayjs/locale/${locale}`)
  .then(() => dayjs.locale(locale))
  .catch(() =>
    logger.warn(
      `The "${locale}" is incorrect, please use a simple locale code.`,
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
