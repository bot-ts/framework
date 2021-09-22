import discord from "discord.js"
import type { FullClient } from "./app.js"

import "dotenv/config"

for (const key of ["BOT_TOKEN", "BOT_PREFIX", "BOT_OWNER"]) {
  if (!process.env[key] || /^{{.+}}$/.test(process.env[key] as string)) {
    throw new Error(`You need to add "${key}" value in your .env file.`)
  }
}

const client = new discord.Client({
  intents: process.env.BOT_INTENTS
    ? process.env.BOT_INTENTS.split(",").map(
        (intent) => discord.Intents.FLAGS[intent as discord.IntentsString]
      )
    : [],
})

;(async () => {
  const app = await import("./app.js")

  try {
    await app.tableHandler.load(client as FullClient)
    await app.commandHandler.load(client as FullClient)
    await app.listenerHandler.load(client as FullClient)

    await client.login(process.env.BOT_TOKEN)

    if (!app.isFullClient(client)) {
      app.error("The Discord client is not full.", "system")
      client.destroy()
      process.exit(1)
    }
  } catch (error: any) {
    app.error(error, "system:launch", true)
  }
})()
