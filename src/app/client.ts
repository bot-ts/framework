// system file, please don't modify it

import discord from "discord.js"
import { config } from "../config.js"

export const client = new discord.Client(config.client)

export default client
