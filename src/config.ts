import { Config } from "#src/app/config.ts"
import { Options, Partials, EmbedBuilder } from "discord.js"
import { z } from "zod"

export const config = new Config({
  ignoreBots: true,
  openSource: true,
  printNameOnReady: true,
  envSchema: z.object({}),
  permissions: ["Administrator"],
  client: {
    intents: [
      "Guilds",
      "GuildMessages",
      "GuildMessageReactions",
      "GuildMessageTyping",
      "DirectMessages",
      "DirectMessageReactions",
      "DirectMessageTyping",
      "MessageContent",
    ],
    partials: [Partials.Channel],
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,

      // don't cache reactions
      ReactionManager: 0,
    }),
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: {
        // every hour (in second)
        interval: 60 * 60,

        // 6 hours
        lifetime: 60 * 60 * 6,
      },
    },
  },
  systemMessages: {
    default: (data, client) => {
      if (typeof data === "string" || data instanceof Error)
        return {
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: data instanceof Error ? data.message : "System message",
                iconURL: client.user?.displayAvatarURL(),
              })
              .setDescription(
                data instanceof Error ? data.stack ?? null : data,
              ),
          ],
        }

      return {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: data.header ?? "System message",
              iconURL: client.user?.displayAvatarURL(),
            })
            .setDescription(
              data.body instanceof Error
                ? data.body.stack ?? null
                : data.body ?? null,
            )
            .setFooter(data.footer ? { text: data.footer } : null),
        ],
      }
    },
  },
})

export default config.options
