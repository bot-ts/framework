import Discord from "discord.js"
import * as database from "./database"

export function prefix(guild?: Discord.Guild): string {
  let prefix = process.env.PREFIX as string
  if (guild) prefix = database.prefixes.get(guild.id) ?? prefix
  return prefix
}

export function code(text: string, lang: string = ""): string {
  return "```" + lang + "\n" + text + "\n```"
}
