Create a new button interaction handler for this bot.ts project.

The user will provide: a key/name for the button, a label, a description, and any typed parameters it receives.

If the user hasn't provided details, ask for:
1. Button key (kebab-case, unique identifier, e.g. `confirm-delete`)
2. Display label (shown on the button)
3. Short description
4. Parameters the button receives (name: type pairs, e.g. `userId: string`, `amount: number`)

Then create the file at `src/buttons/<key>.ts` (Biome style: tabs, no semicolons, double quotes):

### Button without parameters

```typescript
import { Button } from "#core/button"

export default new Button({
  key: "my-button",
  description: "My button",
  builder: (builder) => builder.setLabel("Click me"),
  async run(interaction) {
    await interaction.deferUpdate()
    await interaction.followUp({
      content: "You clicked the button!",
      ephemeral: true,
    })
  },
})
```

### Button with typed parameters

```typescript
import { Button } from "#core/button"

export type ConfirmDeleteButtonParams = {
  targetId: string
  guildId: string
}

export default new Button<ConfirmDeleteButtonParams>({
  key: "confirm-delete",
  description: "Confirm deletion of a resource",
  builder: (builder) =>
    builder.setLabel("Confirm Delete").setStyle(ButtonStyle.Danger),
  async run(interaction, { targetId, guildId }) {
    await interaction.deferUpdate()
    // perform deletion using targetId and guildId
    await interaction.followUp({
      content: `Deleted resource ${targetId} from guild ${guildId}.`,
      ephemeral: true,
    })
  },
})
```

### Using the button in a command or listener

```typescript
import discord from "discord.js"
import confirmDeleteButton from "#buttons/confirm-delete"

await channel.send({
  content: "Are you sure?",
  components: [
    new discord.ActionRowBuilder<discord.MessageActionRowComponentBuilder>().addComponents(
      confirmDeleteButton.create({ targetId: "abc123", guildId: message.guildId! })
    ),
  ],
})
```

### ButtonStyle values (discord.js)

- `ButtonStyle.Primary` — blue
- `ButtonStyle.Secondary` — grey
- `ButtonStyle.Success` — green
- `ButtonStyle.Danger` — red
- `ButtonStyle.Link` — link (use `setURL` instead of `create`)

Import `ButtonStyle` from `discord.js` when needed.

### Rules

- The `key` must be unique across all button files
- Parameters are passed as a typed object to the `run` function
- Always call `interaction.deferUpdate()` or `interaction.deferReply()` first in `run`
- Use `interaction.followUp()` for responses after deferral
- Parameters are serialized into the button's custom ID — keep them short (total customId ≤ 100 chars)

After creating the file, remind the user to run `bun run format`.
