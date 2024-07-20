// native file, if you want edit it, remove the "native" suffix from the filename

import * as app from "#app"

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
      .replace(/\$guild/g, `'${message.guild?.id}'`)
      .replace(/\$channel/g, `'${message.channel.id}'`)
      .replace(/\$me/g, `'${message.author.id}'`)
      .replace(/<(?:[#@][&!]?|a?:\w+:)(\d+)>/g, "'$1'")
      .replace(/from ([a-z]+)/gi, 'from "$1"')

    let result = await app.database.raw(query)

    result = result.rows ?? result

    const systemMessage = Array.isArray(result)
      ? await app.getSystemMessage("success", {
          title: `Result of SQL query (${result.length} items)`,
          description: await app.limitDataToShow(
            result,
            app.MaxLength.EmbedDescription,
            (data) =>
              app.code.stringify({
                lang: "json",
                format: { printWidth: 50 },
                content: "const result = " + JSON.stringify(data),
              }),
          ),
          footer: { text: `Result of : ${query}` },
        })
      : await app.getSystemMessage("success", {
          title: `SQL query done`,
          footer: { text: `Query : ${query}` },
        })

    return message.channel.send(systemMessage)
  },
  subs: [
    new app.Command({
      name: "plan",
      description: "Show database plan",
      botOwnerOnly: true,
      channelType: "all",
      aliases: ["tables", "schema", "list", "view"],
      async run(message) {
        const fields = await Promise.all(
          app.database.cachedTables.map(
            async (table): Promise<app.EmbedField> => {
              const columns: {
                defaultValue: unknown
                type: string
                name: string
              }[] = await table.getColumns().then((cols) => {
                return Object.entries(cols).map(
                  ([name, { defaultValue, type }]) => {
                    return { name, type, defaultValue }
                  },
                )
              })

              const rowCount = await table.count()

              return {
                name: `${table.options.name} x${rowCount}`,
                value: columns
                  .map(
                    ({ name, type, defaultValue }) =>
                      `[\`${type.slice(0, 5)}\`] \`${name}${
                        defaultValue ? `?` : ""
                      }\``,
                  )
                  .join("\n"),
                inline: true,
              }
            },
          ),
        )

        return message.channel.send(
          await app.getSystemMessage("default", {
            title: "Database plan",
            description: `**${fields.length}** tables, **${fields.reduce(
              (acc, current) => {
                return acc + current.value.split("\n").length
              },
              0,
            )}** columns`,
            fields: fields.sort((a, b) => {
              return a.value.split("\n").length - b.value.split("\n").length
            }),
          }),
        )
      },
    }),
  ],
})
