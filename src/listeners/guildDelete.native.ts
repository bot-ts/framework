import * as app from "../app.js"

import guilds from "../tables/guilds.native.js"

const listener: app.Listener<"guildDelete"> = {
  event: "guildDelete",
  description: "Remove guild from db",
  async run(guild) {
    await guilds.query.delete().where("id", guild.id)
  },
}

export default listener
