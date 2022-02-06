import * as app from "../app.js"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Handle slash commands",
  async run(interaction) {
    if (!interaction.isCommand()) return

    let cmd = app.commands.resolve(interaction.commandName)

    if (!cmd)
      return interaction.reply(
        `The "${interaction.commandName}" slash command is not yet implemented.`
      )

    const subCommand = interaction.options.getSubcommand(false)

    console.log(subCommand)

    if (cmd.options.subs && subCommand)
      for (const sub of cmd.options.subs)
        if (sub.canBeCalledBy(subCommand)) {
          cmd = sub
          break
        }

    // @ts-ignore
    const ctx: app.BuffedInteraction = {
      ...interaction,
      isInteraction: true,
      isMessage: false,
      args: [],
      rest: "",
      send: (sent: app.SentItem) => interaction.reply(sent),
      isFromBotOwner: interaction.user.id === process.env.BOT_OWNER,
      isFromGuildOwner: interaction.user.id === interaction.guild?.ownerId,
    }

    cmd.options.run.bind(cmd)(ctx)
  },
}

export default listener
