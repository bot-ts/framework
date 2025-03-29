// native file, if you want edit it, remove the "native" suffix from the filename

import * as discordEval from "discord-eval.ts"
import discord from "discord.js"

import { Command } from "#core/command"
import * as util from "#core/util"

export default new Command({
	name: "eval",
	description: "JS code evaluator",
	channelType: "all",
	botOwnerOnly: true,
	aliases: ["js", "code", "run", "="],
	rest: {
		name: "code",
		description: "The evaluated code",
		required: true,
	},
	flags: [
		{
			name: "muted",
			flag: "m",
			description: "Disable message feedback",
			aliases: ["mute"],
		},
		{
			name: "verbose",
			flag: "v",
			aliases: ["info", "information"],
			description: "Information about output",
		},
	],
	async run(message) {
		const embed = await discordEval.evaluate(
			message.args.code,
			{
				ctx: { message },
				muted: message.args.muted,
				verbose: message.args.verbose,
			},
			{
				success: new discord.EmbedBuilder().setColor(util.systemColors.success),
				error: new discord.EmbedBuilder().setColor(util.systemColors.error),
			},
		)

		await message.channel.send({
			embeds: [embed],
		})
	},
})
