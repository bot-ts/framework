import Discord from "discord.js"
import * as database from "./database"

export async function prefix(guild?: Discord.Guild): Promise<string> {
  let prefix = process.env.PREFIX as string
  if (guild) {
    const _prefix = await database
      .prefixes()
      .where("guild_id", guild.id)
      .select()
      .first()
    if (_prefix) {
      prefix = _prefix.prefix
    }
  }
  return prefix
}
