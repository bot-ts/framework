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
        .setAuthor(
          `Information about ${message.client.user?.tag ?? conf.name}`,
          message.client.user?.displayAvatarURL({ dynamic: true })
        )
        .setTimestamp()
        .setDescription(
          app.code.stringify({
            lang: "yml",
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
              `database: ${app.db.client.constructor.name}`,
              `cwd: ${process
                .cwd()
                .split(/[\\\/]/)
                .map((segment, i, arr) => {
                  return arr.length > 5 && i > 2 && i < arr.length - 2
                    ? "..."
                    : segment
                })
                .join(path.sep)}${path.sep}`,
            ].join("\n"),
          })
        )
        .addField(
          "Dependencies",
          app.code.stringify({
            lang: "yml",
            content: Object.entries(conf.dependencies)
              .map(([name, version]) => {
                return `${name.replace(/@/g, "")}: ${version}`
              })
              .join("\n"),
          }),
          true
        )
        .addField(
          "Dev dependencies",
          app.code.stringify({
            lang: "yml",
            content: Object.entries(conf.devDependencies)
              .map(([name, version]) => {
                return `${name.replace(/@/g, "")}: ${version}`
              })
              .join("\n"),
          }),
          true
        )
        .setFooter(conf.description)
    )
  },
}

module.exports = command
