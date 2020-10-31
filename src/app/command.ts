import Discord from "discord.js"
import fs from "fs/promises"
import path from "path"

export function isCommandMessage(
  message: Discord.Message
): message is CommandMessage {
  return (
    !message.system &&
    !!message.guild &&
    message.channel instanceof Discord.TextChannel
  )
}

export type CommandMessage = Discord.Message & {
  channel: Discord.TextChannel
  guild: Discord.Guild
  member: Discord.GuildMember
}

export interface Command {
  name: string
  aliases: string[]
  loading: boolean
  coolDown: number
  description: string
  longDescription: string
  examples: string[]
  guildOwner: boolean
  botOwner: boolean
  userPermissions: Discord.PermissionString[]
  botPermissions: Discord.PermissionString[]
  run: (message: CommandMessage) => unknown
}

export class Commands extends Discord.Collection<string, Command> {
  public resolve(key: string): Command | undefined {
    return this.find((command) => {
      return (
        key === command.name || command.aliases.some((alias) => key === alias)
      )
    })
  }

  public add(command: Command) {
    this.set(command.name, command)
  }
}

export const commands = new Commands()

export const commandsPath = path.join(__dirname, "..", "commands")

fs.readdir(commandsPath)
  .then((files) =>
    files.forEach((filename) => {
      commands.add(require(path.join(commandsPath, filename)))
    })
  )
  .catch(console.error)
