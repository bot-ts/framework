import discord from "discord.js"

export const client = new discord.Client({ intents: [] })

const app = await import("../dist/app.js")

try {
  await app.tableHandler.load(client)
  await app.commandHandler.load(client)
  await app.listenerHandler.load(client)

  app.log("Correctly started")
  process.exit(0)
} catch (error) {
  app.error(error, "index", true)
  process.exit(1)
}
