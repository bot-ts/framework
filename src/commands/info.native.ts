import * as app from "../app.js"

import time from "tims"
import * as core from "../app/core.js"

const conf = app.fetchPackageJson()

export default new app.Command({
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
    const embed = new core.SafeMessageEmbed()
      .setColor()
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
              message.client.users.cache.get(await app.getBotOwnerId(message))
                ?.tag
            }`,
            `uptime: ${time.duration(app.uptime(), {
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
            `roles: ${message.client.guilds.cache.reduce((acc, guild) => {
              return acc + guild.roles.cache.size
            }, 0)}`,
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
    return message.channel.send({
      embeds: [
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
              ),
      ],
    })
  },
})
