import * as app from "../app.js"

export type SlashType = app.discord.ApplicationCommandData
export type SlashDeployment = {deploy: {guilds?: string [], global: boolean}}
export type SlashBuilder =
  | app.SlashCommandBuilder
  | app.SlashCommandSubcommandBuilder
  | app.SlashCommandSubcommandGroupBuilder
  | app.SlashCommandOptionsOnlyBuilder
  | app.SlashCommandSubcommandsOnlyBuilder


export class Slash {
  static deploy(client: app.Client<true>, slash: SlashType, deployment?: SlashDeployment) {    
    if (deployment) {
      if (deployment.deploy.global) {
        client.application.commands.set([slash])
      }

      if (deployment.deploy.guilds) {
        deployment.deploy.guilds.forEach(guild => {
          client.application.commands.set([slash], guild)
        })
      }
    }
  }
}