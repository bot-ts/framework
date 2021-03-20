import Discord from "discord.js"

import prefixes from "../tables/prefixes"

export async function prefix(guild?: Discord.Guild): Promise<string> {
  let prefix = process.env.PREFIX as string
  if (guild) {
    const prefixData = await prefixes.query
      .where("guild_id", guild.id)
      .select()
      .first()
    if (prefixData) {
      prefix = prefixData.prefix
    }
  }
  return prefix
}
