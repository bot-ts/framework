import Discord from "discord.js"

import "dotenv/config"

for (const key of ["TOKEN", "PREFIX", "OWNER"]) {
  if (!process.env[key] || /^{{.+}}$/.test(process.env[key] as string)) {
    throw new Error(`You need to add "${key}" value in your .env file.`)
  }
}

const client = new Discord.Client()

;(async () => {
  const app = await import("./app")

  try {
    await client.login(process.env.TOKEN)

    if (!app.isFullClient(client))
      throw new Error("The Discord client is not full.")

    await app.tableHandler.load(client)
    await app.commandHandler.load(client)
    await app.listenerHandler.load(client)
    await app.slashCommandHandler.load(client)
  } catch (error) {
    app.error(error, "system", true)
  }
})()
