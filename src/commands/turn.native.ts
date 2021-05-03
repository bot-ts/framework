import * as app from "../app"

const command: app.Command = {
  name: "turn",
  aliases: ["power"],
  botOwnerOnly: true,
  description: "Turn on/off command handling",
  positional: [
    {
      name: "activated",
      description: "Is command handling activated",
      default: () => String(!app.cache.ensure<boolean>("turn", true)),
      castValue: "boolean",
    },
  ],
  async run(message) {
    app.cache.set("turn", message.args.activated)
    return message.channel.send(
      `Command handling ${message.args.activated ? "activated" : "disabled"} `
    )
  },
}

module.exports = command
