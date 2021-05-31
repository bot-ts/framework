import * as app from "../app"

import tims from "tims"
import path from "path"

const conf = require(path.join(process.cwd(), "package.json"))

module.exports = new app.Command({
  name: "info",
  description: "Get information about bot",
  flags: [
    {
      name: "dependencies",
      description: "Show dependencies",
      aliases: ["deps", "all"],
      flag: "d",
    },
  ],
  async run(message) {
    const embed = new app.MessageEmbed()
      .setColor("BLURPLE")
      .setAuthor(
        `Information about ${message.client.user.tag}`,
        message.client.user?.displayAvatarURL({ dynamic: true })
      )
      .setDescription(conf.description)
      .setTimestamp()
      .addField(
        conf.name,
        app.code.stringify({
          lang: "yml",
          content: [
            `author: ${
              message.client.users.cache.get(process.env.BOT_OWNER as string)
                ?.tag
            }`,
            `uptime: ${tims.duration(app.uptime(), {
              format: "second",
              maxPartCount: 2,
            })}`,
            `memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
              2
            )}mb`,
            `ping: ${message.client.ws.ping}ms`,
            `database: ${app.db.client.constructor.name}`,
          ].join("\n"),
        }),
        true
      )
      .addField(
        "Cache",
        app.code.stringify({
          lang: "yml",
          content: [
            `guilds: ${message.client.guilds.cache.size}`,
            `users: ${message.client.users.cache.size}`,
            `channels: ${message.client.channels.cache.size}`,
            `messages: ${message.client.channels.cache.reduce(
              (acc, channel) => {
                return (
                  acc + (channel.isText() ? channel.messages.cache.size : 0)
                )
              },
              0
            )}`,
          ].join("\n"),
        }),
        true
      )
    return message.channel.send(
      !message.args.dependencies
        ? embed
        : embed
            .addField("\u200B", "\u200B", false)
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
    )
  },
})
