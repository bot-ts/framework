import Discord from "discord.js"
import path from "path"
import tims from "tims"
import chalk from "chalk"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"

import * as app from "../app"

export type CommandMessage = Discord.Message & {
  args: PartialBy<yargsParser.Arguments, "_">
  positional: any[] & {
    [name: string]: any
  }
  rest: string
}

export type GuildMessage = CommandMessage & {
  channel: Discord.TextChannel & Discord.GuildChannel
  guild: Discord.Guild
  member: Discord.GuildMember
}

export type DirectMessage = CommandMessage & {
  channel: Discord.DMChannel
}

export interface Argument<Message extends CommandMessage> {
  name: string
  flag?: string
  isFlag?: boolean
  aliases?: string[] | string
  default?: string | ((message: Message) => string | Promise<string>)
  required?: boolean
  castValue?:
    | "number"
    | "date"
    | "json"
    | "boolean"
    | "regex"
    | "array"
    | ((value: string, message: Message) => unknown)
  checkValue?:
    | RegExp
    | ((value: string, message: Message) => boolean | Promise<boolean>)
  description?: string
}

export interface Positional<Message extends CommandMessage>
  extends Omit<Argument<Message>, "isFlag" | "aliases" | "flag"> {}

export interface Command<Message extends CommandMessage = CommandMessage> {
  name: string
  aliases?: string[]
  /**
   * Cool down of command (in ms)
   */
  coolDown?: number
  /**
   * Short description displayed in help menu
   */
  description?: string
  /**
   * Description displayed in command detail
   */
  longDescription?: string
  examples?: string[]
  guildOwner?: boolean
  guildOnly?: boolean
  botOwner?: boolean
  dmOnly?: boolean
  userPermissions?: Discord.PermissionString[]
  botPermissions?: Discord.PermissionString[]
  /**
   * Yargs positional
   */
  positional?: Positional<Message>[]
  /**
   * Yargs arguments (e.g. `--myArgument`)
   */
  args?: Argument<Message>[]
  run: (message: Message) => unknown
  /**
   * Sub-commands
   */
  subs?: Command<Message>[]
  /**
   * This path is automatically setup on bot running.
   */
  path?: string
}

export type Listener<EventName extends keyof Discord.ClientEvents> = {
  event: EventName
  run: (...args: Discord.ClientEvents[EventName]) => unknown
  once?: boolean
}

export class Commands extends Discord.Collection<string, Command<any>> {
  public resolve<Message extends CommandMessage>(
    key: string
  ): Command<Message> | undefined {
    return this.find((command) => {
      return (
        key === command.name ||
        !!command.aliases?.some((alias) => key === alias)
      )
    })
  }

  public add<Message extends CommandMessage>(command: Command<Message>) {
    validateArguments(command)
    this.set(command.name, command)
  }
}

export async function checkValue<Message extends CommandMessage>(
  subject: Pick<Argument<Message>, "checkValue" | "name">,
  subjectType: "positional" | "argument",
  value: string,
  message: Message
): Promise<boolean> {
  if (!subject.checkValue) return true

  if (
    typeof subject.checkValue === "function"
      ? !(await subject.checkValue(value, message))
      : !subject.checkValue.test(value)
  ) {
    await message.channel.send(
      new app.MessageEmbed()
        .setColor("RED")
        .setAuthor(
          `Bad ${subjectType} ${
            typeof subject.checkValue === "function" ? "tested " : "pattern"
          } "${subject.name}".`,
          message.client.user?.displayAvatarURL()
        )
        .setDescription(
          typeof subject.checkValue === "function"
            ? app.CODE.stringify({
                content: app.CODE.format(subject.checkValue.toString()),
                lang: "js",
              })
            : `Expected pattern: \`${subject.checkValue.source}\``
        )
    )

    return false
  }
  return true
}

export async function castValue<Message extends CommandMessage>(
  subject: Pick<Argument<Message>, "castValue" | "name">,
  subjectType: "positional" | "argument",
  baseValue: string | undefined,
  message: Message,
  setValue: (value: any) => unknown
): Promise<boolean> {
  if (!subject.castValue) return true

  const empty = new Error("The value is empty!")

  try {
    switch (subject.castValue) {
      case "boolean":
        setValue(/true|1|oui|on|o|y|yes/i.test(baseValue ?? ""))
        break
      case "date":
        if (!baseValue) {
          throw empty
        } else if (baseValue === "now") {
          setValue(new Date())
        } else if (/^[1-9]\d*$/.test(baseValue)) {
          setValue(Number(baseValue))
        } else {
          setValue(new Date(baseValue))
        }
        break
      case "json":
        if (baseValue) setValue(JSON.parse(baseValue))
        else throw empty
        break
      case "number":
        setValue(Number(baseValue))
        if (!/-?(?:0|[1-9]\d*)/.test(baseValue ?? ""))
          throw new Error("The value is not a Number!")
        break
      case "regex":
        if (baseValue) setValue(regexParser(baseValue))
        else throw empty
        break
      case "array":
        if (baseValue === undefined) setValue([])
        else setValue(baseValue.split(/[,;|]/))
        break
      default:
        if (baseValue === undefined) throw empty
        else setValue(await subject.castValue(baseValue, message))
        break
    }
  } catch (error) {
    await message.channel.send(
      new app.MessageEmbed()
        .setColor("RED")
        .setAuthor(
          `Bad ${subjectType} type "${subject.name}".`,
          message.client.user?.displayAvatarURL()
        )
        .setDescription(
          `Cannot cast the value of the "${subject.name}" ${subjectType} to ${
            typeof subject.castValue === "function"
              ? "{*custom type*}"
              : "`" + subject.castValue + "`"
          }\n${app.CODE.stringify({
            content: `Error: ${error.message}`,
            lang: "js",
          })}`
        )
    )

    return false
  }
  return true
}

export function validateArguments<Message extends CommandMessage>(
  command: Command<Message>,
  path?: string
): void | never {
  const help: Argument<Message> = {
    name: "help",
    flag: "h",
    isFlag: true,
    description: "Get help from the command",
  }
  command.path = path

  if (!command.args) command.args = [help]
  else command.args.push(help)

  for (const arg of command.args)
    if (arg.isFlag && arg.flag)
      if (arg.flag.length !== 1)
        throw new Error(
          `The "${arg.name}" flag length of "${
            path ? path + " " + command.name : command.name
          }" command must be equal to 1`
        )

  app.log(
    `loaded command ${chalk.blue((path ? path + " " : "") + command.name)}`,
    "handler"
  )

  if (command.subs)
    for (const sub of command.subs)
      validateArguments(sub, path ? path + " " + command.name : command.name)
}

export async function sendCommandDetails<Message extends CommandMessage>(
  message: Message,
  cmd: Command<Message>,
  prefix: string
): Promise<void> {
  let pattern = `${prefix}${cmd.path ? cmd.path + " " : ""}${cmd.name}`

  const positionalList: string[] = []
  const argumentList: string[] = []
  const flagList: string[] = []

  if (cmd.positional) {
    for (const positional of cmd.positional) {
      const dft =
        positional.default !== undefined
          ? `="${await app.scrap(positional.default, message)}"`
          : ""
      positionalList.push(
        positional.required && !dft
          ? `<${positional.name}>`
          : `[${positional.name}${dft}]`
      )
    }
  }

  if (cmd.args) {
    for (const arg of cmd.args) {
      if (arg.isFlag) {
        flagList.push(`[-${arg.flag ?? `-${arg.name}`}]`)
      } else {
        const dft =
          arg.default !== undefined
            ? `="${app.scrap(arg.default, message)}"`
            : ""
        argumentList.push(
          arg.required
            ? `--${arg.name}${dft}`
            : `--${arg.name}${dft || "=null"}`
        )
      }
    }
  }

  const specialPermissions = []

  if (cmd.botOwner) specialPermissions.push("BOT_OWNER")
  if (cmd.guildOwner) specialPermissions.push("GUILD_OWNER")

  const embed = new app.MessageEmbed()
    .setColor("BLURPLE")
    .setAuthor("Command details", message.client.user?.displayAvatarURL())
    .setTitle(`${pattern} ${[...positionalList, ...flagList].join(" ")}`)
    .setDescription(cmd.longDescription ?? cmd.description ?? "no description")

  if (cmd.aliases)
    embed.addField(
      "aliases",
      cmd.aliases.map((alias) => `\`${alias}\``).join(", "),
      true
    )

  if (argumentList.length > 0)
    embed.addField(
      "options",
      app.CODE.stringify({ content: argumentList.join(" "), lang: "shell" }),
      false
    )

  if (cmd.examples)
    embed.addField(
      "examples:",
      app.CODE.stringify({
        content: cmd.examples.map((example) => prefix + example).join("\n"),
      }),
      false
    )

  if (cmd.botPermissions)
    embed.addField("bot permissions", cmd.botPermissions.join(", "), true)

  if (cmd.userPermissions)
    embed.addField("user permissions", cmd.userPermissions.join(", "), true)

  if (specialPermissions.length > 0)
    embed.addField("special permissions", specialPermissions.join(", "), true)

  if (cmd.coolDown)
    embed.addField("cool down", tims.duration(cmd.coolDown), true)

  if (cmd.subs)
    embed.addField(
      "sub commands:",
      cmd.subs
        .map((sub) => `**${sub.name}**: ${sub.description ?? "no description"}`)
        .join("\n"),
      true
    )

  await message.channel.send(embed)
}

export function isCommandMessage(
  message: Discord.Message
): message is CommandMessage {
  return !message.system && !!message.channel
}

export function isGuildMessage(
  message: CommandMessage
): message is GuildMessage {
  return !!message.guild && message.channel instanceof Discord.GuildChannel
}

export function isDirectMessage(
  message: CommandMessage
): message is DirectMessage {
  return message.channel instanceof Discord.DMChannel
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export const commands = new Commands()

export const commandsPath =
  process.env.COMMANDS_PATH ?? path.join(__dirname, "..", "commands")
export const listenersPath =
  process.env.LISTENERS_PATH ?? path.join(__dirname, "..", "listeners")
