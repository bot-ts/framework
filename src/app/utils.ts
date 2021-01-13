import { join } from "path"
import Discord from "discord.js"
import * as database from "./database"

export const codeRegex = /^```(?:js)?\s(.+[^\\])```$/is

export function prefix(guild?: Discord.Guild): string {
  let prefix = process.env.PREFIX as string
  if (guild) prefix = database.prefixes.get(guild.id) ?? prefix
  return prefix
}

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
  const match = codeRegex.exec(codeBlock)
  if (match) return match[1]
  return null
}

export function rootPath(...path: string[]): string {
  return join(process.cwd(), ...path)
}
