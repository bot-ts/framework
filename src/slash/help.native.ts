import * as app from "../app.js"

export default new app.SlashCommand({
  name: "help",
  description: "Show slash command details or list all slash commands",
  guildOnly: true,
  // options: {
  //   command: {
  //     description: "The target command name.",
  //     type: "String",
  //   },
  // },
  build(builder) {
    builder.addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The target command name.")
        .setRequired(false),
    )
  },
  async run(interaction) {
    const target = interaction.options.command

    const command = interaction.guild.commands.cache.find(
      (cmd) => cmd.name === target,
    )

    if (command) return app.sendSlashCommandDetails(interaction, command)
    else {
      new app.StaticPaginator({
        pages: await app.divider(
          (
            await Promise.all(
              app.slashCommands.map(async (cmd) => {
                const prepared = await app.prepareSlashCommand(
                  interaction.base,
                  cmd,
                )

                if (prepared instanceof app.EmbedBuilder) return ""

                const command = interaction.guild.commands.cache.find(
                  (c) => c.name === cmd.options.name,
                )

                if (!command) return ""

                return app.slashCommandToListItem(command)
              }),
            )
          ).filter((line) => line.length > 0),
          10,
          (page) => {
            return new app.EmbedBuilder()
              .setColor("Blurple")
              .setAuthor({
                name: "Command list",
                iconURL: interaction.client.user?.displayAvatarURL(),
              })
              .setDescription(page.join("\n"))
              .setFooter({ text: `/help <command>` })
          },
        ),
        filter: (reaction, user) => user.id === interaction.user.id,
        channel: interaction.channel,
      })
    }
  },
})
