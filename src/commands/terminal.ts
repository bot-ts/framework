import * as app from "../app"
import cp from "child_process"

const command: app.Command = {
  name: "terminal",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  description: "Run shell command from Discord",
  botOwnerOnly: true,
  coolDown: 5000,
  rest: {
    name: "cmd",
    description: "The cmd to run",
    required: true,
  },
  async run(message) {
    message.triggerCoolDown()

    const toEdit = await message.channel.send("The process is running...")

    cp.exec(message.rest, { cwd: process.cwd() }, (err, stdout, stderr) => {
      const embed = new app.MessageEmbed()
        .setTitle(
          err ? "\\❌ An error has occurred." : "\\✔ Successfully executed."
        )
        .setDescription(
          app.code.stringify({
            content:
              (err ? err.stack ?? err.message ?? stderr : stdout).slice(
                0,
                2000
              ) || "No log",
          })
        )

      toEdit.edit(embed).catch(() => {
        message.channel.send(embed).catch()
      })
    })
  },
}

module.exports = command
