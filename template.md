# {{packageJSON.name}} Discord bot

> Made with [bot.ts](https://ghom.gitbook.io/bot-ts/) by **{{packageJSON.author}}**  
> CLI version: `{{packageJSON.devDependencies["make-bot.ts"]}}`  
> Bot.ts version: `{{packageJSON.version}}`  
> Licence: `{{packageJSON.license}}`

{{packageJSON.description}}

# Specifications

You can find the documentation of bot.ts [here](https://ghom.gitbook.io/bot-ts/).  
Below you will find the specifications for **{{packageJSON.name}}**.  

# Configuration file

```ts
{{configFile}}
```

## Commands

### Slash commands

{{Array.from(slash).map(([path, command]) => `- ${command.options.name}`).join("  \n")}}

### Textual commands

{{Array.from(commands).map(([path, command]) => `- ${command.options.name}`).join("  \n")}}

## Listeners

{{Array.from(listeners).map(([path, listener]) => `- ${path.split(/\\|\//).pop()}`).join("  \n")}}

## Database

Using **{{database}}@{{packageJSON.dependencies[database]}}** as database.  
Below you will find a list of all the tables used by **{{packageJSON.name}}**.

{{tables.size > 0 ? Array.from(tables).map(([path, table]) => `- ${table.options.name}`).join("  \n") : "> No tables have been created yet."}}

## Information

- Redaction date: **{{new Date().toLocaleDateString("en-EN")}}**
