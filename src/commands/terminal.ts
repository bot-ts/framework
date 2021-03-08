import * as app from "../app"
import cp from "child_process"

const command: app.Command = {
  name: "terminal",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  description: "Run shell command from Discord",
  botOwner: true,
  coolDown: 5000,
  async run(message) {
    const toEdit = await message.channel.send("The process is running...")
    cp.exec(message.rest, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) {
        const errorMessage = `An error has occurred. ${app.CODE.stringify({
          content: err.stack ?? err.message,
        })}`
        return toEdit.edit(errorMessage).catch(() => {
          message.channel.send(errorMessage).catch()
        })
      }
      const successMessage = `The following command has been executed:\n\`${message.rest}\``
      toEdit.edit(successMessage).catch(() => {
        message.channel.send(successMessage).catch()
      })
    })
  },
}

module.exports = command
