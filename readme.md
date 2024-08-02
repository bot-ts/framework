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
    <a href="https://github.com/bot-ts/framework/actions/workflows/tests.native.yml"><img src="https://github.com/bot-ts/framework/actions/workflows/tests.native.yml/badge.svg?branch=master" alt="Tests" /></a>
    <img alt="Dependency status" src="https://img.shields.io/librariesio/github/bot-ts/framework">
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/v/discord.js?label=discord.js" alt="Discord.js version" /></a>
    <a href="https://github.com/bot-ts/framework"><img alt="Github stars" src="https://img.shields.io/github/stars/bot-ts/framework?color=black&logo=github"></a>
  </div>
</div>

<br/>

## What is bot.ts ?

**bot.ts** is a framework for [discord.js](https://discord.js.org/#/) designed in TypeScript for use in TypeScript. This framework includes all the features you need, here is a list:

- **File Handling**: [@ghom/handler](https://www.npmjs.com/package/@ghom/handler) provides robust file handling capabilities.
- **CLI File Generation**: Generate files effortlessly with [@ghom/bot.ts-cli](https://www.npmjs.com/package/@ghom/bot.ts-cli).
- **Argument Typing System**: Utilize [GhomKrosmonaute/prop-transfer-typings.ts](https://gist.github.com/GhomKrosmonaute/00da4eb3e8ac48a751602288fcf71835) for advanced argument typing.
- **App Importation**: Import your entire app using NodeJS aliases with [app.ts](https://github.com/bot-ts/framework/blob/master/src/app.ts) (`import * as app from "#app"`).
- **Shell-Based Arguments**: Seamlessly handle shell-based arguments with [Yargs](http://yargs.js.org/).
- **Predefined Commands and Listeners**: Access a collection of essential [commands](https://github.com/bot-ts/framework/blob/master/src/commands) and [listeners](https://github.com/bot-ts/framework/blob/master/src/listeners), including an advanced "eval" command.
- **Package Scripts**: Manage tasks with scripts in [package.json](https://github.com/bot-ts/framework/blob/master/package.json). Full documentation available [here](https://ghom.gitbook.io/bot-ts/command-line/overview).
- **Default ORM Configuration**: Preconfigured [Knex](http://knexjs.org/) ORM with [sqlite3](https://www.npmjs.com/package/sqlite3) using [@ghom/orm](https://www.npmjs.com/package/@ghom/orm).
- **Efficient Pagination**: Implement efficient pagination systems as shown in the [help command](https://github.com/bot-ts/framework/blob/master/src/commands/help.native.ts#L34).
- **Rapid Build Process**: Experience build speeds faster than 100ms with [ESBuild](https://esbuild.github.io).
- **TypeScript Typing Checks**: Automated GitHub Actions for TypeScript checks can be found [here](https://github.com/bot-ts/framework/blob/master/.github/workflows/test.yml).
- **Beautiful Logging**: Enhanced console logging with [@ghom/logger](https://www.npmjs.com/package/@ghom/logger).
- **Framework Updater**: Update your framework seamlessly with [Gulp](https://gulpjs.com/).
- **Docker Support**: Launch your bot using [Docker](https://www.docker.com) with the provided [Dockerfile](https://github.com/bot-ts/framework/blob/master/Dockerfile) or [compose.yml](https://github.com/bot-ts/framework/blob/master/compose.yml).

## Why using bot.ts ?

Code faster and without the hassle. Choosing **bot.ts** is choosing control.

* It's not a lib! You can edit all files easily.
* All is already configured.
* I recommend it for learning TypeScript.
* It uses ESBuild for boosted productivity

## Annexes

* [Documentation](https://ghom.gitbook.io/bot-ts/)
* [Package](https://www.npmjs.com/package/@ghom/bot.ts-cli)
* [Discord](https://discord.gg/kYxDWWQJ8q)
* [Github](https://github.com/bot-ts)
* [Community](https://discord.gg/3vC2XWK)
