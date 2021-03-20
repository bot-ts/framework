import Discord from "discord.js"

import * as origin from "../app/handler"

export interface CommandMessage {}
export interface GuildMessage {}
export interface DirectMessage {}
export interface Argument<Message extends origin.CommandMessage> {}
export interface Positional<Message extends origin.CommandMessage> {}
export interface Flag<Message extends origin.CommandMessage> {}
export interface Command<
  Message extends origin.CommandMessage = origin.CommandMessage
> {}
export interface Listener<EventName extends keyof Discord.ClientEvents> {}
