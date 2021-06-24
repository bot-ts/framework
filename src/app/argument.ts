import discord from "discord.js"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"
import emojiRegex from "emoji-regex/es2015/RGI_Emoji"

import * as core from "./core"
import * as command from "./command"

export interface Argument {
  name: string
  description: string
}

export interface Rest<Message extends command.CommandMessage> extends Argument {
  required?: core.Scrap<boolean, [message?: Message]>
  default?: core.Scrap<string, [message?: Message]>
  all?: boolean
}

export interface Option<Message extends command.CommandMessage>
  extends Argument {
  aliases?: string[] | string
  default?: core.Scrap<string, [message?: Message]>
  required?: core.Scrap<boolean, [message?: Message]>
  castValue?:
    | "number"
    | "date"
    | "json"
    | "boolean"
    | "regex"
    | "array"
    | "user"
    | "member"
    | "channel"
    | "message"
    | "role"
    | "emote"
    | "invite"
    | ((value: string, message: Message) => any)
  /**
   * If returns string, it used as error message
   */
  checkValue?:
    | RegExp
    | string[]
    | core.Scrap<boolean | RegExp | string, [value: string, message?: Message]>
  checkCastedValue?: core.Scrap<
    boolean | string,
    [value: any, message?: Message]
  >
  typeDescription?: core.Scrap<string, [value: string, message?: Message]>
}

export type Positional<Message extends command.CommandMessage> = Omit<
  Option<Message>,
  "aliases"
>

export interface Flag<Message extends command.CommandMessage>
  extends Pick<Option<Message>, "name" | "aliases" | "description"> {
  flag: string
}

export function resolveGivenArgument<Message extends command.CommandMessage>(
  parsedArgs: yargsParser.Arguments,
  arg: Option<Message> | Flag<Message>
): { given: boolean; usedName: string; value: any } {
  let usedName = arg.name
  let given = parsedArgs.hasOwnProperty(arg.name)
  let value = parsedArgs[arg.name]

  if (!given && arg.aliases) {
    if (typeof arg.aliases === "string") {
      usedName = arg.aliases
      given = parsedArgs.hasOwnProperty(arg.aliases)
      value = parsedArgs[arg.aliases]
    } else {
      for (const alias of arg.aliases) {
        if (parsedArgs.hasOwnProperty(alias)) {
          usedName = alias
          given = true
          value = parsedArgs[alias]
          break
        }
      }
    }
  }

  if (!given && isFlag(arg)) {
    given = parsedArgs.hasOwnProperty(arg.flag)
    value = parsedArgs[arg.flag]
    usedName = arg.flag
  }

  return { given, usedName, value }
}

export async function checkValue<Message extends command.CommandMessage>(
  subject: Pick<Option<Message>, "checkValue" | "name">,
  subjectType: "positional" | "argument",
  value: string,
  message: Message
): Promise<discord.MessageEmbed | true> {
  if (!subject.checkValue) return true

  if (Array.isArray(subject.checkValue)) {
    if (subject.checkValue.includes(value)) {
      return new discord.MessageEmbed()
        .setColor("RED")
        .setAuthor(
          `Bad ${subjectType} pattern "${subject.name}".`,
          message.client.user?.displayAvatarURL()
        )
        .setDescription(
          `Expected choice list: \`${subject.checkValue.join(" | ")}\``
        )
    } else return true
  }

  const checkResult: string | boolean | RegExp = await core.scrap(
    subject.checkValue,
    value,
    message
  )

  if (typeof checkResult === "string") {
    return new discord.MessageEmbed()
      .setColor("RED")
      .setAuthor(
        `Bad ${subjectType} tested "${subject.name}".`,
        message.client.user?.displayAvatarURL()
      )
      .setDescription(checkResult)
  }

  if (typeof checkResult === "boolean") {
    if (!checkResult) {
      return new discord.MessageEmbed()
        .setColor("RED")
        .setAuthor(
          `Bad ${subjectType} tested "${subject.name}".`,
          message.client.user?.displayAvatarURL()
        )
        .setDescription(
          typeof subject.checkValue === "function"
            ? core.code.stringify({
                content: subject.checkValue.toString(),
                format: true,
                lang: "js",
              })
            : subject.checkValue instanceof RegExp
            ? `Expected pattern: \`${subject.checkValue.source}\``
            : "Please use the `--help` flag for more information."
        )
    }

    return true
  }

  if (!checkResult.test(value)) {
    return new discord.MessageEmbed()
      .setColor("RED")
      .setAuthor(
        `Bad ${subjectType} pattern "${subject.name}".`,
        message.client.user?.displayAvatarURL()
      )
      .setDescription(`Expected pattern: \`${checkResult.source}\``)
  }
  return true
}

export async function checkCastedValue<Message extends command.CommandMessage>(
  subject: Pick<Option<Message>, "checkCastedValue" | "name">,
  subjectType: "positional" | "argument",
  value: string,
  message: Message
): Promise<discord.MessageEmbed | true> {
  if (!subject.checkCastedValue) return true

  const checkResult: string | boolean = await core.scrap(
    subject.checkCastedValue,
    value,
    message
  )

  if (typeof checkResult === "string") {
    return new discord.MessageEmbed()
      .setColor("RED")
      .setAuthor(
        `Bad ${subjectType} tested "${subject.name}".`,
        message.client.user?.displayAvatarURL()
      )
      .setDescription(checkResult)
  }

  if (!checkResult) {
    return new discord.MessageEmbed()
      .setColor("RED")
      .setAuthor(
        `Bad ${subjectType} tested "${subject.name}".`,
        message.client.user?.displayAvatarURL()
      )
      .setDescription(
        typeof subject.checkCastedValue === "function"
          ? core.code.stringify({
              content: subject.checkCastedValue.toString(),
              format: true,
              lang: "js",
            })
          : "Please use the `--help` flag for more information."
      )
  }

  return true
}

export async function castValue<Message extends command.CommandMessage>(
  subject: Pick<Option<Message>, "castValue" | "name">,
  subjectType: "positional" | "argument",
  baseValue: string | undefined,
  message: Message,
  setValue: (value: any) => unknown
): Promise<discord.MessageEmbed | true> {
  const empty = new Error("The value is empty!")

  const cast = async () => {
    if (!subject.castValue) return

    switch (subject.castValue) {
      case "boolean":
        if (baseValue === undefined) throw empty
        else setValue(/^(?:true|1|oui|on|o|y|yes)$/i.test(baseValue))
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
        if (!/^-?(?:0|[1-9]\d*)$/.test(baseValue ?? ""))
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
      case "channel":
        if (baseValue) {
          const match = /^(?:<#(\d+)>|(\d+))$/.exec(baseValue)
          if (match) {
            const id = match[1] ?? match[2]
            const channel = message.client.channels.cache.get(id)
            if (channel) setValue(channel)
            else throw new Error("Unknown channel!")
          } else throw new Error("Invalid channel value!")
        } else throw empty
        break
      case "member":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const match = /^(?:<@!?(\d+)>|(\d+))$/.exec(baseValue)
            if (match) {
              const id = match[1] ?? match[2]
              const member = message.guild.members.cache.get(id)
              if (member) setValue(member)
              else throw new Error("Unknown member!")
            } else throw new Error("Invalid member value!")
          } else
            throw new Error(
              'The "GuildMember" casting is only available in a guild!'
            )
        } else throw empty
        break
      case "message":
        if (baseValue) {
          const match =
            /^https?:\/\/discord\.com\/channels\/\d+\/(\d+)\/(\d+)$/.exec(
              baseValue
            )
          if (match) {
            const [, channelID, messageID] = match
            const channel = message.client.channels.cache.get(channelID)
            if (channel) {
              if (channel.isText()) {
                setValue(await channel.messages.fetch(messageID, false))
              } else throw new Error("Invalid channel type!")
            } else throw new Error("Unknown channel!")
          } else throw new Error("Invalid message link!")
        } else throw empty
        break
      case "user":
        if (baseValue) {
          const match = /^(?:<@!?(\d+)>|(\d+))$/.exec(baseValue)
          if (match) {
            const id = match[1] ?? match[2]
            const user = await message.client.users.fetch(id, false)
            if (user) setValue(user)
            else throw new Error("Unknown user!")
          } else throw new Error("Invalid user value!")
        } else throw empty
        break
      case "role":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const match = /^(?:<@&?(\d+)>|(\d+))$/.exec(baseValue)
            if (match) {
              const id = match[1] ?? match[2]
              const role = message.guild.roles.cache.get(id)
              if (role) setValue(role)
              else throw new Error("Unknown role!")
            } else throw new Error("Invalid role value!")
          } else
            throw new Error(
              'The "GuildRole" casting is only available in a guild!'
            )
        } else throw empty
        break
      case "emote":
        if (baseValue) {
          const match = /^(?:<a?:.+:(\d+)>|(\d+))$/.exec(baseValue)
          if (match) {
            const id = match[1] ?? match[2]
            const emote = message.client.emojis.cache.get(id)
            if (emote) setValue(emote)
            else throw new Error("Unknown emote!")
          } else {
            const emojiMatch = emojiRegex().exec(baseValue)
            if (emojiMatch) setValue(emojiMatch[0])
            else throw new Error("Invalid emote value!")
          }
        } else throw empty
        break
      case "invite":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const invites = await message.guild.fetchInvites()
            const invite = invites.find(
              (invite) => invite.code === baseValue || invite.url === baseValue
            )
            if (invite) setValue(invite)
            else throw new Error("Unknown invite!")
          } else
            throw new Error(
              'The "Invite" casting is only available in a guild!'
            )
        } else throw empty
        break
      default:
        if (baseValue === undefined) throw empty
        else setValue(await subject.castValue(baseValue, message))
        break
    }
  }

  try {
    await cast()
    return true
  } catch (error) {
    return new discord.MessageEmbed()
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
        }\n${core.code.stringify({
          content: `Error: ${error.message}`,
          lang: "js",
        })}`
      )
  }
}

export function getTypeDescriptionOf<Message extends command.CommandMessage>(
  arg: Option<Message>
) {
  if (arg.typeDescription) return arg.typeDescription
  if (!arg.castValue) return "string"
  if (typeof arg.castValue === "string") {
    if (arg.castValue === "array") return "Array<string>"
    return arg.castValue
  }
  return "any"
}

export function isFlag<Message extends command.CommandMessage>(
  arg: Option<Message>
): arg is Flag<Message> {
  return arg.hasOwnProperty("flag")
}

export function trimArgumentValue(value: string): string {
  const match = /^(?:"(.+)"|'(.+)'|(.+))$/s.exec(value)
  if (match) return match[1] ?? match[2] ?? match[3]
  return value
}
