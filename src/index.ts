import Discord from "discord.js"
import dotenv from "dotenv"

dotenv.config()

import client from "./app/client"
import * as utils from "./app/utils"
import * as command from "./app/command"

client.on("message", async function (message) {
  if (!command.isCommandMessage(message)) return

  if (message.content.startsWith(utils.prefix)) {
    message.content = message.content.slice(utils.prefix.length)
  } else {
    return
  }

  const key = message.content.split(/\s+/)[0]
  const cmd = command.commands.resolve(key)

  if (!cmd) return

  if (cmd.botOwner) {
    if (process.env.BOT_OWNER !== message.member.id) {
      return await message.channel.send(
        new Discord.MessageEmbed()
          .setColor("RED")
          .setAuthor("You must be my owner.", utils.avatar(message.client.user))
      )
    }
  }

  if (cmd.guildOwner) {
    if (message.guild.owner !== message.member) {
      return await message.channel.send(
        new Discord.MessageEmbed()
          .setColor("RED")
          .setAuthor(
            "You must be the guild owner.",
            utils.avatar(message.client.user)
          )
      )
    }
  }

  message.content = message.content.slice(key.length).trim()

  try {
    await cmd.run(message)
  } catch (error) {
    console.error(error)
    message.channel
      .send(utils.code(`Error: ${error.message ?? "unknown"}`, "js"))
      .catch(console.error)
  }
})
