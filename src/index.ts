import discord from "discord.js"

import "dotenv/config"

for (const key of ["BOT_TOKEN", "BOT_PREFIX", "BOT_OWNER"]) {
  if (!process.env[key] || /^{{.+}}$/.test(process.env[key] as string)) {
    throw new Error(`You need to add "${key}" value in your .env file.`)
  }
}

const client = new discord.Client({
  intents: [discord.Intents.FLAGS.GUILDS, discord.Intents.FLAGS.GUILD_MESSAGES],
})

;(async () => {
  const app = await import("./app")

  try {
    await app.tableHandler.load(client as any)
    await app.commandHandler.load(client as any)
    await app.listenerHandler.load(client as any)

    await client.login(process.env.BOT_TOKEN)

    if (!app.isFullClient(client)) {
      app.error("The Discord client is not full.", "system")
      client.destroy()
      process.exit(1)
    }
  } catch (error: any) {
    app.error(error, "system", true)
  }
})()
