// native file, if you want edit it, remove the "native" suffix from the filename

import cp from "node:child_process"

import { Command } from "#core/command"
import * as util from "#core/util"

export default new Command({
	name: "terminal",
	description: "Run shell command from Discord",
	aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
	channelType: "all",
	botOwnerOnly: true,
	cooldown: {
		duration: 5000,
		type: util.CooldownType.Global,
	},
	rest: {
		all: true,
		name: "cmd",
		description: "The cmd to run",
		required: true,
	},
	async run(message) {
		message.triggerCooldown()

		const toEdit = await message.channel.send(
			await util.getSystemMessage(
				"loading",
				{
					header: "The process is running...",
					body: message.rest,
				},
				{
					code: "bash",
				},
			),
		)

		let systemMessage: util.SystemMessage

		try {
			const output = cp.execSync(message.rest, {
				cwd: util.rootPath(),
				encoding: "utf-8",
			})

			systemMessage = await util.getSystemMessage(
				"success",
				{
					header: "The process is done",
					body:
						output
							.split("")
							.reverse()
							.slice(0, 2000)
							.reverse()
							.join("")
							.trim() || "void",
				},
				{ code: "js" },
			)
		} catch (error: any) {
			systemMessage = await util.getSystemMessage(
				"error",
				{
					header: "The process is errored",
					body: error,
				},
				{ stack: true },
			)
		}

		toEdit.edit(systemMessage).catch(() => {
			message.channel.send(systemMessage).catch()
		})
	},
})
