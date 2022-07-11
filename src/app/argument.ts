import discord from "discord.js"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"

import * as core from "./core.js"
import * as command from "./command.js"

import { getClient } from "./client.js"

export interface Argument {
  name: string
  description: string
}

export interface Rest<Message extends command.NormalMessage> extends Argument {
  required?: core.Scrap<boolean, [message?: Message]>
  default?: core.Scrap<string, [message?: Message]>
  all?: boolean
  missingErrorMessage?: string | discord.MessageEmbed
}

export interface Option<Message extends command.NormalMessage>
  extends Argument {
  aliases?: string[]
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
  castingDescription?: core.Scrap<string, [value: string, message?: Message]>
  checkingErrorMessage?: string | discord.MessageEmbed
  castingErrorMessage?: string | discord.MessageEmbed
  missingErrorMessage?: string | discord.MessageEmbed
}

export type Positional<Message extends command.NormalMessage> = Omit<
  Option<Message>,
  "aliases"
>

export interface Flag<Message extends command.NormalMessage>
  extends Pick<Option<Message>, "name" | "aliases" | "description"> {
  flag: string
}

export function resolveGivenArgument<Message extends command.NormalMessage>(
  parsedArgs: yargsParser.Arguments,
  arg: Option<any> | Flag<any>
): {
  given: boolean
  nameIsGiven: boolean
  usedName: string
  value: any
} {
  let usedName = arg.name
  let nameIsGiven = parsedArgs.hasOwnProperty(arg.name)
  let given =
    parsedArgs[arg.name] !== undefined && parsedArgs[arg.name] !== null
  let value = parsedArgs[arg.name]

  if (!given && arg.aliases) {
    for (const alias of arg.aliases) {
      if (parsedArgs.hasOwnProperty(alias)) {
        usedName = alias
        nameIsGiven = true
        given = true
        value = parsedArgs[alias]
        break
      }
    }
  }

  if (!given && isFlag(arg)) {
    given = parsedArgs.hasOwnProperty(arg.flag)
    value = parsedArgs[arg.flag]
    usedName = arg.flag
  }

  return { given, usedName, value, nameIsGiven }
}

export async function checkValue<Message extends command.NormalMessage>(
  subject: Pick<Option<any>, "checkValue" | "name" | "checkingErrorMessage">,
  subjectType: "positional" | "argument",
  value: string,
  message: Message
): Promise<discord.MessageEmbed | true> {
  const client = getClient()

  if (!subject.checkValue) return true

  const errorEmbed = (
    defaultErrorEmbed: () => discord.MessageEmbed
  ): discord.MessageEmbed => {
    if (typeof subject.checkingErrorMessage === "string") {
      return defaultErrorEmbed().setDescription(subject.checkingErrorMessage)
    } else if (subject.checkingErrorMessage) {
      return subject.checkingErrorMessage
    } else return defaultErrorEmbed()
  }

  if (Array.isArray(subject.checkValue)) {
    if (subject.checkValue.includes(value)) {
      const joined = subject.checkValue.join(" | ")

      return errorEmbed(() =>
        new core.SafeMessageEmbed()
          .setColor("RED")
          .setAuthor({
            name: `Bad ${subjectType} pattern "${subject.name}".`,
            iconURL: message.client.user?.displayAvatarURL(),
          })
          .setDescription(`Expected choice list: \`${joined}\``)
      )
    } else return true
  }

  const checkResult: string | boolean | RegExp = await core.scrap(
    subject.checkValue,
    value,
    message
  )

  if (typeof checkResult === "string") {
    return errorEmbed(() =>
      new core.SafeMessageEmbed()
        .setColor("RED")
        .setAuthor({
          name: `Bad ${subjectType} tested "${subject.name}".`,
          iconURL: message.client.user?.displayAvatarURL(),
        })
        .setDescription(checkResult)
    )
  }

  if (typeof checkResult === "boolean") {
    if (!checkResult) {
      return errorEmbed(() =>
        new core.SafeMessageEmbed()
          .setColor("RED")
          .setAuthor({
            name: `Bad ${subjectType} tested "${subject.name}".`,
            iconURL: message.client.user?.displayAvatarURL(),
          })
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
      )
    }

    return true
  }

  if (!checkResult.test(value)) {
    return errorEmbed(() =>
      new core.SafeMessageEmbed()
        .setColor("RED")
        .setAuthor({
          name: `Bad ${subjectType} pattern "${subject.name}".`,
          iconURL: message.client.user?.displayAvatarURL(),
        })
        .setDescription(`Expected pattern: \`${checkResult.source}\``)
    )
  }
  return true
}

export async function checkCastedValue<Message extends command.NormalMessage>(
  subject: Pick<
    Option<any>,
    "checkCastedValue" | "name" | "checkingErrorMessage"
  >,
  subjectType: "positional" | "argument",
  castedValue: any,
  message: Message
): Promise<discord.MessageEmbed | true> {
  if (!subject.checkCastedValue) return true

  const checkResult: string | boolean = await core.scrap(
    subject.checkCastedValue,
    castedValue,
    message
  )

  const errorEmbed = (errorMessage: string): discord.MessageEmbed => {
    const embed = new core.SafeMessageEmbed()
      .setColor("RED")
      .setAuthor({
        name: `Bad ${subjectType} tested "${subject.name}".`,
        iconURL: message.client.user?.displayAvatarURL(),
      })
      .setDescription(errorMessage)

    if (subject.checkingErrorMessage) {
      if (typeof subject.checkingErrorMessage === "string") {
        return embed.setDescription(subject.checkingErrorMessage)
      } else {
        return subject.checkingErrorMessage
      }
    }

    return embed
  }

  if (typeof checkResult === "string") return errorEmbed(checkResult)

  if (!checkResult)
    return errorEmbed(
      typeof subject.checkCastedValue === "function"
        ? core.code.stringify({
            content: subject.checkCastedValue.toString(),
            format: true,
            lang: "js",
          })
        : "Please use the `--help` flag for more information."
    )

  return true
}

export async function castValue<Message extends command.NormalMessage>(
  subject: Pick<Option<any>, "castValue" | "name" | "castingErrorMessage">,
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
          } else {
            const search = (channel: discord.AnyChannel) => {
              return (
                "name" in channel && // @ts-ignore
                channel.name.toLowerCase().includes(baseValue.toLowerCase())
              )
            }
            let channel: discord.AnyChannel | undefined
            if (command.isGuildMessage(message))
              channel = message.guild.channels.cache.find(search)
            channel ??= message.client.channels.cache.find(search)
            if (channel) setValue(channel)
            else throw new Error("Channel not found!")
          }
        } else throw empty
        break
      case "member":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const match = /^(?:<@!?(\d+)>|(\d+))$/.exec(baseValue)
            if (match) {
              const id = match[1] ?? match[2]
              const member = await message.guild.members.fetch({
                user: id,
                force: false,
                cache: false,
              })
              if (member) setValue(member)
              else throw new Error("Unknown member!")
            } else {
              const members = await message.guild.members.fetch()
              const member = members.find((member) => {
                return (
                  member.displayName
                    .toLowerCase()
                    .includes(baseValue.toLowerCase()) ||
                  member.user.username
                    .toLowerCase()
                    .includes(baseValue.toLowerCase())
                )
              })
              if (member) setValue(member)
              else throw new Error("Member not found!")
            }
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
                setValue(
                  await channel.messages.fetch(messageID, {
                    force: false,
                    cache: false,
                  })
                )
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
            const user = await message.client.users.fetch(id, {
              force: false,
              cache: false,
            })
            if (user) setValue(user)
            else throw new Error("Unknown user!")
          } else {
            const user = message.client.users.cache.find((user) => {
              return user.username
                .toLowerCase()
                .includes(baseValue.toLowerCase())
            })
            if (user) setValue(user)
            else throw new Error("User not found!")
          }
        } else throw empty
        break
      case "role":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const match = /^(?:<@&?(\d+)>|(\d+))$/.exec(baseValue)
            if (match) {
              const id = match[1] ?? match[2]
              const role = await message.guild.roles.fetch(id)
              if (role) setValue(role)
              else throw new Error("Unknown role!")
            } else {
              const roles = await message.guild.roles.fetch(undefined, {
                cache: false,
                force: false,
              })
              const role = roles.find((role) => {
                return role.name.toLowerCase().includes(baseValue.toLowerCase())
              })
              if (role) setValue(role)
              else throw new Error("Role not found!")
            }
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
            const emojiMatch = core.emojiRegex.exec(baseValue)
            if (emojiMatch) setValue(emojiMatch[0])
            else throw new Error("Invalid emote value!")
          }
        } else throw empty
        break
      case "invite":
        if (baseValue) {
          if (command.isGuildMessage(message)) {
            const invites = await message.guild.invites.fetch()
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
  } catch (error: any) {
    const errorCode = core.code.stringify({
      content: `${error.name}: ${error.message}`,
      lang: "js",
    })

    if (subject.castingErrorMessage) {
      if (typeof subject.castingErrorMessage === "string") {
        return new core.SafeMessageEmbed()
          .setColor("RED")
          .setAuthor({
            name: `Bad ${subjectType} type "${subject.name}".`,
            iconURL: message.client.user?.displayAvatarURL(),
          })
          .setDescription(
            subject.castingErrorMessage.replace(/@error/g, errorCode)
          )
      } else {
        return subject.castingErrorMessage
      }
    }

    return new core.SafeMessageEmbed()
      .setColor("RED")
      .setAuthor({
        name: `Bad ${subjectType} type "${subject.name}".`,
        iconURL: message.client.user?.displayAvatarURL(),
      })
      .setDescription(
        `Cannot cast the value of the "${subject.name}" ${subjectType} to ${
          typeof subject.castValue === "function"
            ? "{*custom type*}"
            : "`" + subject.castValue + "`"
        }\n${errorCode}`
      )
  }
}

export function getCastingDescriptionOf(arg: Option<any>) {
  if (arg.castingDescription) return arg.castingDescription
  if (!arg.castValue) return "string"
  if (typeof arg.castValue === "string") {
    if (arg.castValue === "array") return "Array<string>"
    return arg.castValue
  }
  return "any"
}

export function isFlag<Message extends command.NormalMessage>(
  arg: Option<Message>
): arg is Flag<Message> {
  return arg.hasOwnProperty("flag")
}

export function trimArgumentValue(value: string): string {
  const match = /^(?:"(.+)"|'(.+)'|(.+))$/s.exec(value)
  if (match) return match[1] ?? match[2] ?? match[3]
  return value
}
