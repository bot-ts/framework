const discordEval = require("discord-eval.js")
import * as app from "../app"

const command: app.Command = {
  name: "eval",
  aliases: ["js", "code", "run", "="],
  async run(message) {
    if (message.author.id !== process.env.OWNER) return
    return discordEval(message.content, message)
  },
}

module.exports = command
