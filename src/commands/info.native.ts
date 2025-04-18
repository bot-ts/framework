// native file, if you want edit it, remove the "native" suffix from the filename

import fs from "node:fs"
import * as discordEval from "discord-eval.ts"
import discord from "discord.js"
import time from "tims"
import config from "#config"
import { Command } from "#core/command"
import env from "#core/env"
import * as util from "#core/util"

export default new Command({
	name: "info",
	description: "Get information about bot",
	flags: [
		{
			name: "dependencies",
			description: "Show dependencies",
			aliases: ["deps", "all"],
			flag: "d",
		},
	],
	async run(message) {
		const databaseClient = util.getDatabaseDriverName()

		const gitURL = config.openSource ? await util.getGitURL() : undefined

		let fundingURL: string | null = null

		try {
			const fundingFile = await fs.promises.readFile(
				util.rootPath(".github", "funding.yml"),
				"utf-8",
			)

			const match = /buy_me_a_coffee: (.+)\n?/.exec(fundingFile)

			if (match) fundingURL = `https://buymeacoffee.com/${match[1]}`
		} catch {}

		const embed = new discord.EmbedBuilder()
			.setAuthor({
				name: `Information about ${message.client.user.tag}`,
				iconURL: message.client.user?.displayAvatarURL(),
				url: gitURL,
			})
			.setDescription(util.packageJSON.description ?? "No description")
			.setTimestamp()
			.addFields(
				{
					name: util.packageJSON.name,
					value: await discordEval.code.stringify({
						lang: "yml",
						content: [
							`author: ${
								message.client.users.resolve(env.BOT_OWNER)!.username
							}`,
							`uptime: ${time.duration(util.uptime(), {
								format: "second",
								maxPartCount: 2,
							})}`,
							`memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
								2,
							)}mb`,
							`ping: ${message.client.ws.ping}ms`,
							`database: ${databaseClient}@${
								util.packageJSON.dependencies?.[databaseClient] ?? "unknown"
							}`,
							`${env.RUNTIME}: ${
								typeof Bun !== "undefined"
									? Bun.version
									: typeof Deno !== "undefined"
										? Deno.version.deno
										: process.version
							}`,
						].join("\n"),
					}),
					inline: true,
				},
				{
					name: "Cache",
					value: await discordEval.code.stringify({
						lang: "yml",
						content: [
							`guilds: ${message.client.guilds.cache.size}`,
							`users: ${message.client.users.cache.size}`,
							`members: ${message.client.guilds.cache.reduce((acc, guild) => {
								return acc + guild.members.cache.size
							}, 0)}`,
							`channels: ${message.client.channels.cache.size}`,
							`roles: ${message.client.guilds.cache.reduce((acc, guild) => {
								return acc + guild.roles.cache.size
							}, 0)}`,
							`messages: ${message.client.channels.cache.reduce(
								(acc, channel) => {
									return (
										acc +
										(channel.isTextBased() ? channel.messages.cache.size : 0)
									)
								},
								0,
							)}`,
						].join("\n"),
					}),
					inline: true,
				},
			)

		if (message.args.dependencies)
			embed.addFields(
				{
					name: util.blankChar,
					value: util.blankChar,
					inline: false,
				},
				{
					name: "Dependencies",
					value:
						util.packageJSON.dependencies &&
						Object.keys(util.packageJSON.dependencies).length > 0
							? await discordEval.code.stringify({
									lang: "yml",
									content: Object.entries(util.packageJSON.dependencies)
										.map(([name, version]) => {
											return `${name.replace(/@/g, "")}: ${version}`
										})
										.join("\n"),
								})
							: "No dependencies",
					inline: true,
				},
				{
					name: "Dev dependencies",
					value:
						util.packageJSON.devDependencies &&
						Object.keys(util.packageJSON.devDependencies).length > 0
							? await discordEval.code.stringify({
									lang: "yml",
									content: Object.entries(util.packageJSON.devDependencies)
										.map(([name, version]) => {
											return `${name.replace(/@/g, "")}: ${version}`
										})
										.join("\n"),
								})
							: "No dev dependencies",
					inline: true,
				},
			)

		const row =
			new discord.ActionRowBuilder<discord.MessageActionRowComponentBuilder>()

		if (gitURL) {
			row.addComponents(
				new discord.ButtonBuilder()
					.setLabel("View source")
					.setStyle(discord.ButtonStyle.Link)
					.setURL(gitURL),
			)
		}

		if (fundingURL) {
			row.addComponents(
				new discord.ButtonBuilder()
					.setLabel("Fund me")
					.setEmoji("💖")
					.setStyle(discord.ButtonStyle.Link)
					.setURL(fundingURL),
			)
		}

		return message.channel.send({
			embeds: [embed],
			components: gitURL || fundingURL ? [row] : undefined,
		})
	},
})
