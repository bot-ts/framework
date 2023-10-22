// native file, if you want edit it, remove the "native" suffix from the filename

import * as app from "../app.js"

import time from "tims"

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
    const embed = new app.MessageEmbed()
      .setColor("BLURPLE")
      .setAuthor({
        name: `Information about ${message.client.user.tag}`,
        iconURL: message.client.user?.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(conf.description)
      .setTimestamp()
      .addFields([
        {
          name: conf.name,
          value: app.code.stringify({
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
              `database: ${app.orm.database.client.constructor.name}`,
            ].join("\n"),
          }),
          inline: true,
        },
        {
          name: "Cache",
          value: app.code.stringify({
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
          inline: true,
        },
      ])

    return message.channel.send({
      embeds: [
        !message.args.dependencies
          ? embed
          : embed.addFields([
              {
                name: app.blankChar,
                value: app.blankChar,
                inline: false,
              },
              {
                name: "Dependencies",
                value: app.code.stringify({
                  lang: "yml",
                  content: Object.entries(conf.dependencies)
                    .map(([name, version]) => {
                      return `${name.replace(/@/g, "")}: ${version}`
                    })
                    .join("\n"),
                }),
                inline: true,
              },
              {
                name: "Dev dependencies",
                value: app.code.stringify({
                  lang: "yml",
                  content: Object.entries(conf.devDependencies)
                    .map(([name, version]) => {
                      return `${name.replace(/@/g, "")}: ${version}`
                    })
                    .join("\n"),
                }),
                inline: true,
              },
            ]),
      ],
    })
  },
})
