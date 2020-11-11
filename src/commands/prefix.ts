import * as app from "../app"

const command: app.Command = {
  name: "prefix",
  async run(message) {
    // todo: code here
    await message.reply("prefix command is not yet implemented.")
  },
}

module.exports = command
