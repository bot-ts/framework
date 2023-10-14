// system file, please don't modify it

import discord from "discord.js"

export const client = new discord.Client({
  intents: process.env.BOT_INTENTS
    ? process.env.BOT_INTENTS.split(/[;|.,\s+]+/).map(
        (intent) => discord.Intents.FLAGS[intent as discord.IntentsString]
      )
    : [],
})

export default client
