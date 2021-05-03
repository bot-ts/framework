import * as app from "../app"

import guilds from "../tables/guilds.native"

const listener: app.Listener<"guildDelete"> = {
  event: "guildDelete",
  async run(guild) {
    await guilds.query.delete().where("id", guild.id)
  },
}

module.exports = listener
