import * as app from "../app"

const command: app.Command = {
  name: "test",
  description: "",
  positional: [
    {
      name: "channel",
      description: "Just a channel",
      castValue: "channel",
      required: true,
    },
  ],
  async run(message) {
    return message.args.channel.send("Coucou")
  },
}

module.exports = command
