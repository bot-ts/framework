import * as app from "../app"

import tims from "tims"
import path from "path"

const conf = require(path.join(process.cwd(), "package.json"))

const command: app.Command = {
  name: "info",
  description: "Get information about bot",
  async run(message) {
    return message.channel.send(
      new app.MessageEmbed()
        .setColor("BLURPLE")
        .setTitle("Information about " + conf.name)
        .setThumbnail(
          message.client.user?.displayAvatarURL({ dynamic: true }) ?? ""
        )
        .setTimestamp()
        .setDescription(
          app.code.stringify({
            content: [
              `author: ${
                message.client.users.cache.get(process.env.OWNER as string)?.tag
              }`,
              `uptime: ${tims.duration(app.uptime(), {
                format: "second",
              })}`,
              `memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
                2
              )}mb`,
              `guilds: ${message.client.guilds.cache.size}`,
              `users: ${message.client.users.cache.size}`,
              `ping: ${Date.now() - message.createdTimestamp}ms`,
            ].join("\n"),
            lang: "yml",
          })
        )
    )
  },
}

module.exports = command
