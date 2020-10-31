import Discord from "discord.js"
import * as utils from "../utils"
import * as command from "../app/command"

const info: command.Command = {
  name: "info",
  aliases: ["i", "bot"],
  loading: false,
  botOwner: false,
  guildOwner: false,
  examples: ["i", "bot"],
  description: "Display bot info",
  longDescription: "Display bot information",
  coolDown: 0,
  userPermissions: [],
  botPermissions: ["SEND_MESSAGES"],
  async run(message) {
    await message.channel.send(
      new Discord.MessageEmbed()
        .setAuthor("Bot Information", utils.avatar(message.client.user))
        .setDescription(`**Guild count**: ${message.client.guilds.cache.size}`)
    )
  },
}

module.exports = info
