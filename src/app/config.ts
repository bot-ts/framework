// system file, please don't modify it

import type * as discord from "discord.js"
import type * as command from "./command.js"

export interface Config {
  ignoreBots: boolean
  getPrefix: (message: command.NormalMessage) => Promise<string>
  client: discord.ClientOptions
}
