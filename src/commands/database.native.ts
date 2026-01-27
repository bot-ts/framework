// native file, if you want edit it, remove the "native" suffix from the filename

import * as discordEval from "discord-eval.ts"
import discord from "discord.js"

import { type AnyMessage, Command, Middleware } from "#core/command"
import database from "#core/database"
import * as util from "#core/util"

export default new Command({
	name: "database",
	description: "Run SQL query on database",
	aliases: ["query", "db", "sql", "?"],
	botOwnerOnly: true,
	channelType: "all",
	middlewares: [
		new Middleware<AnyMessage>("database", () => ({
			result: util.getDatabaseDriverName()
				? true
				: "No database driver is installed.",
			data: {},
		})),
	],
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

		let result = await database.raw(query)

		result = result.rows ?? result

		const systemMessage = Array.isArray(result)
			? await util.getSystemMessage("success", {
					header: `SQL query done (${result.length} items)`,
					body: await util.limitDataToShow(
						result,
						util.MaxLength.EmbedDescription,
						(data) =>
							discordEval.code.stringify({
								lang: "json",
								format: { printWidth: 50 },
								content: `const result = ${JSON.stringify(data)}`,
							}),
					),
					footer: `Result of : ${query}`,
				})
			: await util.getSystemMessage("success", {
					body: "SQL query done",
					footer: `Query : ${query}`,
				})

		return message.channel.send(systemMessage)
	},
	subs: [
		new Command({
			name: "plan",
			description: "Show database plan",
			botOwnerOnly: true,
			channelType: "all",
			aliases: ["tables", "schema", "list", "view"],
			async run(message) {
				const fields = await Promise.all(
					database.cachedTables.map(
						async (table): Promise<discord.EmbedField> => {
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
												defaultValue ? "?" : ""
											}\``,
									)
									.join("\n"),
								inline: true,
							}
						},
					),
				)

				return message.channel.send({
					embeds: [
						new discord.EmbedBuilder()
							.setTitle("Database plan")
							.setDescription(
								`**${fields.length}** tables, **${fields.reduce(
									(acc, current) => {
										return acc + current.value.split("\n").length
									},
									0,
								)}** columns`,
							)
							.setFields(
								fields.sort((a, b) => {
									return a.value.split("\n").length - b.value.split("\n").length
								}),
							),
					],
				})
			},
		}),
	],
})
