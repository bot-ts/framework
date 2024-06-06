![Bot avatar]({{avatar}})

# {{packageJSON.name}}

> Made with [bot.ts](https://ghom.gitbook.io/bot-ts/) by **{{packageJSON.author}}**  
> CLI version: `{{packageJSON.devDependencies["@ghom/bot.ts-cli"]}}`  
> Bot.ts version: `{{packageJSON.version}}`  
> Licence: `{{packageJSON.license}}`

## Description

{{packageJSON.description}}

## Specifications

You can find the documentation of bot.ts [here](https://ghom.gitbook.io/bot-ts/).  
Below you will find the specifications for **{{packageJSON.name}}**.  

## Configuration file

```ts
{{configFile}}
```

## Commands

### Slash commands

{{Array.from(slash).map(([path, command]) => `- ${command.options.name} - ${command.options.description}`).join("  \n")}}

### Textual commands

{{Array.from(commands).map(([path, command]) => `- ${command.options.name} - ${command.options.description}`).join("  \n")}}

## Listeners

{{Array.from(listeners).map(([path, listener]) => `- ${path.split(/\\|\//).pop()}`).join("  \n")}}

## Database

Using **{{database}}@{{packageJSON.dependencies[database]}}** as database.  
Below you will find a list of all the tables used by **{{packageJSON.name}}**.

{{tables.size > 0 ? Array.from(tables).map(([path, table]) => `- ${table.options.name}`).join("  \n") : "> No tables have been created yet."}}

## Information

This readme.md is dynamic, it will update itself with the latest information.  
If you see a mistake, please report it and an update will be made as soon as possible.

- Used by: **{{client.guilds.cache.size}}** Discord guild{{client.guilds.cache.size > 1 ? "s" : ""}}
- Last update date: **{{new Date().toLocaleDateString("en-EN")}}**
