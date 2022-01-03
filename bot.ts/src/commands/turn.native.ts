import * as app from "../app.js"

export default new app.Command({
  name: "turn",
  description: "Turn on/off command handling",
  aliases: ["power"],
  channelType: "all",
  botOwnerOnly: true,
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
})
