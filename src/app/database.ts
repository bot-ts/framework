import Enmap from "enmap"
import Discord from "discord.js"
import ColorEngine from "color-engine"

export interface ColorVector {
  role?: Discord.Snowflake
  percent?: number
  hexCode: ColorEngine.HexCode
}

export interface GuildConfig {
  ignoredRoles: Discord.Snowflake[]
  allowedRoles: Discord.Snowflake[]
}

export interface ColorConfig extends GuildConfig {
  vectors: ColorVector[]
}

export const prefixes = new Enmap<Discord.Snowflake, string>({
  name: "prefixes",
})
export const colors = new Enmap<Discord.Snowflake, ColorConfig[]>({
  name: "colors",
})
export const guilds = new Enmap<Discord.Snowflake, GuildConfig[]>({
  name: "guilds",
})
