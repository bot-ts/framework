const discordEval = require("discord-eval.js")
import * as app from "../app"

const command: app.Command = {
  name: "eval",
  aliases: ["js", "code", "run", "="],
  async run(message) {
    if (message.author.id !== process.env.BOT_OWNER) return

    if (
      message.content.split("\n").length === 1 &&
      !message.content.includes("return")
    ) {
      message.content = "return " + message.content
    }

    return discordEval(message.content, message)
  },
}

module.exports = command
