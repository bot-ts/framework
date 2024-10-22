// native file, if you want edit it, remove the "native" suffix from the filename

import * as app from "#app"

import fs from "fs"
import time from "tims"
import discord from "discord.js"

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
    const conf = app.packageJSON

    const databaseClient = app.getDatabaseDriverName()

    const gitURL = app.config.options.openSource
      ? await app.getGitURL()
      : undefined

    let fundingURL: string | null = null

    try {
      const fundingFile = await fs.promises.readFile(
        app.fullPath(".github", "funding.yml"),
        "utf-8",
      )

      const match = /buy_me_a_coffee: (.+)\n?/.exec(fundingFile)

      if (match) fundingURL = `https://buymeacoffee.com/${match[1]}`
    } catch {}

    const embed = new app.EmbedBuilder()
      .setAuthor({
        name: `Information about ${message.client.user.tag}`,
        iconURL: message.client.user?.displayAvatarURL(),
        url: gitURL,
      })
      .setDescription(conf.description ?? "No description")
      .setTimestamp()
      .addFields(
        {
          name: conf.name,
          value: await app.code.stringify({
            lang: "yml",
            content: [
              `author: ${
                message.client.users.resolve(app.env.BOT_OWNER)!.username
              }`,
              `uptime: ${time.duration(app.uptime(), {
                format: "second",
                maxPartCount: 2,
              })}`,
              `memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
                2,
              )}mb`,
              `ping: ${message.client.ws.ping}ms`,
              `database: ${databaseClient}@${
                app.packageJSON.dependencies?.[databaseClient] ?? "unknown"
              }`,
              `node: ${process.version}`,
            ].join("\n"),
          }),
          inline: true,
        },
        {
          name: "Cache",
          value: await app.code.stringify({
            lang: "yml",
            content: [
              `guilds: ${message.client.guilds.cache.size}`,
              `users: ${message.client.users.cache.size}`,
              `members: ${message.client.guilds.cache.reduce((acc, guild) => {
                return acc + guild.members.cache.size
              }, 0)}`,
              `channels: ${message.client.channels.cache.size}`,
              `roles: ${message.client.guilds.cache.reduce((acc, guild) => {
                return acc + guild.roles.cache.size
              }, 0)}`,
              `messages: ${message.client.channels.cache.reduce(
                (acc, channel) => {
                  return (
                    acc +
                    (channel.isTextBased() ? channel.messages.cache.size : 0)
                  )
                },
                0,
              )}`,
            ].join("\n"),
          }),
          inline: true,
        },
      )

    if (message.args.dependencies)
      embed.addFields(
        {
          name: app.blankChar,
          value: app.blankChar,
          inline: false,
        },
        {
          name: "Dependencies",
          value:
            conf.dependencies && Object.keys(conf.dependencies).length > 0
              ? await app.code.stringify({
                  lang: "yml",
                  content: Object.entries(conf.dependencies)
                    .map(([name, version]) => {
                      return `${name.replace(/@/g, "")}: ${version}`
                    })
                    .join("\n"),
                })
              : "No dependencies",
          inline: true,
        },
        {
          name: "Dev dependencies",
          value:
            conf.devDependencies && Object.keys(conf.devDependencies).length > 0
              ? await app.code.stringify({
                  lang: "yml",
                  content: Object.entries(conf.devDependencies)
                    .map(([name, version]) => {
                      return `${name.replace(/@/g, "")}: ${version}`
                    })
                    .join("\n"),
                })
              : "No dev dependencies",
          inline: true,
        },
      )

    const row =
      new app.ActionRowBuilder<discord.MessageActionRowComponentBuilder>()

    if (gitURL) {
      row.addComponents(
        new app.ButtonBuilder()
          .setLabel("View source")
          .setStyle(app.ButtonStyle.Link)
          .setURL(gitURL),
      )
    }

    if (fundingURL) {
      row.addComponents(
        new app.ButtonBuilder()
          .setLabel("Fund me")
          .setEmoji("💖")
          .setStyle(app.ButtonStyle.Link)
          .setURL(fundingURL),
      )
    }

    return message.channel.send({
      embeds: [embed],
      components: gitURL || fundingURL ? [row] : undefined,
    })
  },
})
