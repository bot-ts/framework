import Discord from "discord.js"
import * as database from "./database"

export async function prefix(guild?: Discord.Guild): Promise<string> {
  let prefix = process.env.PREFIX as string
  if (guild) prefix = (await database.prefixes.get(guild.id)) ?? prefix
  return prefix
}

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
