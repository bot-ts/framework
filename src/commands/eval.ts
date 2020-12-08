import discordEval from "discord-eval.ts"
import * as app from "../app"

const command: app.Command = {
  name: "eval",
  botOwner: true,
  aliases: ["js", "code", "run", "="],
  run(message) {
    const muted = message.content.includes("@muted")
    return discordEval(message.content, message, muted)
  },
}

module.exports = command
