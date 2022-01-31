import discord from "discord.js"
import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

import "dotenv/config"

for (const key of ["BOT_TOKEN", "BOT_PREFIX", "BOT_OWNER"]) {
  if (!process.env[key] || /^{{.+}}$/.test(process.env[key] as string)) {
    throw new Error(`You need to add "${key}" value in your .env file.`)
  }
}

export const client = new discord.Client({
  intents: process.env.BOT_INTENTS
    ? process.env.BOT_INTENTS.split(/[;|.,\s+]+/).map(
        (intent) => discord.Intents.FLAGS[intent as discord.IntentsString]
      )
    : [],
})

const app = await import("./app.js")

try {
  await client.login(process.env.BOT_TOKEN)

  await app.tableHandler.load(client)
  await app.commandHandler.load(client)
  await app.listenerHandler.load(client)

  if (!client.isReady()) {
    app.error("The Discord client is not full.", __filename)
    process.exit(1)
  }
} catch (error: any) {
  app.error(error, __filename, true)
  process.exit(1)
}
