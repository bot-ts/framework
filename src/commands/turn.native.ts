// native file, if you want edit it, remove the "native" suffix from the filename

import { Command } from "#core/command"
import * as util from "#core/util"

export default new Command({
	name: "turn",
	description: "Turn on/off command handling",
	aliases: ["power"],
	channelType: "all",
	botOwnerOnly: true,
	positional: [
		{
			name: "activated",
			description: "Is command handling activated",
			default: () => !util.cache.ensure<boolean>("turn", true),
			type: "boolean",
		},
	],
	async run(message) {
		util.cache.set("turn", message.args.activated)
		return message.channel.send(
			`${util.getSystemEmoji("success")} Command handling ${
				message.args.activated ? "activated" : "disabled"
			} `,
		)
	},
})
