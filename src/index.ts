import Discord from "discord.js"
import dotenv from "dotenv"
import fs from "fs/promises"
import path from "path"

dotenv.config()

const client = new Discord.Client()

client.login(process.env.TOKEN).catch(console.error)

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
