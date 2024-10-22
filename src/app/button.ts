import * as handler from "@ghom/handler"

import path from "path"
import url from "url"
import discord from "discord.js"

import * as util from "./util.ts"

import env from "#env"
import * as logger from "#logger"

export const buttonHandler = new handler.Handler<IButton>(
  path.join(process.cwd(), "dist", "buttons"),
  {
    pattern: /\.js$/,
    loader: async (filepath) => {
      const file = await import(url.pathToFileURL(filepath).href)
      return file.default as IButton
    },
    onLoad: async (filepath, button) => {
      button.native = filepath.endsWith(".native.js")
      button.filepath = filepath
      buttons.add(button)
    },
  },
)

export const buttons = new (class ButtonCollection extends discord.Collection<
  string,
  IButton
> {
  add(button: IButton): this {
    this.validate(button)
    return super.set(button.options.key, button)
  }

  validate(button: IButton): void | never {
    if (this.has(button.options.key)) {
      throw new Error(`Button key "${button.options.key}" is not unique.`)
    }

    util.validateCooldown(
      button.options.cooldown,
      button.options.run,
      button.options.key,
    )

    logger.log(
      `loaded button ${util.styleText("blueBright", button.options.key)}${
        button.native ? ` ${util.styleText("green", "native")}` : ""
      } ${util.styleText("grey", button.options.description)}`,
    )
  }
})()

export interface IButton {
  options: {
    key: string
    description: string
    guildOnly?: boolean
    adminOnly?: boolean
    botOwnerOnly?: boolean
    cooldown?: util.Cooldown
    builder?: (button: discord.ButtonBuilder, ...params: any[]) => unknown
    run: (interaction: ButtonSystemInteraction, ...params: any[]) => unknown
  }
  filepath?: string
  native: boolean
  create(...params: any[]): discord.ButtonBuilder
}

/**
 * The parameters that the button will receive.
 * @example
 * ```ts
 * export type BuyButtonParams = [article: string, quantity: number]
 * ```
 */
export type ButtonParams = (string | number | boolean)[]

export interface ButtonOptions<Params extends ButtonParams> {
  key: string
  description: string
  builder?: (button: discord.ButtonBuilder, ...params: Params) => unknown
  run: (
    this: ButtonOptions<Params>,
    interaction: ButtonSystemInteraction,
    ...params: Params
  ) => unknown
}

/**
 * Represents a button handler. <br>
 * See the {@link https://ghom.gitbook.io/bot.ts/usage/create-a-button guide} for more information.
 */
export class Button<Params extends ButtonParams> {
  filepath?: string
  native = false

  constructor(public options: ButtonOptions<Params>) {}

  public create(...params: Params): discord.ButtonBuilder {
    return createButton(this, ...params)
  }
}

export function decodeButtonCustomId(
  customId: string,
): [string, ...ButtonParams] {
  return customId.split(";").map(decodeURIComponent) as [
    string,
    ...ButtonParams,
  ]
}

export function encodeButtonCustomId(
  key: string,
  ...params: ButtonParams
): string {
  return `${key};${params.map(encodeURIComponent).join(";")}`
}

export function createButton<Params extends ButtonParams>(
  handler: Button<Params>,
  ...params: Params
): discord.ButtonBuilder {
  const button = new discord.ButtonBuilder()
    .setCustomId(encodeButtonCustomId(handler.options.key, ...params))
    .setStyle(discord.ButtonStyle.Primary)
    .setLabel(handler.options.key)

  handler.options.builder?.(button, ...params)

  return button
}

export async function prepareButton(
  interaction: ButtonSystemInteraction,
  button: IButton,
): Promise<util.SystemMessage | void> {
  const error = await util.checkCooldown(
    button.options.cooldown,
    `${button.options.key} button`,
    {
      author: interaction.user,
      channel: interaction.channel,
      guild: interaction.guild,
    },
    interaction,
  )

  if (error) return error

  if (interaction.guild) {
    if (
      button.options.adminOnly &&
      !(
        await interaction.guild.members.fetch(interaction.user)
      )?.permissions.has("Administrator")
    ) {
      return util.getSystemMessage(
        "error",
        "You need to be an administrator to use this button.",
      )
    }
  } else {
    if (button.options.guildOnly) {
      return util.getSystemMessage(
        "error",
        "This button is only available in a guild.",
      )
    }
  }

  if (button.options.botOwnerOnly && interaction.user.id !== env.BOT_OWNER) {
    return util.getSystemMessage(
      "error",
      "This button is only available to the bot owner.",
    )
  }
}

export type ButtonSystemInteraction =
  discord.ButtonInteraction<discord.CacheType> & {
    triggerCooldown: () => void
  }
