import Discord from "discord.js"
import dotenv from "dotenv"
import fs from "fs/promises"
import path from "path"

dotenv.config()

for (const key of ["TOKEN", "PREFIX", "OWNER"]) {
  if (!process.env[key] || /[{}\s]/.test(process.env[key] as string)) {
    throw new Error("You need to add " + key + " value in your .env file.")
  }
}

const client = new Discord.Client()

client.login(process.env.TOKEN).catch(() => {
  throw new Error("Invalid Discord token given.")
})

import * as app from "./app"

fs.readdir(app.commandsPath)
  .then((files) =>
    files.forEach((filename) => {
      app.commands.add(require(path.join(app.commandsPath, filename)))
    })
  )
  .catch(console.error)

fs.readdir(app.listenersPath)
  .then((files) =>
    files.forEach((filename) => {
      const listener: app.Listener<any> = require(path.join(
        app.listenersPath,
        filename
      ))
      client[listener.once ? "once" : "on"](listener.event, listener.call)
    })
  )
  .catch(console.error)
