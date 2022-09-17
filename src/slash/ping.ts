import * as app from "../app.js"

export default new app.SlashCommand({
    builder: {
        name: "ping",
        description: "Command reply pong"
    },
    deploy: {
        global: false,
        guilds: ["781105165754433537"]
    },
    run: (context) => {
        context.reply("🏓 Pong")
    }
})