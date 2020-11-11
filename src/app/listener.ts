import Discord from "discord.js"
import path from "path"

export type Listener<EventName extends keyof Discord.ClientEvents> = {
  event: EventName
  call: (...args: Discord.ClientEvents[EventName]) => unknown
  once?: boolean
}

export const listenersPath =
  process.env.LISTENERS_PATH ?? path.join(__dirname, "..", "listeners")
