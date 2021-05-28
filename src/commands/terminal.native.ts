import * as app from "../app"
import cp from "child_process"

module.exports = new app.Command({
  name: "terminal",
  description: "Run shell command from Discord",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  channelType: "all",
  botOwnerOnly: true,
  coolDown: 5000,
  rest: {
    all: true,
    name: "cmd",
    description: "The cmd to run",
    required: true,
  },
  async run(message) {
    message.triggerCoolDown()

    const toEdit = await message.channel.send(
      new app.MessageEmbed().setTitle("The process is running...")
    )

    cp.exec(message.rest, { cwd: process.cwd() }, (err, stdout, stderr) => {
      const output = err
        ? err.stack ?? err.message
        : stderr.trim() || stdout || null

      const embed = new app.MessageEmbed().setTitle(
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

      toEdit.edit(embed).catch(() => {
        message.channel.send(embed).catch()
      })
    })
  },
})
