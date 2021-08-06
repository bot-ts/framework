import discord from "discord.js"
import discordButtons from "discord-buttons"

import "dotenv/config"

for (const key of ["BOT_TOKEN", "BOT_PREFIX", "BOT_OWNER"]) {
  if (!process.env[key] || /^{{.+}}$/.test(process.env[key] as string)) {
    throw new Error(`You need to add "${key}" value in your .env file.`)
  }
}

const client = new discord.Client()

;(async () => {
  discordButtons(client)

  const app = await import("./app")

  try {
    await app.tableHandler.load(client as app.FullClient)
    await app.commandHandler.load(client as app.FullClient)
    await app.listenerHandler.load(client as app.FullClient)
    
    await client.login(process.env.BOT_TOKEN)

    if (!app.isFullClient(client)) {
      app.error("The Discord client is not full.", "system")
      client.destroy()
      process.exit(1)
    }
  } catch (error) {
    app.error(error, "system", true)
  }
})()
