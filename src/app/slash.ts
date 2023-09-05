import discord from "discord.js"
import path from "path"

import * as handler from "@ghom/handler"

export const slashHandler = new handler.Handler(
  process.env.BOT_COMMANDS_PATH ?? path.join(process.cwd(), "dist", "slash")
)

type SlashDeployGuilds = {
  commands: discord.ApplicationCommandData[]
  guildId: string
}

export const slashCommands: SlashCommand<any>[] = []
const slashCommandsForDeployGlobal: discord.ApplicationCommandData[] = []
const slashCommandsForDeployGuilds: SlashDeployGuilds[] = []

slashHandler.on("load", async (filepath: string) => {
  const file = await import("file://" + filepath)
  const item: SlashCommand<any> = file.default

  if (!item.options.guilds) {
    slashCommandsForDeployGlobal.push(item.options.builder)
  } else {
    item.options.guilds.map((guildId) => {
      if (slashCommandsForDeployGuilds.length === 0) {
        slashCommandsForDeployGuilds.push({
          guildId: guildId,
          commands: [item.options.builder],
        })
      } else {
        const existing = slashCommandsForDeployGuilds.find((SDP) => {
          return SDP.guildId === guildId
        })

        if (existing) {
          existing.commands.push(item.options.builder)
        } else {
          slashCommandsForDeployGuilds.push({
            guildId: guildId,
            commands: [item.options.builder],
          })
        }
      }
    })
  }

  return slashCommands.push(item)
})

export const deploySlashCommand = async (client: discord.Client<true>) => {
  await client.application.commands.set(slashCommandsForDeployGlobal)

  await Promise.all(
    slashCommandsForDeployGuilds.map((SDG) => {
      return client.application.commands.set(SDG.commands, SDG.guildId)
    })
  )
}

/**
 * todo: Build context from builder arguments typings
 */
export type SlashCommandArguments<Base extends discord.SlashCommandBuilder> = {
  builder: discord.ApplicationCommandData
  guilds?: string[]
  subs?: SlashCommandSubs<Base>[]
  run: (
    this: SlashCommand<Base>,
    context: discord.CommandInteraction
  ) => unknown
}

export type SlashCommandSubs<Base extends discord.SlashCommandBuilder> = {
  name: string
  run: (
    this: SlashCommand<Base>,
    context: discord.CommandInteraction
  ) => unknown
}

export type SlashCommandContext<
  Base extends discord.SlashCommandBuilder,
  Interaction extends discord.CommandInteraction
> = Interaction & {
  args: SlashCommandArguments<Base>
}

export class SlashCommand<Base extends discord.SlashCommandBuilder> {
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
