Create a new Discord event listener for this bot.ts project.

The user will provide: the Discord.js event name, a category/purpose name, and a description.

If the user hasn't provided details, ask for:
1. Discord.js event name (e.g. `guildMemberAdd`, `messageDelete`, `voiceStateUpdate`)
2. Category/purpose (e.g. `welcome`, `modlog`, `stats`) — used as file name prefix
3. Short description of what the listener does
4. Should it run only once? (yes/no — default no)

Then create the file at `src/listeners/<category>.<eventName>.ts` (Biome style: tabs, no semicolons, double quotes):

```typescript
import { Listener } from "#core/listener"

export default new Listener({
  event: "<eventName>",
  description: "<description>",
  async run(<args>) {
    // todo: implement
  },
})
```

### Common events and their arguments

| Event | Arguments |
|---|---|
| `messageCreate` | `message: Message` |
| `messageDelete` | `message: Message \| PartialMessage` |
| `messageUpdate` | `oldMessage, newMessage` |
| `guildMemberAdd` | `member: GuildMember` |
| `guildMemberRemove` | `member: GuildMember \| PartialGuildMember` |
| `guildMemberUpdate` | `oldMember, newMember` |
| `interactionCreate` | `interaction: Interaction` |
| `voiceStateUpdate` | `oldState, newState: VoiceState` |
| `guildCreate` | `guild: Guild` |
| `guildDelete` | `guild: Guild` |
| `clientReady` | `client: Client<true>` |
| `afterReady` | `client: Client<true>` *(bot.ts custom event)* |
| `raw` | `packet: GatewayDispatchPayload` *(bot.ts custom event)* |

### afterReady event (bot.ts specific)

`afterReady` fires after ALL `clientReady` listeners have finished — use it for post-init work:

```typescript
import { Listener } from "#core/listener"
import logger from "#core/logger"

export default new Listener({
  event: "afterReady",
  description: "Log successful startup",
  once: true,
  async run(client) {
    logger.success(`Logged in as ${client.user.tag}`)
  },
})
```

### Example: Welcome listener

```typescript
import { Listener } from "#core/listener"
import discord from "discord.js"

export default new Listener({
  event: "guildMemberAdd",
  description: "Welcome new members with an embed",
  async run(member) {
    const channel = member.guild.systemChannel
    if (!channel) return

    const embed = new discord.EmbedBuilder()
      .setTitle("Welcome!")
      .setDescription(`Welcome to **${member.guild.name}**, ${member}!`)
      .setColor(0x5865f2)

    await channel.send({ embeds: [embed] })
  },
})
```

### Rules

- File naming: `<category>.<eventName>.ts` — the category appears in logs
- `.native.ts` files are framework files — NEVER modify them; copy + remove `.native` to override
- Errors thrown inside listeners are caught and logged automatically — no need for try/catch unless custom handling is needed
- `once: true` removes the listener after first trigger
- For `clientReady`, prefer `afterReady` to ensure all other ready listeners have completed first

After creating the file, remind the user to run `bun run format`.
