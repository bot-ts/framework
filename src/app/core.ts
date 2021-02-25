import { join } from "path"

import prettier from "prettier"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import toObject from "dayjs/plugin/toObject"

/**
 * Resolve `T` value from `T | (() => T)`
 * @param item - resolvable
 * @param args - parameters for resolvable function
 */
export function scrap<T, A extends any[] = any[]>(
  item: T | ((...args: A) => T),
  ...args: A
): T {
  // @ts-ignore
  return typeof item === "function" ? item(...args) : item
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
export const cache = new (class {
  private data: { [key: string]: any } = {}

  get<T>(key: string): T | undefined {
    return this.data[key]
  }

  set(key: string, value: any) {
    this.data[key] = value
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

export const CODE = {
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
  format(raw: string, options?: prettier.Options): string {
    return prettier.format(raw, {
      semi: false,
      ...(options ?? {}),
    })
  },
}
;(() => {
  return import(`dayjs/locale/${process.env.LOCALE}`).then(() =>
    dayjs.locale(process.env.LOCALE)
  )
})()

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.utc(1)

if (process.env.TIMEZONE) dayjs.tz.setDefault(process.env.TIMEZONE)

export { dayjs }

export function resizeText(
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
    return before ? text.slice(text.length - size, size) : text.slice(0, size)
  } else {
    return text
  }
}
