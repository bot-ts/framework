import * as app from "../app.js"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Redirect slash commands to messageCreate listener",
  async run(interaction) {
    if (!interaction.isCommand()) return

    let cmd: app.Command<
      keyof app.CommandMessageType,
      app.SlashCommandBuilder
    > = app.commands.resolve(interaction.commandName) as app.Command<
      keyof app.CommandMessageType,
      app.SlashCommandBuilder
    >

    // @ts-ignore
    const ctx: app.BuffedInteraction = {
      ...interaction,
      isInteraction: true,
      isMessage: false,
      args: [],
      rest: "",
      isFromBotOwner: interaction.user.id === process.env.BOT_OWNER,
      isFromGuildOwner: interaction.user.id === interaction.guild?.ownerId,
    }

    cmd.options.run.bind(cmd)(ctx)
  },
}

export default listener
