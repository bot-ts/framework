import Discord from "discord.js"
import path from "path"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"
import * as app from "../app"

export interface Argument {
  name: string
  flag?: boolean
  aliases?: string[] | string
  default?: string | ((message: CommandMessage) => string | Promise<string>)
  required?: boolean
  castValue?:
    | "number"
    | "date"
    | "json"
    | "boolean"
    | "regex"
    | "array"
    | ((value: string, message: CommandMessage) => unknown)
  checkValue?:
    | RegExp
    | ((value: string, message: CommandMessage) => boolean | Promise<boolean>)
  description?: string
}

export interface Positional extends Omit<Argument, "flag" | "aliases"> {}

export async function checkValue(
  subject: Pick<Argument, "checkValue" | "name">,
  subjectType: "positional" | "argument",
  value: string,
  message: CommandMessage
): Promise<unknown> {
  if (!subject.checkValue) return

  if (
    typeof subject.checkValue === "function"
      ? !(await subject.checkValue(value, message))
      : !subject.checkValue.test(value)
  ) {
    return await message.channel.send(
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
            ? app.toCodeBlock(subject.checkValue.toString(), "js")
            : `Expected pattern: \`${subject.checkValue.source}\``
        )
    )
  }
}

export async function castValue(
  subject: Pick<Argument, "castValue" | "name">,
  subjectType: "positional" | "argument",
  baseValue: string | undefined,
  message: CommandMessage,
  setValue: (value: any) => unknown
): Promise<unknown> {
  if (!subject.castValue) return

  const empty = new Error("The value is empty!")

  try {
    switch (subject.castValue) {
      case "boolean":
        setValue(Boolean(baseValue))
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
        if (Number.isNaN(baseValue))
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
    return await message.channel.send(
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
          }\n${app.toCodeBlock(`Error: ${error.message}`, "js")}`
        )
    )
  }
}

export function isCommandMessage(
  message: Discord.Message
): message is CommandMessage {
  return (
    !message.system &&
    !!message.guild &&
    message.channel instanceof Discord.TextChannel
  )
}

export function resolve(
  resolvable: CommandResolvable | undefined
): Command | undefined {
  return typeof resolvable === "function" ? resolvable() : resolvable
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type CommandMessage = Discord.Message & {
  channel: Discord.TextChannel
  guild: Discord.Guild
  member: Discord.GuildMember
  args: PartialBy<yargsParser.Arguments, "_">
  positional: any[] & {
    [name: string]: any
  }
  rest: string
}

export type CommandResolvable = Command | (() => Command)

export interface Command {
  name: string
  aliases?: string[]
  loading?: boolean
  coolDown?: number
  description?: string
  longDescription?: string
  examples?: string[]
  guildOwner?: boolean
  botOwner?: boolean
  userPermissions?: Discord.PermissionString[]
  botPermissions?: Discord.PermissionString[]
  positional?: Positional[]
  args?: Argument[]
  run: (message: CommandMessage) => unknown
  subs?: Command[]
}

export class Commands extends Discord.Collection<string, CommandResolvable> {
  public resolve(key: string): Command | undefined {
    const resolvable = this.find((resolvable) => {
      const command = resolve(resolvable) as Command
      return (
        key === command.name ||
        !!command.aliases?.some((alias) => key === alias)
      )
    })
    return resolve(resolvable)
  }

  public add(resolvable: CommandResolvable) {
    const command = resolve(resolvable) as Command
    this.set(command.name, resolvable)
  }
}

export const commands = new Commands()

export const commandsPath =
  process.env.COMMANDS_PATH ?? path.join(__dirname, "..", "commands")
