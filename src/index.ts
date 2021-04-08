import Discord from "discord.js"
import dotenv from "dotenv"
import chalk from "chalk"
import fs from "fs/promises"
import path from "path"

dotenv.config()

for (const key of ["TOKEN", "PREFIX", "OWNER"]) {
  if (!process.env[key] || /[{}\s]/.test(process.env[key] as string)) {
    throw new Error("You need to add " + key + " value in your .env file.")
  }
}

const client = new Discord.Client()

;(async () => {
  const app = await import("./app")

  // load tables
  await fs.readdir(app.tablesPath).then(async (files) => {
    const tables = await Promise.all(
      files.map(async (filename) => {
        const tableFile = await import(path.join(app.tablesPath, filename))
        return tableFile.default
      })
    )
    return Promise.all(
      tables
        .sort((a, b) => {
          return (b.options.priority ?? 0) - (a.options.priority ?? 0)
        })
        .map(async (table) => {
          app.tables.set(table.options.name, await table.make())
        })
    )
  })

  // load commands
  await fs.readdir(app.commandsPath).then((files) =>
    files.forEach((filename) => {
      app.commands.add(require(path.join(app.commandsPath, filename)))
    })
  )

  // load listeners
  await fs.readdir(app.listenersPath).then((files) =>
    files.forEach((filename) => {
      const listener = require(path.join(app.listenersPath, filename))
      client[listener.once ? "once" : "on"](listener.event, listener.run)
      app.log(
        `loaded event ${chalk.yellow(
          listener.once ? "once" : "on"
        )} ${chalk.blue(listener.event)}`,
        "handler"
      )
    })
  )

  // start client
  client.login(process.env.TOKEN).catch(() => {
    throw new Error("Invalid Discord token given.")
  })
})().catch((error) =>
  import("./app/logger").then((logger) => logger.error(error, "system", true))
)
