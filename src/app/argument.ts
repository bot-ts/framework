// system file, please don't modify it

import discord from "discord.js"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"

import * as util from "./util.ts"
import * as logger from "./logger.ts"
import * as command from "./command.ts"

type _item<Items extends readonly any[], K extends string> = Extract<
  Items[number],
  { name: K }
>

type ValueOf<T> = T[keyof T]

/**
 * Extracts the outputs of an array of inputs
 */
export type Outputs<
  Inputs extends readonly (TypedArgument<any, any, any> &
    OptionalArgument<any, any, any>)[],
> = {
  readonly [K in Inputs[number]["name"]]: _item<
    Inputs,
    K
  >["required"] extends true
    ? ArgumentTypes[_item<Inputs, K>["type"]]
    : _item<Inputs, K>["default"] extends undefined
      ? ArgumentTypes[_item<Inputs, K>["type"]] | null
      : ArgumentTypes[_item<Inputs, K>["type"]]
}

// const test: Outputs<
//   [
//     {
//       name: "test"
//       type: "string"
//       required: true
//     },
//     {
//       name: "test2"
//       type: "array",
//       validate: (value: string[]) => boolean
//     },
//     {
//       name: "test3"
//       type: "boolean"
//       required: false
//       default: false
//     }
//   ]
// > = null!

/**
 * Extracts the outputs of an array of inputs into an array containing the flag values
 * TESTED, WORKING PERFECTLY
 */
export type OutputFlags<Inputs extends readonly NamedArgument<any>[]> = {
  readonly [K in Inputs[number]["name"]]: boolean
}

/**
 * Convert the outputs of an array of inputs into an array containing the values
 * @fixme
 */
export type OutputPositionalValues<
  Inputs extends readonly (TypedArgument<any, any, any> &
    OptionalArgument<any, any, any>)[],
> = ValueOf<{
  [K in Inputs[number]["name"]]: _item<Inputs, K>["required"] extends true
    ? ArgumentTypes[_item<Inputs, K>["type"]]
    : _item<Inputs, K>["default"] extends undefined
      ? ArgumentTypes[_item<Inputs, K>["type"]] | null
      : ArgumentTypes[_item<Inputs, K>["type"]]
}>[]

// {
//   const test: OutputPositionalValues<
//     [
//       {
//         name: "test"
//         type: "string"
//         required: true
//       },
//       {
//         name: "test2"
//         type: "number"
//         required: false
//       },
//       {
//         name: "test3"
//         type: "boolean"
//         required: false
//         default: false
//       }
//     ]
//   > = null!
//
//   const [a, b, c] = test
// }

export type TypeName = keyof ArgumentTypes

export interface TypedArgument<
  Name extends string,
  Type extends TypeName,
  Message extends command.AnyMessage,
> {
  readonly name: Name
  readonly type: Type
  readonly validate?: (
    this: void,
    value: ArgumentTypes[Type],
    message: Message,
  ) => boolean | string | Promise<boolean | string>

  typeErrorMessage?: string | discord.EmbedBuilder
  validationErrorMessage?: string | discord.EmbedBuilder
}

export interface NamedArgument<Name extends string> {
  readonly name: Name
}

export interface OptionalArgument<
  Required extends boolean,
  Type extends TypeName,
  Message extends command.AnyMessage,
> {
  readonly required?: Required
  readonly default?: Required extends true
    ? never
    : util.Scrap<ArgumentTypes[Type], [message: Message]>
  missingErrorMessage?: string | discord.EmbedBuilder
}

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
  channel: discord.Channel
  message: discord.Message
  role: discord.Role
  emote: discord.GuildEmoji | string
  invite: discord.Invite
  command: command.ICommand
}

export interface IRest
  extends NamedArgument<string>,
    OptionalArgument<boolean, "string", any> {
  description: string
  all?: boolean
}

export interface Rest<
  Name extends string,
  Required extends boolean,
  Message extends command.AnyMessage,
> extends NamedArgument<Name>,
    OptionalArgument<Required, "string", Message> {
  description: string
  all?: boolean
}

export function rest<const Name extends string, const Required extends boolean>(
  options: Rest<Name, Required, command.AnyMessage>,
): Rest<Name, Required, command.AnyMessage> {
  return options
}

export interface IOption
  extends TypedArgument<string, TypeName, any>,
    OptionalArgument<boolean, TypeName, any> {
  description: string
  aliases?: readonly string[]
}

export interface Option<
  Name extends string,
  Type extends TypeName,
  Required extends boolean,
  Message extends command.AnyMessage,
> extends TypedArgument<Name, Type, Message>,
    OptionalArgument<Required, Type, Message> {
  description: string
  aliases?: readonly string[]
}

export function option<
  const Name extends string,
  const Type extends TypeName,
  const Required extends boolean,
>(
  options: Readonly<Option<Name, Type, Required, command.AnyMessage>>,
): Option<Name, Type, Required, command.AnyMessage> {
  return options
}

export interface IPositional
  extends TypedArgument<string, TypeName, any>,
    OptionalArgument<boolean, TypeName, any> {
  description: string
}

export interface Positional<
  Name extends string,
  Type extends TypeName,
  Required extends boolean,
  Message extends command.AnyMessage,
> extends TypedArgument<Name, Type, Message>,
    OptionalArgument<Required, Type, Message> {
  description: string
}

export function positional<
  const Name extends string,
  const Type extends TypeName,
  const Required extends boolean,
>(
  options: Positional<Name, Type, Required, command.AnyMessage>,
): Positional<Name, Type, Required, command.AnyMessage> {
  return options
}

export interface IFlag extends NamedArgument<string> {
  aliases?: readonly string[]
  description: string
  flag: string
}

export interface Flag<Name extends string> extends NamedArgument<Name> {
  aliases?: readonly string[]
  description: string
  flag: string
}

export function flag<const Name extends string>(
  options: Flag<Name>,
): Flag<Name> {
  return options
}

export function resolveGivenArgument(
  parsedArgs: yargsParser.Arguments,
  arg: IOption | IFlag,
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

export async function validate(
  subject: IPositional | IOption,
  subjectType: "positional" | "argument",
  castedValue: any,
  message: command.UnknownMessage,
): Promise<util.SystemMessage | true> {
  if (!subject.validate) return true

  const checkResult = await subject.validate(castedValue, message)

  const errorEmbed = async (
    errorMessage: string,
  ): Promise<util.SystemMessage> => {
    if (subject.validationErrorMessage) {
      if (typeof subject.validationErrorMessage === "string") {
        return util.getSystemMessage("error", {
          header: `Bad ${subjectType} tested "${subject.name}".`,
          body: subject.validationErrorMessage,
        })
      }

      return { embeds: [subject.validationErrorMessage] }
    }

    return util.getSystemMessage("error", {
      header: `Bad ${subjectType} tested "${subject.name}".`,
      body: errorMessage,
    })
  }

  if (typeof checkResult === "string") return errorEmbed(checkResult)

  if (!checkResult)
    return errorEmbed(
      typeof subject.validate === "function"
        ? await util.code.stringify({
            content: subject.validate.toString(),
            format: true,
            lang: "js",
          })
        : "Please use the `--help` flag for more information.",
    )

  return true
}

export async function resolveType(
  subject: IPositional | IOption,
  subjectType: "positional" | "argument",
  baseValue: string | undefined,
  message: command.UnknownMessage,
  setValue: <K extends keyof ArgumentTypes>(value: ArgumentTypes[K]) => unknown,
  cmd: command.ICommand,
): Promise<util.SystemMessage | true> {
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
      case "number": {
        if (baseValue === undefined) throw empty
        const formatted = Number(baseValue.replace(",", ".").replace(/_/g, ""))
        setValue<"number">(formatted)
        if (isNaN(formatted)) throw new Error("The value is not a Number!")
        break
      }
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
            const search = (channel: discord.Channel) => {
              return (
                "name" in channel &&
                channel.name?.toLowerCase().includes(baseValue.toLowerCase())
              )
            }
            let channel: discord.Channel | undefined
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
              'The "GuildMember" casting is only available in a guild!',
            )
        } else throw empty
        break
      case "message":
        if (baseValue) {
          const match =
            /^https?:\/\/(?:www\.)?(?:ptb\.|canary\.)?(?:discord|discordapp)\.com\/channels\/\d+\/(\d+)\/(\d+)$/.exec(
              baseValue,
            )
          if (match) {
            const [, channelID, messageID] = match
            const channel = message.client.channels.cache.get(channelID)
            if (channel) {
              if (channel.isTextBased()) {
                setValue<"message">(
                  await channel.messages.fetch({
                    force: false,
                    cache: false,
                    message: messageID,
                  }),
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
              'The "GuildRole" casting is only available in a guild!',
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
            const emojiMatch = util.emojiRegex.exec(baseValue)
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
              (invite) => invite.code === baseValue || invite.url === baseValue,
            )
            if (invite) setValue<"invite">(invite)
            else throw new Error("Unknown invite!")
          } else
            throw new Error(
              'The "Invite" casting is only available in a guild!',
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
    const errorCode = await util.code.stringify({
      content: `${error.name}: ${error.message}`,
      lang: "js",
    })

    if (subject.typeErrorMessage) {
      if (typeof subject.typeErrorMessage === "string") {
        return util.getSystemMessage("error", {
          header: `Bad ${subjectType} type "${subject.name}".`,
          body: subject.typeErrorMessage.replace(/@error/g, errorCode),
        })
      }

      return { embeds: [subject.typeErrorMessage] }
    }

    if (typeof subject.type === "function")
      logger.error(
        `The "${subject.name}" argument of the "${cmd.options.name}" command must have a custom typeErrorMessage because it is a custom type.`,
      )

    return util.getSystemMessage("error", {
      header: `Bad ${subjectType} type "${subject.name}".`,
      body: `Cannot convert the given "${subject.name}" ${subjectType}${
        typeof subject.type === "function" ? "" : " into `" + subject.type + "`"
      }\n${errorCode}`,
    })
  }
}

export function getCastingDescriptionOf(
  arg: TypedArgument<any, any, any>,
): string {
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
