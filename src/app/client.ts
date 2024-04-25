// system file, please don't modify it

import discord from "discord.js"
import * as config from "./config.js"

export class ClientSingleton {
  private static instance: discord.Client

  private constructor() {}

  static get(): discord.Client {
    if (!ClientSingleton.instance) {
      ClientSingleton.instance = new discord.Client(config.getConfig().client)
    }
    return ClientSingleton.instance
  }
}
