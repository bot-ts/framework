import * as app from "../app.js"

export default new app.Command({
  name: "slash",
  description: "Test slash command",
  channelType: "all",
  async run(context) {
    console.log(context)
    return context.send("Coucou ça fonctionne")
  },
  subs: [
    new app.Command({
      name: "sub",
      description: "Test sub command",
      positional: [
        {
          name: "bool",
          required: true,
          castValue: "boolean",
          description: "Test bool option",
        },
      ],
      async run(context) {
        console.log(context)
        return context.send("Coucou ça fonctionne (sub)")
      },
    }),
  ],
  slash: {
    deploy: {
      guilds: ["781105165754433537"],
      global: false,
    },
    builder: new app.SlashCommandBuilder()
    .setName("slash")
    .setDescription("test slash command")
    .addSubcommand((sub) =>
      sub
        .setName("sub")
        .setDescription("test sub command")
        .addBooleanOption((option) =>
          option
            .setName("bool")
            .setDescription("test bool option")
            .setRequired(true)
        )
    ),
  }
})
