// system file, please don't modify it

import * as discordEval from "discord-eval.ts"
import discord from "discord.js"
import yargsParser from "yargs-parser"
import typeParser from "zod"

import * as command from "#core/command"
import * as logger from "#core/logger"
import * as util from "#core/util"

import type { types } from "#types"

import { inspect } from "node:util"

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

export type ArgumentTypes = {
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
} & TypeResolversToRecord<typeof types>

export type TypeResolversToRecord<
  TypeResolvers extends readonly TypeResolver<any, any>[],
> = {
  readonly [K in TypeResolvers[number]["name"]]: Extract<
    TypeResolvers[number],
    { name: K }
  > extends TypeResolver<any, infer T>
    ? T
    : never
}

export class TypeResolver<Name extends string, Type> {
  constructor(
    readonly name: Name,
    public options: {
      readonly resolver: (
        value: string | number,
        message: command.UnknownMessage,
      ) => Promise<Type>
    },
  ) {}

  static fromZod<Name extends string, Type>(
    name: Name,
    options: {
      zod: typeParser.ZodType<Type, any, any>
    },
  ) {
    return new TypeResolver(name, {
      resolver: async (value) => {
        try {
          return await options.zod.parseAsync(value)
        } catch (error: any) {
          throw new TypeResolverError(
            error instanceof typeParser.ZodError
              ? error.message
              : `Invalid ${name}`,
            {
              expected: options.zod._def.type,
              provided: value,
            },
          )
        }
      },
    })
  }

  static fromRegex<Name extends string, Type>(
    name: Name,
    options: {
      regex: RegExp
      transformer: (full: string, ...groups: string[]) => Type
    },
  ) {
    return new TypeResolver(name, {
      resolver: async (value) => {
        if (typeof value !== "string")
          throw new TypeResolverError("Invalid input type", {
            expected: ["string"],
            provided: typeof value,
          })

        const match = options.regex.exec(value)

        if (!match)
          throw new TypeResolverError("Invalid string pattern", {
            expected: [options.regex.source],
            provided: value,
          })

        return options.transformer(match[0], ...match.slice(1))
      },
    })
  }
}

export class TypeResolverError extends Error {
  constructor(
    message: string,
    private options: {
      expected: (string | number | boolean)[]
      provided: string | number
    },
  ) {
    super(message)
    this.name = "TypeResolverError"
  }

  override toString() {
    return `${this.message}\nProvided: ${
      typeof this.options.provided === "number"
        ? this.options.provided
        : `"${this.options.provided}"`
    }\nExpected:\n${this.options.expected
      .map(
        (expect, index, all) =>
          `  ${index < all.length - 1 ? "├" : "└"} ${typeof expect === "number" || typeof expect === "boolean" ? expect : `"${expect}"`}`,
      )
      .join("\n")}`
  }
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
        ? await discordEval.code.stringify({
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
  baseValue: string | number | undefined,
  message: command.UnknownMessage,
  setValue: <K extends keyof ArgumentTypes>(value: ArgumentTypes[K]) => unknown,
  cmd: command.ICommand,
): Promise<util.SystemMessage | true> {
  const types = await import("#types").then((m) => m.types)

  const empty = new Error("The value is empty!")

  const cast = async () => {
    if (!subject.type) return

    if (baseValue === undefined) {
      if (subject.required) throw empty
      else {
        setValue(undefined)
        return
      }
    }

    const output = await types
      .find((resolver) => resolver.name === subject.type)
      ?.options.resolver(baseValue, message)

    setValue(output)
  }

  try {
    await cast()
    return true
  } catch (error) {
    const errorCode = await discordEval.code.stringify({
      content:
        error instanceof Error
          ? `${error.name}: ${error instanceof TypeResolverError ? `${error.toString()}` : error.message}`
          : `Unknown Error:\n${inspect(error)}`,
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

export function trimArgumentValue(value: string | number): string | number {
  if (typeof value === "number") return value
  const match = /^(?:"(.+)"|'(.+)'|(.+))$/s.exec(String(value))
  if (match) return match[1] ?? match[2] ?? match[3]
  return value
}
