import * as app from "../app.js"

export default new app.Command({
  name: "slash",
  description: "Test slash command",
  channelType: "all",
  // slash: {
  //   deploy: {
  //     guilds: ["1111111111"],
  //     global: false,
  //   },
  //   builder: {
  //     type: 1,
  //     name: "slash",
  //     description: "Test slash command",
  //     options: [
  //       {
  //         type: 1,
  //         name: "sub",
  //         description: "Test slash subcommand",
  //         options: [
  //           {
  //             type: 5,
  //             name: "bool",
  //             description: "Test slash bool option",
  //           },
  //         ]
  //       }
  //     ]
  //   }
  // },
  async run(context) {
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
        return context.send("Coucou ça fonctionne (sub)")
      },
    }),
  ],
})
