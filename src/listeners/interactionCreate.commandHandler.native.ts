import * as app from "../app.js"

const __filename = app.filename(import.meta)

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

    const args: app.CommandContext["args"] = []

    // @ts-ignore
    const ctx: app.BuffedInteraction = {
      ...interaction,
      isInteraction: true,
      isMessage: false,
      args,
      rest: "",
      send: (sent: app.SentItem) => interaction.reply(sent),
      isFromBotOwner: interaction.user.id === process.env.BOT_OWNER,
      isFromGuildOwner: interaction.user.id === interaction.guild?.ownerId,
    }

    const prepared = await app.prepareCommand(ctx, cmd, null)

    if (typeof prepared !== "boolean")
      return ctx.send({
        embeds: [prepared],
      })

    if (!prepared) return

    try {
      await cmd.options.run.bind(cmd)(ctx)
    } catch (error: any) {
      app.error(error, cmd.filepath ?? __filename, true)
      ctx
        .send(
          app.code.stringify({
            content: `${error.name ?? "Error"}: ${
              error.message?.replace(/\x1b\[\d+m/g, "") ?? "unknown"
            }`,
            lang: "js",
          })
        )
        .catch((error) => {
          app.error(error, cmd?.filepath ?? __filename, true)
        })
    }
  },
}

export default listener
