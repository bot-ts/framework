// system file, please don't modify it

import discord from "discord.js"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"

import * as core from "./core.js"
import * as command from "./command.js"

/**
 * Extracts the name of an input
 */
type InputName<T> = T extends Argument<infer Name, any, any> ? Name : never

/**
 * Extracts the type of an input
 */
type InputType<T> = T extends Argument<any, infer Type, any>
  ? ArgumentTypes[Type]
  : never

/**
 * Extracts the outputs of an array of inputs
 */
type Outputs<Inputs extends readonly Argument<any, TypeName, any>[]> = {
  [K in InputName<Inputs[number]>]: InputType<
    Extract<Inputs[number], { name: K }>
  >
}

type TypeName = keyof ArgumentTypes

export type Argument<
  Name extends string,
  Type extends TypeName,
  Message extends command.NormalMessage
> = Positional<Name, Type, Message> | Option<Name, Type, Message>

export interface ArgumentTypes {
  string: string
  number: number
  date: Date
  json: object
  boolean: boolean
  regex: RegExp
  array: Array<string>
  user: discord.User
  member: discord.GuildMember
  channel: discord.AnyChannel
  message: discord.Message
  role: discord.Role
  emote: discord.GuildEmoji | string
  invite: discord.Invite
  command: command.Command<keyof command.CommandMessageType, any>
}

export interface Rest<
  Name extends string,
  Message extends command.NormalMessage
> {
  name: Name
  description: string
  required?: core.Scrap<boolean, [message?: Message]>
  default?: core.Scrap<string, [message?: Message]>
  all?: boolean
  missingErrorMessage?: string | discord.MessageEmbed
}

export interface Option<
  Name extends string,
  Type extends TypeName,
  Message extends command.NormalMessage
> {
  name: Name
  type: Type
  description: string
  aliases?: string[]
  default?: core.Scrap<string, [message?: Message]>
  required?: core.Scrap<boolean, [message?: Message]>
  validate?: core.Scrap<
    boolean | string,
    [value: ArgumentTypes[Type], message?: Message]
  >
  typeErrorMessage?: string | discord.MessageEmbed
  missingErrorMessage?: string | discord.MessageEmbed
  validationErrorMessage?: string | discord.MessageEmbed
}

export interface Positional<
  Name extends string,
  Type extends TypeName,
  Message extends command.NormalMessage
> {
  name: Name
  type: Type
  description: string
  default?: core.Scrap<string, [message?: Message]>
  required?: core.Scrap<boolean, [message?: Message]>
  validate?: core.Scrap<
    boolean | string,
    [value: ArgumentTypes[Type], message?: Message]
  >
  typeErrorMessage?: string | discord.MessageEmbed
  missingErrorMessage?: string | discord.MessageEmbed
  validationErrorMessage?: string | discord.MessageEmbed
}

export interface Flag<Name extends string> {
  name: Name
  aliases?: string[]
  description: string
  flag: string
}

export function resolveGivenArgument(
  parsedArgs: yargsParser.Arguments,
  arg: Option<any, any, any> | Flag<any>
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

export async function validate<Message extends command.NormalMessage>(
  subject: Pick<
    Option<any, any, any>,
    "validate" | "name" | "validationErrorMessage"
  >,
  subjectType: "positional" | "argument",
  castedValue: any,
  message: Message
): Promise<discord.MessageEmbed | true> {
  if (!subject.validate) return true

  const checkResult: string | boolean = await core.scrap(
    subject.validate,
    castedValue,
    message
  )

  const errorEmbed = (errorMessage: string): discord.MessageEmbed => {
    const embed = new discord.MessageEmbed()
      .setColor("RED")
      .setAuthor({
        name: `Bad ${subjectType} tested "${subject.name}".`,
        iconURL: message.client.user?.displayAvatarURL(),
      })
      .setDescription(errorMessage)

    if (subject.validationErrorMessage) {
      if (typeof subject.validationErrorMessage === "string") {
        return embed.setDescription(subject.validationErrorMessage)
      } else {
        return subject.validationErrorMessage
      }
    }

    return embed
  }

  if (typeof checkResult === "string") return errorEmbed(checkResult)

  if (!checkResult)
    return errorEmbed(
      typeof subject.validate === "function"
        ? core.code.stringify({
            content: subject.validate.toString(),
            format: true,
            lang: "js",
          })
        : "Please use the `--help` flag for more information."
    )

  return true
}

export async function resolveType<Message extends command.NormalMessage>(
  subject: Pick<Option<any, any, any>, "type" | "name" | "typeErrorMessage">,
  subjectType: "positional" | "argument",
  baseValue: string | undefined,
  message: Message,
  setValue: <K extends keyof ArgumentTypes>(value: ArgumentTypes[K]) => unknown
): Promise<discord.MessageEmbed | true> {
  const empty = new Error("The value is empty!")

  const cast = async () => {
    if (!subject.type) return

    switch (subject.type) {
      case "boolean":
        if (baseValue === undefined) throw empty
        else setValue<"boolean">(/^(?:true|1|oui|on|o|y|yes)$/i.test(baseValue))
        break
      case "date":
        if (!baseValue) {
          throw empty
        } else if (baseValue === "now") {
          setValue<"date">(new Date())
        } else if (/^[1-9]\d*$/.test(baseValue)) {
          const date = new Date()
          date.setTime(Number(baseValue))
          setValue<"date">(date)
        } else {
          setValue<"date">(new Date(baseValue))
        }
        break
      case "json":
        if (baseValue) setValue<"json">(JSON.parse(baseValue))
        else throw empty
        break
      case "number":
        setValue<"number">(Number(baseValue))
        if (!/^-?(?:0|[1-9]\d*)$/.test(baseValue ?? ""))
          throw new Error("The value is not a Number!")
        break
      case "regex":
        if (baseValue) setValue<"regex">(regexParser(baseValue))
        else throw empty
        break
      case "array":
        if (baseValue === undefined) setValue<"array">([])
        else setValue<"array">(baseValue.split(/[,;|]/))
        break
      case "channel":
        if (baseValue) {
          const match = /^(?:<#(\d+)>|(\d+))$/.exec(baseValue)
          if (match) {
            const id = match[1] ?? match[2]
            const channel = message.client.channels.cache.get(id)
            if (channel) setValue<"channel">(channel)
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
            if (channel) setValue<"channel">(channel)
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
              if (member) setValue<"member">(member)
              else throw new Error("Unknown member!")
            } else {
              const members = await message.guild.members.fetch()
              message.guild.members.cache.clear()
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
              if (member) setValue<"member">(member)
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
                setValue<"message">(
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
            if (user) setValue<"user">(user)
            else throw new Error("Unknown user!")
          } else {
            const user = message.client.users.cache.find((user) => {
              return user.username
                .toLowerCase()
                .includes(baseValue.toLowerCase())
            })
            if (user) setValue<"user">(user)
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
              if (role) setValue<"role">(role)
              else throw new Error("Unknown role!")
            } else {
              const roles = await message.guild.roles.fetch(undefined, {
                cache: false,
                force: false,
              })
              const role = roles.find((role) => {
                return role.name.toLowerCase().includes(baseValue.toLowerCase())
              })
              if (role) setValue<"role">(role)
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
            if (emote) setValue<"emote">(emote)
            else throw new Error("Unknown emote!")
          } else {
            const emojiMatch = core.emojiRegex.exec(baseValue)
            if (emojiMatch) setValue<"emote">(emojiMatch[0])
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
            if (invite) setValue<"invite">(invite)
            else throw new Error("Unknown invite!")
          } else
            throw new Error(
              'The "Invite" casting is only available in a guild!'
            )
        } else throw empty
        break
      case "command":
        if (baseValue) {
          const cmd = command.commands.resolve(baseValue)
          if (cmd) setValue<"command">(cmd)
          else throw new Error("Unknown command!")
        } else throw empty
        break
      default:
        if (baseValue === undefined) throw empty
        setValue<"string">(baseValue)
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

    if (subject.typeErrorMessage) {
      if (typeof subject.typeErrorMessage === "string") {
        return new discord.MessageEmbed()
          .setColor("RED")
          .setAuthor({
            name: `Bad ${subjectType} type "${subject.name}".`,
            iconURL: message.client.user?.displayAvatarURL(),
          })
          .setDescription(
            subject.typeErrorMessage.replace(/@error/g, errorCode)
          )
      } else {
        return subject.typeErrorMessage
      }
    }

    return new discord.MessageEmbed()
      .setColor("RED")
      .setAuthor({
        name: `Bad ${subjectType} type "${subject.name}".`,
        iconURL: message.client.user?.displayAvatarURL(),
      })
      .setDescription(
        `Cannot cast the value of the "${subject.name}" ${subjectType} to ${
          typeof subject.type === "function"
            ? "{*custom type*}"
            : "`" + subject.type + "`"
        }\n${errorCode}`
      )
  }
}

export function getCastingDescriptionOf(arg: Option<any, any, any>) {
  if (arg.type === "array") return "Array<string>"
  return arg.type
}

export function isFlag(arg: any): arg is Flag<any> {
  return arg.hasOwnProperty("flag")
}

export function trimArgumentValue(value: string): string {
  const match = /^(?:"(.+)"|'(.+)'|(.+))$/s.exec(value)
  if (match) return match[1] ?? match[2] ?? match[3]
  return value
}
