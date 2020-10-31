import Discord from "discord.js"
import * as command from "../app/command"
import * as utils from "../utils"

const help: command.Command = {
  name: "help",
  aliases: ["h", "halp", "aide", "usage"],
  botPermissions: ["SEND_MESSAGES"],
  userPermissions: [],
  coolDown: 0,
  description: "Help menu",
  longDescription: "Display all commands of bot.",
  examples: ["help", "help colors", "help invite"],
  loading: false,
  botOwner: false,
  guildOwner: false,
  async run(message) {
    if (message.content.length > 0) {
      const cmd = command.commands.resolve(message.content)

      if (cmd) {
        await message.channel.send(
          new Discord.MessageEmbed()
            .setColor(utils.memberColor(message.guild.me))
            .setAuthor(
              `Command: ${cmd.name}`,
              utils.avatar(message.client.user)
            )
            .setTitle(`aliases: ${cmd.aliases.join(", ")}`)
            .setDescription(cmd.longDescription)
            .addField(
              "examples:",
              cmd.examples
                .map((example) => utils.code(utils.prefix + example))
                .join("\n"),
              false
            )
            .addField(
              "needed permissions:",
              `**Bot**: ${cmd.botPermissions.join(", ") || "none"}\n` +
                `**User**: ${cmd.userPermissions.join(", ") || "none"}`,
              false
            )
        )
      } else {
        await message.channel.send(
          new Discord.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              `Unknown command "${message.content}"`,
              utils.avatar(message.client.user)
            )
        )
      }
    } else {
      await message.channel.send(
        new Discord.MessageEmbed()
          .setColor(utils.memberColor(message.guild.me))
          .setAuthor("Command list", utils.avatar(message.client.user))
          .setDescription(
            command.commands.map((cmd) => {
              return `**${utils.prefix}${cmd.name}** - ${cmd.description}`
            })
          )
          .setFooter(`${utils.prefix}help <command>`)
      )
    }
  },
}

module.exports = help
