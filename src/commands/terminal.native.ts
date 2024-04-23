// native file, if you want edit it, remove the "native" suffix from the filename

import cp from "child_process"
import discord from "discord.js"

import * as app from "../app.js"

export default new app.Command({
  name: "terminal",
  description: "Run shell command from Discord",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  channelType: "all",
  botOwnerOnly: true,
  cooldown: {
    duration: 5000,
    type: app.CooldownType.Global,
  },
  rest: {
    all: true,
    name: "cmd",
    description: "The cmd to run",
    required: true,
  },
  async run(message) {
    message.triggerCoolDown()

    const toEdit = await message.channel.send({
      embeds: [
        new discord.EmbedBuilder()
          .setColor("Blurple")
          .setTitle("The process is running..."),
      ],
    })

    const embed = new discord.EmbedBuilder()

    try {
      const output = cp.execSync(message.rest, {
        cwd: process.cwd(),
        encoding: "utf-8",
      })

      embed
        .setColor("Blurple")
        .setTitle("\\✔ Done")
        .setDescription(
          await app.code.stringify({
            content: output
              .split("")
              .reverse()
              .slice(0, 2000)
              .reverse()
              .join(""),
          }),
        )
    } catch (err: any) {
      embed
        .setColor("Red")
        .setTitle("\\❌ Errored")
        .setDescription(
          await app.code.stringify({
            content: (err.stack ?? err.message)
              .split("")
              .reverse()
              .slice(0, 2000)
              .reverse()
              .join(""),
          }),
        )
    }

    toEdit.edit({ embeds: [embed] }).catch(() => {
      message.channel.send({ embeds: [embed] }).catch()
    })
  },
})
