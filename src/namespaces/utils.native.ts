import * as app from "../app.js"

import guilds from "../tables/guilds.native.js"

export async function prefix(guild?: app.Guild): Promise<string> {
  let prefix = process.env.BOT_PREFIX as string
  if (guild) {
    const guildData = await guilds.query
      .where("id", guild.id)
      .select("prefix")
      .first()
    if (guildData) {
      return guildData.prefix ?? prefix
    }
  }
  return prefix
}

export const hasMedia = new app.Middleware("Has media ?", (message) => {
  return (
    message.attachments.size > 0 ||
    app.die("You need to attach a file to your message.")
  )
})
