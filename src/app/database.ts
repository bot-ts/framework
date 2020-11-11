import Enmap from "enmap"
import Discord from "discord.js"

/** Enmap<Guild, Prefix> */
export const prefixes = new Enmap<Discord.Snowflake, string>({
  name: "prefixes",
})

// /** Enmap<Guild, Member[]> */
// export const muted = new Enmap<Discord.Snowflake, Discord.Snowflake[]>({
//  name: "muted"
// })
