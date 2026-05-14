Create a new slash command for this bot.ts project.

The user will provide: command name, description, and optionally: guild-only, bot-owner-only, required permissions, options/subcommands.

If the user hasn't provided details, ask for:
1. Command name (lowercase, no spaces, e.g. `leaderboard`)
2. Short description
3. Guild-only? (yes/no)
4. Bot owner only? (yes/no)
5. Options or subcommands needed?

Then create the file at `src/slash/<name>.ts` following this pattern (Biome style: tabs, no semicolons, double quotes):

### Basic slash command

```typescript
import { SlashCommand } from "#core/slash"

export default new SlashCommand({
  name: "<name>",
  description: "<description>",
  async run(interaction) {
    await interaction.reply({
      content: "<name> command is not yet implemented.",
      ephemeral: true,
    })
  },
})
```

### With options (string, user, channel, role, integer, boolean, number)

```typescript
import { SlashCommand } from "#core/slash"

export default new SlashCommand({
  name: "greet",
  description: "Greet a user",
  build(builder) {
    builder.addUserOption((opt) =>
      opt.setName("user").setDescription("Who to greet").setRequired(true)
    )
  },
  async run(interaction) {
    const user = interaction.options.getUser("user", true)
    await interaction.reply(`Hello, ${user}!`)
  },
})
```

### With subcommands

```typescript
import { SlashCommand } from "#core/slash"

export default new SlashCommand({
  name: "settings",
  description: "Manage settings",
  build(builder) {
    builder
      .addSubcommand((sub) =>
        sub.setName("show").setDescription("Show current settings")
      )
      .addSubcommand((sub) =>
        sub
          .setName("set")
          .setDescription("Change a setting")
          .addStringOption((opt) =>
            opt.setName("key").setDescription("Setting key").setRequired(true)
          )
      )
  },
  async run(interaction) {
    const sub = interaction.options.getSubcommand()
    if (sub === "show") {
      await interaction.reply("Current settings: ...")
    } else if (sub === "set") {
      const key = interaction.options.getString("key", true)
      await interaction.reply(`Setting ${key} updated.`)
    }
  },
})
```

### Available SlashCommand options

| Property | Type | Description |
|---|---|---|
| `guildOnly` | `boolean` | Restrict to guild channels |
| `guildOwnerOnly` | `boolean` | Restrict to guild owner |
| `botOwnerOnly` | `boolean` | Restrict to bot owner |
| `userPermissions` | `PermissionsString[]` | Required Discord permissions |
| `allowRoles` | `RoleResolvable[]` | Whitelist roles |
| `denyRoles` | `RoleResolvable[]` | Blacklist roles |
| `middlewares` | `Middleware[]` | Pre-execution middleware |
| `build` | `function` | SlashCommandBuilder customization |
| `run` | `function` | Command handler |

### Rules

- Slash commands are auto-registered on bot start
- Set `BOT_GUILD` in `.env` for instant dev registration (global = up to 1 hour)
- Always `return` or `await` the `interaction.reply()` / `interaction.deferReply()` call
- Use `ephemeral: true` for responses that shouldn't be visible to others
- For long operations, use `await interaction.deferReply()` then `interaction.editReply()`

After creating the file, remind the user to run `bun run format`.
