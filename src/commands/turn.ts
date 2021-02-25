import * as app from "../app"

const command: app.Command = {
  name: "turn",
  botOwner: true,
  description: "Turn on/off command handling",
  positional: [
    {
      name: "mode",
      description: "Power mode of bot. on/off",
      default: () => (app.cache.ensure("turn", true) ? "off" : "on"),
      checkValue: /^on|off$/,
      required: true,
    },
  ],
  async run(message) {
    const turn = message.positional.mode === "on"
    app.cache.set("turn", turn)
    return message.channel.send(
      `Command handling ${turn ? "activated" : "disabled"} `
    )
  },
}

module.exports = command
