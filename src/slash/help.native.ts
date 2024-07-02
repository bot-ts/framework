import * as app from "#app"

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
  build() {
    this.addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The target command name.")
        .setRequired(false),
    )
  },
  async run(interaction) {
    const commandName = interaction.options.command as string

    const commands = [
      ...(await interaction.client.application.commands.fetch()).values(),
      ...(await interaction.guild.commands.fetch()).values(),
    ]

    const command = commands.find((cmd) => cmd.name === commandName)

    if (command) return app.sendSlashCommandDetails(interaction, command)
    else {
      await interaction.base.deferReply()

      new app.StaticPaginator({
        pages: await app.divider(
          app.slashCommands
            .map((cmd) => {
              const command = commands.find((c) => c.name === cmd.options.name)

              if (!command) return `unknown command ${cmd.options.name}`

              return app.slashCommandToListItem(command)
            })
            .filter((line) => line.length > 0),
          10,
          (page) => {
            return app.getSystemMessage("default", {
              description: page.join("\n"),
              author: {
                name: "Command list",
                iconURL: interaction.client.user?.displayAvatarURL(),
              },
              footer: { text: `/help <command>` },
            })
          },
        ),
        filter: (reaction, user) => user.id === interaction.base.user.id,
        channel: interaction.channel,
      })
    }
  },
})
