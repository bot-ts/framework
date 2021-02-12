import { join } from "path"

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

export const codeBlockRegex = /^```(?:\S+)?\s(.+[^\\])```$/is

/**
 * inject the code in the code block and return code block
 */
export function toCodeBlock(code: string, lang: string = ""): string {
  return "```" + lang + "\n" + code + "\n```"
}

/**
 * extract the code from code block and return code
 */
export function fromCodeBlock(codeBlock: string): null | string {
  const match = codeBlockRegex.exec(codeBlock)
  if (match) return match[1]
  return null
}
