// native file, if you want edit it, remove the "native" suffix from the filename

import * as command from "#core/command"
import { StaticPaginator } from "#core/pagination"
import * as util from "#core/util"

export default new command.Command({
	name: "help",
	description: "Help menu",
	longDescription: "Show command details or list all commands",
	channelType: "all",
	aliases: ["h", "usage", "detail", "details"],
	positional: [
		{
			name: "command",
			type: "command",
			description: "The target command name.",
		},
	],
	async run(message) {
		if (message.args.command) {
			const cmd = message.args.command

			if (cmd) return command.sendCommandDetails(message, cmd)

			await message.channel.send(
				await util.getSystemMessage(
					"error",
					`Unknown command "${message.args.command}"`,
				),
			)
		} else {
			new StaticPaginator({
				pages: await util.divider(
					(
						await Promise.all(
							command.commands.map(async (cmd) => {
								const prepared = await command.prepareCommand(message, cmd)
								if (prepared !== true) return ""
								return command.commandToListItem(message, cmd)
							}),
						)
					).filter((line) => line.length > 0),
					10,
					(page) => {
						return util.getSystemMessage("default", {
							header: "Command list",
							body: page.join("\n"),
							footer: `${message.usedPrefix}help <command>`,
						})
					},
				),
				filter: (reaction, user) => user.id === message.author.id,
				target: message.channel,
			})
		}
	},
})
