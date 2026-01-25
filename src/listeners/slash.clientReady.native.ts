// system file, please don't modify it

import env from "#core/env"
import { Listener } from "#core/listener"
import * as slash from "#core/slash"

export default new Listener({
	event: "clientReady",
	description: "Deploy the slash commands",
	once: true,
	async run(client) {
		if (env.BOT_GUILD) return slash.registerSlashCommands(client, env.BOT_GUILD)
		return slash.registerSlashCommands(client)
	},
})
