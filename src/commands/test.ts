import * as app from "../app"

const command: app.Command = {
  name: "test",
  description: "",
  positional: [
    {
      name: "member",
      description: "Just a member",
      castValue: "member",
      required: true,
    },
  ],
  async run(message) {
    return message.channel.send(message.args.member.toString())
  },
}

module.exports = command
