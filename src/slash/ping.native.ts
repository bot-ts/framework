// system file, please don't modify it

import discord from "discord.js"
import client from "#core/client"
import { SlashCommand } from "#core/slash"

export default new SlashCommand({
	name: "ping",
	description: "Get the bot ping",
	run(interaction) {
		return interaction.reply({
			content: `Pong! \`${client.ws.ping}ms\``,
			flags: discord.MessageFlags.Ephemeral,
		})
	},
})
