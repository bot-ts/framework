import discord from "discord.js"
import path from "path"

import * as handler from "@ghom/handler"

import { REST } from "@discordjs/rest"
import { SlashCommandBuilder } from "@discordjs/builders"

export const slashHandler = new handler.Handler(
  process.env.BOT_COMMANDS_PATH ?? path.join(process.cwd(), "dist", "slash")
)

type SlashDeployGuilds = {
  commands: discord.ApplicationCommandData[]
  guildId: string
}

const guildIdExist = (guildId: string, tab: SlashDeployGuilds[]) => {
  return tab.some((item) => guildId in item)
}

slashHandler.on("load", async (filepath: string) => {
  const file = await import("file://" + filepath)
  const item: SlashCommand<any> = file.default
  if (item.options.deploy.global) {
    slashCommandsForDeployGlobal.push(item.options.builder)
  } else {
    item.options.deploy.guilds?.map((guildId) => {
      slashCommandsForDeployGuilds.map((cmds) => {
        if (guildIdExist(guildId, slashCommandsForDeployGuilds)) {
          cmds.commands.push(item.options.builder)
        } else {
          slashCommandsForDeployGuilds.push({
            guildId: guildId,
            commands: [item.options.builder],
          })
        }
      })
    })
  }
  return slashCommands.push(item)
})

export const slashCommands: SlashCommand<any>[] = []
const slashCommandsForDeployGlobal: discord.ApplicationCommandData[] = []
const slashCommandsForDeployGuilds: SlashDeployGuilds[] = []

export const rest = new REST({ version: "9" }).setToken(
  process.env.BOT_TOKEN as string
)

export const deploySlashCommand = async (client: discord.Client<true>) => {
  client.application.commands.set(slashCommandsForDeployGlobal)
  slashCommandsForDeployGuilds.map((cmds) => {
    client.application.commands.set(cmds.commands, cmds.guildId)
  })
}

/**
 * todo: Build context from builder arguments typings
 */
export type SlashCommandArguments<Base extends SlashCommandBuilder> = {
  builder: discord.ApplicationCommandData
  deploy: { global: boolean; guilds?: string[] }
  subs?: SlashCommandSubs<Base>[]
  run: (
    this: SlashCommand<Base>,
    context: discord.CommandInteraction
  ) => unknown
}

export type SlashCommandSubs<Base extends SlashCommandBuilder> = {
  name: string
  run: (
    this: SlashCommand<Base>,
    context: discord.CommandInteraction
  ) => unknown
}

export type SlashCommandContext<
  Base extends SlashCommandBuilder,
  Interaction extends discord.CommandInteraction
> = Interaction & {
  args: SlashCommandArguments<Base>
}

export class SlashCommand<Base extends SlashCommandBuilder> {
  /**
   * @deprecated
   */
  public filepath = ""

  /**
   * @deprecated
   */
  public native = false

  constructor(public readonly options: SlashCommandArguments<Base>) {}

  run(context: SlashCommandContext<Base, any>) {
    this.options.run.bind(this)(context)
  }
}
