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
    builder: {
      name: "slash",
      description: "Test slash command",
      options: [
        {
          type: 1,
          name: "sub",
          description: "Test sub command",
          options: [
            {
              type: 5,
              name: "bool",
              description: "Test bool option",
              required: true,
            }
          ]
        }
      ]
    }
  }
})
