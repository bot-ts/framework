import * as command from "../app/command"

const say: command.Command = {
  name: "say",
  aliases: [],
  botOwner: false,
  guildOwner: false,
  botPermissions: ["SEND_MESSAGES"],
  userPermissions: [],
  coolDown: 0,
  description: "Say thing",
  longDescription: "I say what you want",
  examples: ["say thing"],
  loading: false,
  async run(message) {
    if (message.content.length > 0) {
      await message.channel.send(message.content)
    }
  },
}

module.exports = say
