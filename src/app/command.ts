import Discord from "discord.js"
import API from "discord-api-types/v8"
import chalk from "chalk"
import tims from "tims"
import path from "path"

import * as core from "./core"
import * as logger from "./logger"
import * as handler from "./handler"
import * as argument from "./argument"

export const commandHandler = new handler.Handler(
  process.env.COMMANDS_PATH ?? path.join(process.cwd(), "dist", "commands")
)

commandHandler.on("load", (filepath) => {
  return commands.add(require(filepath))
})

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

  public add<Message extends CommandMessage>(command: Command<Message>) {
    validateCommand(command)
    this.set(command.name, command)
  }
})()

export type CommandMessage = Discord.Message & {
  args: { [name: string]: any } & any[]
  triggerCoolDown: () => void
  usedPrefix: string
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
  middlewares?: Middleware<Message>[]

  /**
   * The rest of message after excludes all other arguments.
   */
  rest?: argument.Rest<Message>
  /**
   * Yargs positional argument (e.g. `[arg] <arg>`)
   */
  positional?: argument.Positional<Message>[]
  /**
   * Yargs option arguments (e.g. `--myArgument=value`)
   */
  options?: argument.Option<Message>[]
  /**
   * Yargs flag arguments (e.g. `--myFlag -f`)
   */
  flags?: argument.Flag<Message>[]
  run: (message: Message) => unknown
  /**
   * Sub-commands
   */
  subs?: Command<any>[]
  /**
   * This slash command options are automatically setup on bot running but you can configure it manually too.
   */
  slash?: API.RESTPostAPIApplicationCommandsJSONBody
  /**
   * This property is automatically setup on bot running.
   * @deprecated
   */
  parent?: Command<any>
}

export function validateCommand<Message extends CommandMessage>(
  command: Command<Message>,
  parent?: Command<any>
): void | never {
  command.parent = parent

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

  if (!command.flags) command.flags = [help]
  else command.flags.push(help)

  for (const flag of command.flags)
    if (flag.flag)
      if (flag.flag.length !== 1)
        throw new Error(
          `The "${flag.name}" flag length of "${
            path ? path + " " + command.name : command.name
          }" command must be equal to 1`
        )

  if (command.coolDown)
    if (!command.run.toString().includes("triggerCoolDown"))
      logger.warn(
        `you forgot using ${chalk.greenBright(
          "message.triggerCoolDown()"
        )} in the ${chalk.blueBright(command.name)} command.`,
        "handler"
      )

  logger.log(
    `loaded command ${chalk.blueBright(commandBreadcrumb(command))}`,
    "handler"
  )

  if (command.subs)
    for (const sub of command.subs) validateCommand(sub, command)
}

export function commandBreadcrumb<Message extends CommandMessage>(
  command: Command<Message>,
  separator = " "
): string {
  return commandParents(command)
    .map((cmd) => cmd.name)
    .join(separator)
}

export function commandParents<Message extends CommandMessage>(
  command: Command<Message>
): Command<any>[] {
  return command.parent
    ? [command, ...commandParents(command.parent)].reverse()
    : [command]
}

export async function sendCommandDetails<Message extends CommandMessage>(
  message: Message,
  cmd: Command<Message>,
  prefix: string
): Promise<void> {
  let pattern = `${prefix}${commandBreadcrumb(cmd)}`

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
  return !message.system && !!message.channel && !!message.author
}

export function isGuildMessage(
  message: CommandMessage
): message is GuildMessage {
  return (
    !!message.member &&
    !!message.guild &&
    message.channel instanceof Discord.GuildChannel
  )
}

export function isDirectMessage(
  message: CommandMessage
): message is DirectMessage {
  return message.channel instanceof Discord.DMChannel
}
