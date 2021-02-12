import * as app from "../app"

const command: app.Command = {
  name: "test",
  aliases: ["?", "debug", "catch"],
  description: "Testing command for debug.",
  async run(message) {
    await message.reply(
      new app.MessageEmbed()
        .setTitle("Command debugging")
        .setDescription(
          `content: ${app.toCodeBlock(message.content)}rest: ${app.toCodeBlock(
            message.rest
          )}`
        )
        .addField(
          "args",
          app.toCodeBlock(JSON.stringify(message.args, null, 2), "json"),
          true
        )
        .addField(
          "positional",
          app.toCodeBlock(JSON.stringify(message.positional, null, 2), "json"),
          true
        )
    )
  },
}

module.exports = command
