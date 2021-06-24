import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import apiTypes from "discord-api-types/v8"

import * as logger from "./logger"
import * as handler from "./handler"

export const listenerHandler = new handler.Handler(
  process.env.BOT_LISTENERS_PATH ??
    path.join(process.cwd(), "dist", "listeners")
)

listenerHandler.once("finish", (pathList, client) => {
  pathList.forEach((filepath) => {
    const listener = require(filepath)
    client[listener.once ? "once" : "on"](
      listener.event,
      listener.run.bind(client)
    )
    logger.log(
      `loaded listener ${chalk.yellow(
        listener.once ? "once" : "on"
      )} ${chalk.blueBright(listener.event)}`,
      "handler"
    )
  })
})

export type Packet = apiTypes.GatewayDispatchPayload

export type Listener<
  EventName extends keyof (discord.ClientEvents & { raw: [Packet] })
> = {
  event: EventName
  run: (
    this: discord.Client,
    ...args: (discord.ClientEvents & { raw: [Packet] })[EventName]
  ) => unknown
  once?: boolean
}
