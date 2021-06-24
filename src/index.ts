import Discord from "discord.js"

import "dotenv/config"

for (const key of ["BOT_TOKEN", "BOT_PREFIX", "BOT_OWNER"]) {
  if (!process.env[key] || /^{{.+}}$/.test(process.env[key] as string)) {
    throw new Error(`You need to add "${key}" value in your .env file.`)
  }
}

const client = new Discord.Client()

;(async () => {
  const app = await import("./app")

  try {
    await client.login(process.env.BOT_TOKEN)

    if (!app.isFullClient(client)) {
      app.error("The Discord client is not full.", "system")
      client.destroy()
      process.exit(1)
    }

    await app.tableHandler.load(client)
    await app.commandHandler.load(client)
    await app.listenerHandler.load(client)
  } catch (error) {
    app.error(error, "system", true)
  }
})()
