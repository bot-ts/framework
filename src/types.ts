import * as app from "#app"
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
  new app.TypeResolver("string", {
    resolver: async (value) => String(value),
  }),

  /**
   * Number resolver
   */
  new app.TypeResolver("number", {
    resolver: async (value) => {
      if (typeof value === "number") return value

      const number = Number(value.replace(/_/g, ""))

      if (isNaN(number))
        throw new app.TypeResolverError("Invalid number", {
          expected: [123, 0.5, 1_000],
          provided: value,
        })

      return number
    },
  }),

  /**
   * Boolean resolver
   */
  new app.TypeResolver("boolean", {
    resolver: async (value) => {
      if (value === undefined)
        throw new app.TypeResolverError("Invalid boolean", {
          expected: [true, false, "yes", "no", "on", "off", 1, 0],
          provided: value,
        })

      return /^(?:true|1|oui|on|o|y|yes)$/i.test(String(value))
    },
  }),

  /**
   * RegExp resolver
   */
  new app.TypeResolver("regex", {
    resolver: async (value) => {
      try {
        return regexParser(String(value))
      } catch (error) {
        throw new app.TypeResolverError(
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
  new app.TypeResolver("date", {
    resolver: async (value) => {
      const date = app.dayjs(value)

      if (!date.isValid())
        throw new app.TypeResolverError("Invalid date", {
          expected: ["2021-12-31", "2021-12-31T23:59:59"],
          provided: value,
        })

      return date.toDate()
    },
  }),

  /**
   * Duration resolved from regex to milliseconds
   */
  app.TypeResolver.fromRegex("duration", {
    regex: /^(\d+)\s*(second|minute|hour|day|week|month|year)s?$/,
    transformer: (match, value, type) => {
      const date = app.dayjs().add(+value, type as any)

      if (!date.isValid())
        throw new app.TypeResolverError("Invalid duration", {
          expected: ["1 minute", "3 days", "1 month"],
          provided: match,
        })

      return date.valueOf() - app.dayjs().valueOf()
    },
  }),

  /**
   * JSON resolver
   */
  new app.TypeResolver("json", {
    resolver: async (value) => {
      try {
        return JSON.parse(String(value))
      } catch (error) {
        throw new app.TypeResolverError(
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

  new app.TypeResolver("array", {
    resolver: async (value) => {
      return String(value)
        .split(",")
        .map((v) =>
          /^\d+$/.test(v) ? Number(v) : /true|false/.test(v) ? v === "true" : v,
        )
    },
  }),

  new app.TypeResolver("string[]", {
    resolver: async (value) => {
      return String(value).split(",")
    },
  }),

  new app.TypeResolver("number[]", {
    resolver: async (value) => {
      return String(value)
        .split(",")
        .map((v) => Number(v))
    },
  }),

  new app.TypeResolver("boolean[]", {
    resolver: async (value) => {
      return String(value)
        .split(",")
        .map((v) => v === "true")
    },
  }),

  new app.TypeResolver("date[]", {
    resolver: async (value) => {
      return String(value)
        .split(",")
        .map((v) => {
          const date = app.dayjs(v)

          if (!date.isValid())
            throw new app.TypeResolverError("Invalid date", {
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

  new app.TypeResolver("user", {
    resolver: async (value, message) => {
      const regex = /^(?:<@!?(\d+)>|(\d+))$/
      const match = String(value).match(regex)

      if (match) {
        const id = match[1] ?? match[2]

        try {
          return await message.client.users.fetch(id)
        } catch {
          throw new app.TypeResolverError("Invalid user ID", {
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

  new app.TypeResolver("member", {
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
          throw new app.TypeResolverError("Invalid member ID", {
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

  new app.TypeResolver("channel", {
    resolver: async (value, message) => {
      const regex = /^(?:<#(\d+)>|(\d+))$/
      const match = String(value).match(regex)

      if (match) {
        const id = match[1] ?? match[2]
        const channel = message.client.channels.cache.get(id)

        if (!channel)
          throw new app.TypeResolverError("Invalid channel ID", {
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

  new app.TypeResolver("role", {
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
          throw new app.TypeResolverError("Invalid role ID", {
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

  new app.TypeResolver("emote", {
    resolver: async (value, message) => {
      const regex = /^(?:<a?:\w+:(\d+)>|(\d+))$/
      const match = String(value).match(regex)

      if (match) {
        const id = match[1] ?? match[2]
        const emoji = message.client.emojis.cache.get(id)

        if (!emoji)
          throw new app.TypeResolverError("Invalid emoji ID", {
            expected: [
              "123456789012345678",
              "<:name:123456789012345678>",
              "<a:name:123456789012345678>",
            ],
            provided: id,
          })

        return emoji
      }

      const matchUnicode = app.emojiRegex.exec(String(value))

      if (matchUnicode) return matchUnicode[0]

      const emoji = message.client.emojis.cache.find((emoji) => {
        return emoji.name?.toLowerCase().includes(String(value).toLowerCase())
      })

      if (!emoji) throw new Error("Emoji not found")

      return emoji
    },
  }),

  new app.TypeResolver("invite", {
    resolver: async (value, message) => {
      if (!message.guild)
        throw new Error("You must be in a guild to chose an invite")

      const regex = /^(?:https:\/\/discord.gg\/(\w+)|(\w+))$/

      const match = String(value).match(regex)

      if (!match)
        throw new app.TypeResolverError("Invalid invite", {
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
  new app.TypeResolver("command", {
    resolver: async (value) => {
      const command = app.commands.resolve(String(value))

      if (!command)
        throw new app.TypeResolverError("Invalid command", {
          expected: ["info", "help"],
          provided: value,
        })

      return command
    },
  }),

  /**
   * Slash command resolver
   */
  new app.TypeResolver("slash", {
    resolver: async (value) => {
      const command = app.slashCommands.get(String(value))

      if (!command)
        throw new app.TypeResolverError("Invalid slash command", {
          expected: ["ping", "help"],
          provided: value,
        })

      return command
    },
  }),
] as const satisfies readonly app.TypeResolver<any, any>[]
