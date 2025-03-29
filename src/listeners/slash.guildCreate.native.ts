// system file, please don't modify it

import env from "#core/env"
import { Listener } from "#core/listener"
import * as slash from "#core/slash"

export default new Listener({
	event: "guildCreate",
	description: "Deploy the slash commands to the new guild",
	async run(guild) {
		if (env.BOT_GUILD !== guild.id) return
		return slash.registerSlashCommands(guild.client, guild.id)
	},
})
