import Discord from "discord.js"
import API from "discord-api-types/v8"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"
import chalk from "chalk"
import tims from "tims"
import path from "path"

import * as core from "./core"
import * as slash from "./slash"
import * as logger from "./logger"
import * as handler from "./handler"
import * as argument from "./argument"

export const commandHandler = new handler.Handler(
  process.env.COMMANDS_PATH ?? path.join(process.cwd(), "dist", "commands")
)

export let defaultCommand: Command<any> | null = null

export const commands = new (class CommandCollection extends Discord.Collection<
  string,
  Command<any>
> {
  public resolve<Message extends CommandMessage>(
    key: string
  ): Command<Message> | undefined {
    for (const [name, command] of this) {
      if (key === name) {
        return command
      } else {
        const aliases = command.aliases ?? []
        const resolvedAliases = Array.isArray(aliases) ? aliases : [aliases]
        if (resolvedAliases.some((alias) => key === alias)) {
          return command
        }
      }
    }
  }

  public async add<Message extends CommandMessage>(command: Command<Message>) {
    await validateCommand(command)
    this.set(command.name, command)
  }
})()

export type CommandMessage = Discord.Message & {
  args: { [name: string]: any } & any[]
  triggerCoolDown: () => void
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

export interface CoolDown {
  time: number
  trigger: boolean
}

export type Middleware<Message extends CommandMessage> = (
  message: Message
) => Promise<true | string> | boolean | string

export interface Command<Message extends CommandMessage = CommandMessage> {
  name: string
  /**
   * Short description displayed in help menu
   */
  description: string
  /**
   * Description displayed in command detail
   */
  longDescription?: core.Scrap<string, [message: Message]>
  /**
   * Use this command if prefix is given but without command matching
   */
  isDefault?: boolean
  /**
   * Use this command as slash command
   */
  isSlash?: boolean
  aliases?: string[] | string
  /**
   * Cool down of command (in ms)
   */
  coolDown?: core.Scrap<number, [message: Message]>
  examples?: core.Scrap<string[], [message: Message]>

  // Restriction flags and permissions
  guildOwnerOnly?: core.Scrap<boolean, [message: Message]>
  botOwnerOnly?: core.Scrap<boolean, [message: Message]>
  guildChannelOnly?: core.Scrap<boolean, [message: Message]>
  dmChannelOnly?: core.Scrap<boolean, [message: Message]>
  userPermissions?: core.Scrap<Discord.PermissionString[], [message: Message]>
  botPermissions?: core.Scrap<Discord.PermissionString[], [message: Message]>

  /**
   * Middlewares can stop the command if returning a string (string is displayed as error message in Discord)
   */
  middlewares?: core.Scrap<Middleware<Message>[], [message: Message]>

  /**
   * The rest of message after excludes all other arguments.
   */
  rest?: core.Scrap<argument.Rest<Message>, [message: Message]>
  /**
   * Yargs positional argument (e.g. `[arg] <arg>`)
   */
  positional?: core.Scrap<argument.Positional<Message>[], [message: Message]>
  /**
   * Yargs option arguments (e.g. `--myArgument=value`)
   */
  options?: core.Scrap<argument.Option<Message>[], [message: Message]>
  /**
   * Yargs flag arguments (e.g. `--myFlag -f`)
   */
  flags?: argument.Flag<Message>[]
  run: (message: Message) => unknown
  /**
   * Sub-commands
   */
  subs?: Command<Message>[]
  /**
   * This path is automatically setup on bot running.
   * @deprecated
   */
  path?: string
  /**
   * This slash command options are automatically setup on bot running.
   * @deprecated slash
   */
  slash?: API.APIApplicationCommand
}

export function resolveGivenArgument<Message extends CommandMessage>(
  parsedArgs: yargsParser.Arguments,
  arg: argument.Option<Message> | argument.Flag<Message>
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

  if (!given && argument.isFlag(arg)) {
    given = parsedArgs.hasOwnProperty(arg.flag)
    value = parsedArgs[arg.flag]
    usedName = arg.flag
  }

  return { given, usedName, value }
}

export async function checkValue<Message extends CommandMessage>(
  subject: Pick<argument.Option<Message>, "checkValue" | "name">,
  subjectType: "positional" | "argument",
  value: string,
  message: Message
): Promise<boolean> {
  if (!subject.checkValue) return true

  const checkResult = await core.scrap(subject.checkValue, value, message)

  if (typeof checkResult === "string") {
    await message.channel.send(
      new Discord.MessageEmbed()
        .setColor("RED")
        .setAuthor(
          `Bad ${subjectType} tested "${subject.name}".`,
          message.client.user?.displayAvatarURL()
        )
        .setDescription(checkResult)
    )

    return false
  }

  if (typeof checkResult === "boolean") {
    if (!checkResult) {
      await message.channel.send(
        new Discord.MessageEmbed()
          .setColor("RED")
          .setAuthor(
            `Bad ${subjectType} tested "${subject.name}".`,
            message.client.user?.displayAvatarURL()
          )
          .setDescription(
            typeof subject.checkValue === "function"
              ? core.code.stringify({
                  content: core.code.format(subject.checkValue.toString()),
                  lang: "js",
                })
              : subject.checkValue instanceof RegExp
              ? `Expected pattern: \`${subject.checkValue.source}\``
              : "Please use the `--help` flag for more information."
          )
      )

      return false
    }

    return true
  }

  if (!checkResult.test(value)) {
    await message.channel.send(
      new Discord.MessageEmbed()
        .setColor("RED")
        .setAuthor(
          `Bad ${subjectType} pattern "${subject.name}".`,
          message.client.user?.displayAvatarURL()
        )
        .setDescription(`Expected pattern: \`${checkResult.source}\``)
    )

    return false
  }
  return true
}

export async function castValue<Message extends CommandMessage>(
  subject: Pick<argument.Option<Message>, "castValue" | "name">,
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
          if (isGuildMessage(message)) {
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
          const match = /^https?:\/\/discord\.com\/channels\/\d+\/(\d+)\/(\d+)$/.exec(
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
      default:
        if (baseValue === undefined) throw empty
        else setValue(await subject.castValue(baseValue, message))
        break
    }
  } catch (error) {
    await message.channel.send(
      new Discord.MessageEmbed()
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
    )

    return false
  }
  return true
}

export async function validateCommand<Message extends CommandMessage>(
  command: Command<Message>,
  path?: string
): Promise<void | never> {
  let slashCommand: null | API.APIApplicationCommand = null

  if (command.isSlash && !command.slash) {
    if (slash.slashState.usable) {
      if (slash.slashCommandNames.has(command.name) && !path)
        slashCommand = {
          id: core.coreState.clientId,
          application_id: core.coreState.clientId,
          name: command.name,
          description: command.description,
          options: [],
        }
    } else
      logger.warn(
        `slash command system is used on ${chalk.bold(
          ((path ? path + " " : "") + command.name).replace(/\s+/g, "/")
        )} command!`,
        "handler"
      )
  }

  if (command.isDefault) {
    if (defaultCommand)
      logger.error(
        `the ${chalk.blueBright(
          command.name
        )} command wants to be a default command but the ${chalk.blueBright(
          defaultCommand.name
        )} command is already the default command`,
        "handler"
      )
    else defaultCommand = command
  }

  const help: argument.Flag<Message> = {
    name: "help",
    flag: "h",
    description: "Get help from the command",
  }

  command.path = path

  if (!command.flags) command.flags = [help]
  else command.flags.push(help)

  for (const flag of command.flags)
    if (flag.flag)
      if (flag.flag.length !== 1) {
        throw new Error(
          `The "${flag.name}" flag length of "${
            path ? path + " " + command.name : command.name
          }" command must be equal to 1`
        )
      } else {
        slashCommand?.options?.push({
          name: flag.name,
          description: flag.description,
          default: false,
          type: API.ApplicationCommandOptionType.BOOLEAN,
        })
      }

  if (command.coolDown)
    if (!command.run.toString().includes("triggerCoolDown"))
      logger.warn(
        `you forgot using ${chalk.greenBright(
          "message.triggerCoolDown()"
        )} in the ${chalk.blueBright(command.name)} command.`,
        "handler"
      )

  logger.log(
    `loaded command ${chalk.blueBright(
      (path ? path + " " : "") + command.name
    )}`,
    "handler"
  )

  if (command.subs)
    for (const sub of command.subs) {
      await validateCommand(
        sub,
        path ? path + " " + command.name : command.name
      )

      if (slashCommand) {
        const options = subCommandsToSlashCommandOptions(command)
        if (options) slashCommand.options?.push(...options)
      }
    }

  if (slashCommand) {
    command.slash = slashCommand
    await slash.postSlashCommand(slashCommand)
  }
}

function subCommandsToSlashCommandOptions<Message extends CommandMessage>(
  cmd: Command<Message>,
  depth: number = 0,
  parent?: API.APIApplicationCommandOption
): API.APIApplicationCommandOption[] | undefined {
  const output: API.APIApplicationCommandOption[] = []
  if (cmd.subs) {
    for (const sub of cmd.subs) {
      const option: API.APIApplicationCommandOption = {
        name: sub.name,
        description: sub.description,
        type: API.ApplicationCommandOptionType.SUB_COMMAND_GROUP,
      }

      option.options = subCommandsToSlashCommandOptions(sub, depth + 1, option)

      output.push(option)
    }
    return output
  } else {
    if (parent) parent.type = API.ApplicationCommandOptionType.SUB_COMMAND
    return undefined
  }
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
  let restPattern = ""

  if (cmd.rest) {
    const rest = await core.scrap(cmd.rest, message)
    const dft =
      rest.default !== undefined
        ? `="${await core.scrap(rest.default, message)}"`
        : ""

    restPattern = (await core.scrap(rest.required, message))
      ? `<...${rest.name}>`
      : `[...${rest.name}${dft}]`
  }

  if (cmd.positional) {
    const cmdPositional = await core.scrap(cmd.positional, message)

    for (const positional of cmdPositional) {
      const dft =
        positional.default !== undefined
          ? `="${await core.scrap(positional.default, message)}"`
          : ""
      positionalList.push(
        (await core.scrap(positional.required, message)) && !dft
          ? `<${positional.name}>`
          : `[${positional.name}${dft}]`
      )
    }
  }

  if (cmd.options) {
    const cmdOptions = await core.scrap(cmd.options, message)

    for (const arg of cmdOptions) {
      const dft =
        arg.default !== undefined
          ? `="${core.scrap(arg.default, message)}"`
          : ""
      argumentList.push(
        (await core.scrap(arg.required, message))
          ? `\`--${arg.name}${dft}\` (\`${argument.getTypeDescriptionOf(
              arg
            )}\`) ${arg.description ?? ""}`
          : `\`[--${arg.name}${dft}]\` (\`${argument.getTypeDescriptionOf(
              arg
            )}\`) ${arg.description ?? ""}`
      )
    }
  }

  if (cmd.flags) {
    for (const flag of cmd.flags) {
      flagList.push(`[--${flag.name}]`)
    }
  }

  const specialPermissions = []

  if (await core.scrap(cmd.botOwnerOnly, message))
    specialPermissions.push("BOT_OWNER")
  if (await core.scrap(cmd.guildOwnerOnly, message))
    specialPermissions.push("GUILD_OWNER")

  const embed = new Discord.MessageEmbed()
    .setColor("BLURPLE")
    .setAuthor("Command details", message.client.user?.displayAvatarURL())
    .setTitle(
      `${pattern} ${[...positionalList, restPattern, ...flagList].join(" ")} ${
        cmd.options ? "[OPTIONS]" : ""
      }`
    )
    .setDescription(
      (await core.scrap(cmd.longDescription, message)) ??
        cmd.description ??
        "no description"
    )

  if (argumentList.length > 0)
    embed.addField("options", argumentList.join("\n"), false)

  if (cmd.aliases) {
    const aliases = Array.isArray(cmd.aliases) ? cmd.aliases : [cmd.aliases]

    embed.addField(
      "aliases",
      aliases.map((alias) => `\`${alias}\``).join(", "),
      true
    )
  }

  if (cmd.examples) {
    const examples = await core.scrap(cmd.examples, message)

    embed.addField(
      "examples:",
      core.code.stringify({
        content: examples.map((example) => prefix + example).join("\n"),
      }),
      false
    )
  }

  if (cmd.botPermissions) {
    const botPermissions = await core.scrap(cmd.botPermissions, message)

    embed.addField("bot permissions", botPermissions.join(", "), true)
  }

  if (cmd.userPermissions) {
    const userPermissions = await core.scrap(cmd.userPermissions, message)

    embed.addField("user permissions", userPermissions.join(", "), true)
  }

  if (specialPermissions.length > 0)
    embed.addField(
      "special permissions",
      specialPermissions.map((perm) => `\`${perm}\``).join(", "),
      true
    )

  if (cmd.coolDown) {
    const coolDown = await core.scrap(cmd.coolDown, message)

    embed.addField("cool down", tims.duration(coolDown), true)
  }

  if (cmd.subs)
    embed.addField(
      "sub commands:",
      (
        await Promise.all(
          cmd.subs.map(
            async (sub) =>
              `**${sub.name}**: ${
                (await core.scrap(sub.description, message)) ?? "no description"
              }`
          )
        )
      ).join("\n"),
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
