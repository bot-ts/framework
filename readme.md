<div align="center">
  <h1> @ghom/bot.ts </h1><p> A Discord bot in TypeScript made with <a href='https://ghom.gitbook.io/bot-ts/'>bot.ts</a> </p>
  <div class="banner">
    <a href="https://ghom.gitbook.io/bot-ts/">
      <img src="https://raw.githubusercontent.com/bot-ts/docs/master/.gitbook/assets/bot.ts-banner.png" alt="bot.ts banner"/>
    </a>
  </div>
  <div>
    <a href="https://discord.gg/3vC2XWK"><img src="https://img.shields.io/discord/507389389098188820?color=7289da&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/@ghom/bot.ts-cli"><img src="https://img.shields.io/npm/v/@ghom/bot.ts-cli.svg?maxAge=3600" alt="CLI version" /></a>
    <a href="https://www.npmjs.com/package/@ghom/bot.ts-cli"><img src="https://img.shields.io/npm/dm/@ghom/bot.ts-cli.svg?maxAge=3600" alt="CLI downloads" /></a>
    <a href="https://github.com/bot-ts/framework/actions/workflows/factory.yml"><img src="https://github.com/bot-ts/framework/actions/workflows/factory.yml/badge.svg?branch=master" alt="Tests" /></a>
    <img alt="Dependency status" src="https://img.shields.io/librariesio/github/bot-ts/framework">
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/v/discord.js?label=discord.js" alt="Discord.js version" /></a>
    <a href="https://github.com/bot-ts/framework"><img alt="Github stars" src="https://img.shields.io/github/stars/bot-ts/framework?color=black&logo=github"></a>
  </div>
</div>

<br/>

## What is bot.ts?

**bot.ts** is a framework for [discord.js](https://discord.js.org/#/) designed in TypeScript for use in TypeScript. This framework includes all the features you need, here is a list:

- **Package Manager Agnostic**: Compatible with [npm](https://www.npmjs.com), [yarn](https://yarnpkg.com), [pnpm](https://pnpm.io) and more.
- **Multi-Runtime Support**: Fully compatible with [Node.js](https://nodejs.org), [Bun](https://bun.sh), and [Deno](https://deno.land).
- **File Handling**: Robust file handling using [@ghom/handler](https://www.npmjs.com/package/@ghom/handler).
- **CLI File Generation**: Easy and powerful file generation using [@ghom/bot.ts-cli](https://www.npmjs.com/package/@ghom/bot.ts-cli).
- **Node Aliases**: Simplify module resolution with useful path aliases using [Node.js 'imports'](https://nodejs.org/api/packages.html#packages_imports).
- **Shell Arguments**: Handle type-safe shell arguments on textual commands using [Yargs](http://yargs.js.org/).
- **Predefined Commands & Listeners**: Ready-to-use dev-[commands](https://github.com/bot-ts/framework/blob/master/src/commands) and system-[listeners](https://github.com/bot-ts/framework/blob/master/src/listeners).
- **Advanced Scripts**: Configured advanced dev tools in [package.json's scripts and CLI](https://ghom.gitbook.io/bot-ts/command-line/overview).
- **ORM Setup**: Preconfigured [Knex](http://knexjs.org/)-based ORM with [sqlite3](https://www.npmjs.com/package/sqlite3) using [@ghom/orm](https://www.npmjs.com/package/@ghom/orm).
- **Pagination**: Efficient pagination in the [help command](https://github.com/bot-ts/framework/blob/master/src/commands/help.native.ts#L35).
- **Fast Build**: Builds fast with [Rollup](https://rollupjs.org).
- **TypeScript Checks**: Generated CI/CD using [GitHub Actions](https://github.com/bot-ts/framework/blob/master/.github/workflows/test.yml).
- **Logging**: Beautiful console logging using [@ghom/logger](https://www.npmjs.com/package/@ghom/logger).
- **Framework Updates**: Stay up to date with the integrated [updater](https://github.com/bot-ts/framework/blob/master/scripts/update-framework.js).
- **Docker**: Run with [Docker](https://www.docker.com) via [Dockerfile](https://github.com/bot-ts/framework/blob/master/Dockerfile) or [compose.yml](https://github.com/bot-ts/framework/blob/master/compose.yml).
- **Data Caching**: Reduce database and API requests with built-in caching.

## What's next?

- Localhost Admin Dashboard
- Data Caching imporovement
- Make optional the textual command system
- Move all advanced scripts into CLI
- Publish the CLI as JSR package

## Why using bot.ts?

Modern, intuitive, and easy to use. Choosing **Bot.ts** is choosing control.

* It's not a lib! You can edit all files easily.
* All is already configured.
* I recommend it for learning TypeScript.
* It is up to date with all technologies.

## Hello World

![bot.ts hello world](https://media.githubusercontent.com/media/bot-ts/docs/refs/heads/master/.gitbook/assets/bot.ts-helloworld.webp)

## Annexes

* [GitHub](https://github.com/bot-ts) - Come contribute 🩵
* [Documentation](https://ghom.gitbook.io/bot-ts/)
* [Package](https://www.npmjs.com/package/@ghom/bot.ts-cli) of CLI on NPM
* [Discord](https://discord.gg/kYxDWWQJ8q) to track the progress of the project.
* [Community](https://discord.gg/3vC2XWK) - Les Laboratoires JS

## Funding

<a href="https://www.buymeacoffee.com/ghom" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174">
</a>
