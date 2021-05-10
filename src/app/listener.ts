import discord from "discord.js"
import path from "path"

import * as handler from "./handler"

export const listenerHandler = new handler.Handler(
  process.env.LISTENERS_PATH ?? path.join(process.cwd(), "dist", "listeners")
)

export type Listener<EventName extends keyof discord.ClientEvents> = {
  event: EventName
  run: (...args: discord.ClientEvents[EventName]) => unknown
  once?: boolean
}
