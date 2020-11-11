import * as app from "../app"

const command: app.CommandResolvable = () => ({
  name: "help",
  aliases: ["h", "usage"],
  botPermissions: ["SEND_MESSAGES"],
  description: "Help menu",
  longDescription: "Display all commands of bot or detail a target command.",
  examples: ["help", ...app.commands.map((cmd) => "help " + cmd.name)],
  async run(message) {
    if (message.content.length > 0) {
      const cmd = app.commands.resolve(message.content)

      if (cmd) {
        await message.channel.send(
          new app.MessageEmbed()
            .setColor("BLURPLE")
            .setAuthor(
              `Command: ${cmd.name}`,
              message.client.user?.displayAvatarURL()
            )
            .setTitle(`aliases: ${cmd.aliases?.join(", ") ?? "none"}`)
            .setDescription(
              cmd.longDescription ?? cmd.description ?? "no description"
            )
            .addField(
              "examples:",
              cmd.examples
                ?.map((example) =>
                  app.code(app.prefix(message.guild) + example)
                )
                .join("\n") ?? "none",
              false
            )
            .addField(
              "needed permissions:",
              `**Bot**: ${cmd.botPermissions?.join(", ") || "none"}\n` +
                `**User**: ${cmd.userPermissions?.join(", ") || "none"}`,
              false
            )
        )
      } else {
        await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              `Unknown command "${message.content}"`,
              message.client.user?.displayAvatarURL()
            )
        )
      }
    } else {
      await message.channel.send(
        new app.MessageEmbed()
          .setColor("BLURPLE")
          .setAuthor("Command list", message.client.user?.displayAvatarURL())
          .setDescription(
            app.commands.map((resolvable) => {
              const cmd = app.resolve(resolvable) as app.Command
              return `**${app.prefix(message.guild)}${cmd.name}** - ${
                cmd.description ?? "no description"
              }`
            })
          )
          .setFooter(`${app.prefix(message.guild)}help <command>`)
      )
    }
  },
})

module.exports = command
