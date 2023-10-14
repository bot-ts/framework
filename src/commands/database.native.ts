// native file, if you want edit it, remove the "native" suffix from the filename

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
      .replace(/\$guild/g, `"${message.guild?.id}"`)
      .replace(/\$channel/g, `"${message.channel.id}"`)
      .replace(/\$me/g, `"${message.author.id}"`)
      .replace(/<(?:[#@][&!]?|a?:\w+:)(\d+)>/g, '"$1"')

    const result = await app.orm.database.raw(query)

    return message.send({
      embeds: [
        new app.SafeMessageEmbed()
          .setColor()
          .setTitle(
            `Result of SQL query ${
              Array.isArray(result) ? `(${result.length} items)` : ""
            }`
          )
          .setDescription(
            app.code.stringify({
              lang: "json",
              format: { printWidth: 62 },
              content: JSON.stringify(result).slice(0, 1024),
            })
          )
          .setFooter(`Result of : ${query}`),
      ],
    })
  },
  subs: [
    new app.Command({
      name: "plan",
      description: "Show database plan",
      botOwnerOnly: true,
      channelType: "all",
      aliases: ["tables", "schema", "list", "view"],
      async run(message) {
        const packageJSON = app.fetchPackageJson()

        const tables = Array.from(app.orm.handler.elements.keys())

        const fields = await Promise.all(
          tables.map(async (name): Promise<app.EmbedFieldData> => {
            const columns: {
              defaultValue: unknown
              type: string
              name: string
            }[] = await app.orm
              .database(name)
              .columnInfo()
              .then((cols) => {
                return Object.entries(cols).map(
                  ([name, { defaultValue, type }]) => {
                    return { name, type, defaultValue }
                  }
                )
              })

            const rowCount = (await app.orm
              .database(name)
              .count("* as total")
              .first())!

            return {
              name: `${name} x${rowCount.total}`,
              value: columns
                .map(
                  ({ name, type, defaultValue }) =>
                    `[\`${type.slice(0, 5)}\`] \`${name}${
                      defaultValue ? `?` : ""
                    }\``
                )
                .join("\n"),
              inline: true,
            }
          })
        )

        return message.send({
          embeds: [
            new app.SafeMessageEmbed()
              .setColor()
              .setTitle("Database plan")
              .setDescription(
                `**${fields.length}** tables, **${fields.reduce(
                  (acc, current) => {
                    return acc + current.value.split("\n").length
                  },
                  0
                )}** columns`
              )
              .addFields(
                ...fields.sort((a, b) => {
                  return a.value.split("\n").length - b.value.split("\n").length
                })
              ),
          ],
        })
      },
    }),
  ],
})
