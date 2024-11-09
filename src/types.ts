import * as argument from "#core/argument.ts"
import { commands } from "#core/command.ts"
import { slashCommands } from "#core/slash.ts"
import * as util from "#core/util.ts"
import regexParser from "regex-parser"

/**
 * Type resolvers for textual commands. <br>
 * You can add your own custom type resolvers here. <br>
 * Also, you can edit the existing ones.
 */
export const types = [
  /**
   * String resolver
   */
  new argument.TypeResolver("string", {
    resolver: async (value) => String(value),
  }),

  /**
   * Number resolver
   */
  new argument.TypeResolver("number", {
    resolver: async (value) => {
      if (typeof value === "number") return value

      const number = Number(value.replace(/_/g, ""))

      if (isNaN(number))
        throw new argument.TypeResolverError("Invalid number", {
          expected: [123, 0.5, 1_000],
          provided: value,
        })

      return number
    },
  }),

  /**
   * Boolean resolver
   */
  new argument.TypeResolver("boolean", {
    resolver: async (value) => {
      if (value === undefined)
        throw new argument.TypeResolverError("Invalid boolean", {
          expected: [true, false, "yes", "no", "on", "off", 1, 0],
          provided: value,
        })

      return /^(?:true|1|oui|on|o|y|yes)$/i.test(String(value))
    },
  }),

  /**
   * RegExp resolver
   */
  new argument.TypeResolver("regex", {
    resolver: async (value) => {
      try {
        return regexParser(String(value))
      } catch (error) {
        throw new argument.TypeResolverError(
          error instanceof Error ? error.message : "Invalid regular expression",
          {
            expected: ["/^foo$/", "foo", "foo|bar"],
            provided: value,
          },
        )
      }
    },
  }),

  /**
   * Date resolver
   */
  new argument.TypeResolver("date", {
    resolver: async (value) => {
      const date = util.dayjs(value)

      if (!date.isValid())
        throw new argument.TypeResolverError("Invalid date", {
          expected: ["2021-12-31", "2021-12-31T23:59:59"],
          provided: value,
        })

      return date.toDate()
    },
  }),

  /**
   * Duration resolved from regex to milliseconds
   */
  argument.TypeResolver.fromRegex("duration", {
    regex: /^(\d+)\s*(second|minute|hour|day|week|month|year)s?$/,
    transformer: (match, value, type) => {
      const date = util.dayjs().add(+value, type as any)

      if (!date.isValid())
        throw new argument.TypeResolverError("Invalid duration", {
          expected: ["1 minute", "3 days", "1 month"],
          provided: match,
        })

      return date.valueOf() - util.dayjs().valueOf()
    },
  }),

  /**
   * JSON resolver
   */
  new argument.TypeResolver("json", {
    resolver: async (value) => {
      try {
        return JSON.parse(String(value))
      } catch (error) {
        throw new argument.TypeResolverError(
          error instanceof Error ? error.message : "Invalid JSON",
          {
            expected: ['{ "key": 42 }', "foo bar", 42],
            provided: value,
          },
        )
      }
    },
  }),

  /**
   * Array resolvers
   */

  new argument.TypeResolver("array", {
    resolver: async (value) => {
      return String(value)
        .split(",")
        .map((v) =>
          /^\d+$/.test(v) ? Number(v) : /true|false/.test(v) ? v === "true" : v,
        )
    },
  }),

  new argument.TypeResolver("string[]", {
    resolver: async (value) => {
      return String(value).split(",")
    },
  }),

  new argument.TypeResolver("number[]", {
    resolver: async (value) => {
      return String(value)
        .split(",")
        .map((v) => Number(v))
    },
  }),

  new argument.TypeResolver("boolean[]", {
    resolver: async (value) => {
      return String(value)
        .split(",")
        .map((v) => v === "true")
    },
  }),

  new argument.TypeResolver("date[]", {
    resolver: async (value) => {
      return String(value)
        .split(",")
        .map((v) => {
          const date = util.dayjs(v)

          if (!date.isValid())
            throw new argument.TypeResolverError("Invalid date", {
              expected: ["2021-12-31", "2021-12-31T23:59:59"],
              provided: v,
            })

          return date.toDate()
        })
    },
  }),

  /**
   * Discord type resolvers
   */

  new argument.TypeResolver("user", {
    resolver: async (value, message) => {
      const regex = /^(?:<@!?(\d+)>|(\d+))$/
      const match = String(value).match(regex)

      if (match) {
        const id = match[1] ?? match[2]

        try {
          return await message.client.users.fetch(id)
        } catch {
          throw new argument.TypeResolverError("Invalid user ID", {
            expected: ["123456789012345678", "<@123456789012345678>"],
            provided: id,
          })
        }
      }

      const user = message.client.users.cache.find((user) => {
        return user.username.toLowerCase().includes(String(value).toLowerCase())
      })

      if (!user) throw new Error("User not found")

      return user
    },
  }),

  new argument.TypeResolver("member", {
    resolver: async (value, message) => {
      const regex = /^(?:<@!?(\d+)>|(\d+))$/
      const match = String(value).match(regex)

      if (!message.guild)
        throw new Error("You must be in a guild to chose a member")

      if (match) {
        const id = match[1] ?? match[2]

        try {
          return await message.guild.members.fetch(id)
        } catch {
          throw new argument.TypeResolverError("Invalid member ID", {
            expected: ["123456789012345678", "<@123456789012345678>"],
            provided: id,
          })
        }
      }

      const members = await message.guild.members.fetch()

      const member = members.find((member) => {
        return member.displayName
          .toLowerCase()
          .includes(String(value).toLowerCase())
      })

      if (!member) throw new Error("Member not found")

      return member
    },
  }),

  new argument.TypeResolver("channel", {
    resolver: async (value, message) => {
      const regex = /^(?:<#(\d+)>|(\d+))$/
      const match = String(value).match(regex)

      if (match) {
        const id = match[1] ?? match[2]
        const channel = message.client.channels.cache.get(id)

        if (!channel)
          throw new argument.TypeResolverError("Invalid channel ID", {
            expected: ["123456789012345678", "<#123456789012345678>"],
            provided: id,
          })

        return channel
      }

      const channel = message.guild?.channels.cache.find((channel) => {
        return channel.name.toLowerCase().includes(String(value).toLowerCase())
      })

      if (!channel) throw new Error("Channel not found")

      return channel
    },
  }),

  new argument.TypeResolver("role", {
    resolver: async (value, message) => {
      if (!message.guild)
        throw new Error("You must be in a guild to chose a role")

      const regex = /^(?:<@&(\d+)>|(\d+))$/
      const match = String(value).match(regex)

      if (match) {
        const id = match[1] ?? match[2]

        try {
          return message.guild.roles.fetch(id)
        } catch {
          throw new argument.TypeResolverError("Invalid role ID", {
            expected: ["123456789012345678", "<@&123456789012345678>"],
            provided: id,
          })
        }
      }

      const roles = await message.guild.roles.fetch()

      const role = roles.find((role) => {
        return role.name.toLowerCase().includes(String(value).toLowerCase())
      })

      if (!role) throw new Error("Role not found")

      return role
    },
  }),

  new argument.TypeResolver("emote", {
    resolver: async (value, message) => {
      const regex = /^(?:<a?:\w+:(\d+)>|(\d+))$/
      const match = String(value).match(regex)

      if (match) {
        const id = match[1] ?? match[2]
        const emoji = message.client.emojis.cache.get(id)

        if (!emoji)
          throw new argument.TypeResolverError("Invalid emoji ID", {
            expected: [
              "123456789012345678",
              "<:name:123456789012345678>",
              "<a:name:123456789012345678>",
            ],
            provided: id,
          })

        return emoji
      }

      const matchUnicode = util.emojiRegex.exec(String(value))

      if (matchUnicode) return matchUnicode[0]

      const emoji = message.client.emojis.cache.find((emoji) => {
        return emoji.name?.toLowerCase().includes(String(value).toLowerCase())
      })

      if (!emoji) throw new Error("Emoji not found")

      return emoji
    },
  }),

  new argument.TypeResolver("invite", {
    resolver: async (value, message) => {
      if (!message.guild)
        throw new Error("You must be in a guild to chose an invite")

      const regex = /^(?:https:\/\/discord.gg\/(\w+)|(\w+))$/

      const match = String(value).match(regex)

      if (!match)
        throw new argument.TypeResolverError("Invalid invite", {
          expected: ["https://discord.gg/abc123", "abc123"],
          provided: value,
        })

      const invites = await message.guild.invites.fetch()

      const invite = invites.find(
        (invite) => invite.code === (match[1] ?? match[2]),
      )

      if (!invite) throw new Error("Invite not found")

      return invite
    },
  }),

  /**
   * Command resolver
   */
  new argument.TypeResolver("command", {
    resolver: async (value) => {
      const command = commands.resolve(String(value))

      if (!command)
        throw new argument.TypeResolverError("Invalid command", {
          expected: ["info", "help"],
          provided: value,
        })

      return command
    },
  }),

  /**
   * Slash command resolver
   */
  new argument.TypeResolver("slash", {
    resolver: async (value) => {
      const command = slashCommands.get(String(value))

      if (!command)
        throw new argument.TypeResolverError("Invalid slash command", {
          expected: ["ping", "help"],
          provided: value,
        })

      return command
    },
  }),
] as const satisfies readonly argument.TypeResolver<any, any>[]
