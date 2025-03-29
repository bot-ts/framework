// system file, please don't modify it

import config from "#config"
import * as command from "#core/command"
import env from "#core/env"
import { Listener } from "#core/listener"
import logger from "#core/logger"
import * as util from "#core/util"

import yargsParser from "yargs-parser"

export default new Listener({
	event: "messageCreate",
	description: "Handle the messages for commands",
	async run(message) {
		if (config.ignoreBots && message.author.bot) return

		if (!command.isAnyMessage(message)) return

		const prefix = config.getPrefix
			? await config.getPrefix(message)
			: env.BOT_PREFIX

		if (new RegExp(`^<@!?${message.client.user.id}>$`).test(message.content))
			return message.channel
				.send(
					await util.getSystemMessage("default", `My prefix is \`${prefix}\``),
				)
				.catch()

		message.usedAsDefault = false
		message.isFromBotOwner = message.author.id === env.BOT_OWNER

		util.emitMessage(message.channel, message)
		util.emitMessage(message.author, message)

		if (command.isGuildMessage(message)) {
			message.isFromGuildOwner =
				message.isFromBotOwner || message.guild.ownerId === message.author.id

			util.emitMessage(message.guild, message)
			util.emitMessage(message.member, message)
		}

		let dynamicContent = message.content

		const cut = (key: string) => {
			dynamicContent = dynamicContent.slice(key.length).trim()
		}

		const mentionRegex = new RegExp(`^(<@!?${message.client.user.id}>) ?`)

		if (dynamicContent.startsWith(prefix)) {
			message.usedPrefix = prefix
			cut(prefix)
		} else if (mentionRegex.test(dynamicContent)) {
			const [match, used] = mentionRegex.exec(dynamicContent) as RegExpExecArray
			message.usedPrefix = `${used} `
			cut(match)
		} else if (command.isDirectMessage(message)) {
			message.usedPrefix = ""
		} else return

		let key = dynamicContent.split(/\s+/)[0]

		// turn ON/OFF
		if (
			key !== "turn" &&
			!util.cache.ensure<boolean>("turn", true) &&
			message.author.id !== env.BOT_OWNER
		)
			return

		let cmd = command.commands.resolve(key)

		if (!cmd) {
			if (command.defaultCommand) {
				key = ""
				cmd = command.defaultCommand
				message.usedAsDefault = true
			} else return null
		}

		// check sub commands
		{
			let cursor = 0
			let depth = 0

			while (cmd.options.subs && cursor < cmd.options.subs.length) {
				const subKey = dynamicContent.split(/\s+/)[depth + 1]

				for (const sub of cmd.options.subs) {
					if (sub.options.name === subKey) {
						key += ` ${subKey}`
						cursor = 0
						cmd = sub
						depth++
						break
					}

					if (sub.options.aliases) {
						let found = false

						for (const alias of sub.options.aliases) {
							if (alias === subKey) {
								key += ` ${subKey}`
								cursor = 0
								cmd = sub
								depth++
								found = true
								break
							}
						}

						if (found) break
					}

					cursor++
				}
			}
		}

		cut(key.trim())

		const baseContent = dynamicContent

		// parse CommandMessage arguments
		const parsedArgs = yargsParser(dynamicContent)
		const restPositional = (parsedArgs._?.slice() ?? []).map(String)

		message.args = restPositional.map((positional) => {
			if (/^(?:".+"|'.+')$/.test(positional))
				return positional.slice(1, positional.length - 1)
			return positional
		})

		// handle help argument
		if (parsedArgs.help || parsedArgs.h)
			return command.sendCommandDetails(message, cmd)

		// prepare command
		const prepared = await command.prepareCommand(message, cmd, {
			restPositional,
			baseContent,
			parsedArgs,
			key,
		})

		if (typeof prepared !== "boolean")
			return message.channel
				.send({ ...prepared, allowedMentions: { parse: [] } })
				.catch()

		if (!prepared) return

		try {
			await cmd.options.run.bind(cmd)(message)
		} catch (error: any) {
			logger.error(error, cmd.filepath!, true)

			message.channel
				.send(await util.getSystemMessage("error", error))
				.catch((error) => {
					logger.error(error, cmd!.filepath!, true)
				})
		}
	},
})
