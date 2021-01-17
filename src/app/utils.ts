import { join } from "path"
import Discord from "discord.js"
import * as database from "./database"

export async function prefix(guild?: Discord.Guild): Promise<string> {
  let prefix = process.env.PREFIX as string
  if (guild) prefix = (await database.prefixes.get(guild.id)) ?? prefix
  return prefix
}

export const codeBlockRegex = /^```(?:js)?\s(.+[^\\])```$/is

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

export function rootPath(...path: string[]): string {
  return join(process.cwd(), ...path)
}
