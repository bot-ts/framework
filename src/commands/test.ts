import * as app from "../app"

const command: app.Command = {
  name: "test",
  async run(message) {
    await message.channel.send(
      app.CODE.stringify({
        content: JSON.stringify(message.args, null, 2),
        lang: "json",
      })
    )
  },
}

module.exports = command
