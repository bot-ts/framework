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
    const query = message.args.query
      .replace("$here", `where id = "${message.guild?.id}"`)
      .replace("$me", `where id = "${message.author.id}"`)

    const result = await app.db.raw(query)

    return message.send({
      embeds: [
        new app.MessageEmbed()
          .setColor("BLURPLE")
          .setTitle(
            `Result of SQL query ${
              Array.isArray(result) ? `(${result.length} items)` : ""
            }`
          )
          .setDescription(
            app.code.stringify({
              lang: "json",
              format: true,
              content: JSON.stringify(result).slice(0, 1024),
            })
          )
          .setFooter(`Result of : ${query}`),
      ],
    })
  },
})
