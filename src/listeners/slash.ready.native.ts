// system file, please don't modify it

import env from "#core/env.ts"
import { Listener } from "#core/listener.ts"
import * as slash from "#core/slash.ts"

export default new Listener({
  event: "ready",
  description: "Deploy the slash commands",
  once: true,
  async run(client) {
    if (env.BOT_GUILD) return slash.registerSlashCommands(client, env.BOT_GUILD)
    return slash.registerSlashCommands(client)
  },
})
