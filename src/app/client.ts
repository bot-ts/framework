import Discord from "discord.js"

const client = new Discord.Client()

client.login(process.env.TOKEN).catch(console.error)

export default client
