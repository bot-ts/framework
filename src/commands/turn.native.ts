// native file, if you want edit it, remove the "native" suffix from the filename

import * as app from "#app"

export default new app.Command({
  name: "turn",
  description: "Turn on/off command handling",
  aliases: ["power"],
  channelType: "all",
  botOwnerOnly: true,
  positional: [
    app.positional({
      name: "activated",
      description: "Is command handling activated",
      default: () => !app.cache.ensure<boolean>("turn", true),
      type: "boolean",
    }),
  ],
  async run(message) {
    app.cache.set("turn", message.args.activated)
    return message.channel.send(
      `${app.getSystemEmoji("success")} Command handling ${
        message.args.activated ? "activated" : "disabled"
      } `,
    )
  },
})
