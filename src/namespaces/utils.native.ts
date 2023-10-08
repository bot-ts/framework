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

export const databasePatterns = {
  tableNames: () => {
    switch (app.getDatabaseDriverName()) {
      case "sqlite3":
        return "SELECT name FROM sqlite_master WHERE type='table'"
      case "pg":
        return "SELECT table_name as name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
      default:
        return `SELECT table_name as name FROM information_schema.tables WHERE table_schema='${process.env.DB_DATABASE}' AND table_type='BASE TABLE'`
    }
  },
  tableInfo: (name: string) => {
    switch (app.getDatabaseDriverName()) {
      case "sqlite3":
        return `PRAGMA table_info(${name})`
      case "pg":
        return `SELECT column_name as name, data_type as type, column_default as dflt_value FROM information_schema.columns WHERE table_name='${name}'`
      default:
        return `SELECT column_name as name, data_type as type, column_default as dflt_value FROM information_schema.columns WHERE table_name='${name}'`
    }
  },
}
