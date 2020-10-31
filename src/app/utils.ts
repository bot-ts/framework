import Discord from "discord.js"

export const prefix = process.env.PREFIX ?? "}"

export function avatar(
  user: Discord.User | null,
  size: Discord.ImageSize = 128
) {
  return user?.displayAvatarURL({ dynamic: true, size })
}

export function memberColor(
  member: Discord.GuildMember | null
): Discord.ColorResolvable {
  return member?.roles.color?.color ?? "BLURPLE"
}

export function code(text: string, lang: string = ""): string {
  return "```" + lang + "\n" + text + "\n```"
}
