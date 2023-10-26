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
        new discord.MessageEmbed()
          .setColor("BLURPLE")
          .setTitle("The process is running..."),
      ],
    })

    cp.exec(message.rest, { cwd: process.cwd() }, (err, stdout, stderr) => {
      const output = err
        ? err.stack ?? err.message
        : stderr.trim() || stdout || null

      const embed = new discord.MessageEmbed()
        .setColor(err ? "RED" : "BLURPLE")
        .setTitle(
          err ? "\\❌ An error has occurred." : "\\✔ Successfully executed."
        )

      if (output)
        embed.setDescription(
          app.code.stringify({
            content: output
              .split("")
              .reverse()
              .slice(0, 2000)
              .reverse()
              .join(""),
          })
        )

      toEdit.edit({ embeds: [embed] }).catch(() => {
        message.channel.send({ embeds: [embed] }).catch()
      })
    })
  },
})
