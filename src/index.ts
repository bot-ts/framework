import Discord from "discord.js"

import "dotenv/config"
import chalk from "chalk"

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

    if (!process.env.SECRET || /^{{.+}}$/.test(process.env.SECRET as string)) {
      app.isSlashCommandsUsable = false
      app.warn(
        `slash commands are disabled because the ${chalk.bold(
          "SECRET"
        )} environment variable is missing.`,
        "handler"
      )
    }

    await app.loadFiles.bind(client)()
  } catch (error) {
    app.error(error, "system", true)
  }
})()
