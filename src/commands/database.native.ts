import * as app from "../app.js"

export default new app.Command({
  name: "database",
  description: "Run SQL query on database",
  aliases: ["query", "db", "sql", "?"],
  botOwnerOnly: true,
  channelType: "all",
  rest: {
    name: "query",
    description: "SQL query",
    required: true,
    all: true,
  },
  async run(message) {
    const result = await app.db.raw(message.args.query)

    return message.send({
      embeds: [
        new app.MessageEmbed()
          .setColor("BLURPLE")
          .setTitle("Result of SQL query")
          .setDescription(
            app.code.stringify({
              lang: "json",
              format: true,
              content: JSON.stringify(result).slice(0, 1024),
            })
          )
          .setFooter(`Result of : ${message.args.query}`),
      ],
    })
  },
})
