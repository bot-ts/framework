const Discord = require('discord.js')
const { promisify } = require('util')
const Color = require(__dirname+'/color.js')
const fs = require('fs')
const writeFile = promisify(fs.writeFile)
const client  = new Discord.Client()
const prefix = '}'

var save = JSON.parse(fs.readFileSync(__dirname+"/save.json"))
var data = JSON.parse(fs.readFileSync(__dirname+"/data.json"))
var progress = false
var activity = {}

client.login(data.token)

client.on("error", err=>{});

client.on("ready", async function(){
	await client.user.setActivity(client.guilds.size+' guilds. [ 🔓 Public Bot ]',{type: 'WATCHING'})
	client.guilds.forEach(async function(guild){
		await debug(guild)
		console.log(`[ ${guild.memberCount} members ]\t[ ${guild.roles.size} roles ]\t${guild.name}`)
	})
})

/*client.on('presenceUpdate', async function(oldMember,newMember){
  	await debug(newMember.guild)
  	presenceUpdate = (
	    oldMember.presence.status === "offline" || 
	    newMember.presence.status === "offline"
  	)
  	if(
  		presenceUpdate && 
  		saved(newMember.guild).auto &&
  		!activity[newMember.guild.id]
  	){
  		return await colorGuild(newMember.guild)
  	}
})*/

client.on("message",async function(message){
	if(message.system || message.author.bot || message.channel.type === "dm")return;
	if(message.member.id !== message.guild.owner.id &&  message.author.id !== "352176756922253321")return;
	
	await debug(message.guild)
	
	let sendColors = async function(){
		for(var i=0; i<saved(message.guild).colors.length; i++){
			embed = new Discord.RichEmbed()
				.setDescription(`color ${i+1} : \`${saved(message.guild).colors[i]}\`\n`)
				.setColor(saved(message.guild).colors[i])
			await message.channel.send(embed)
		}
	}

	if(message.content.startsWith(prefix + "mode")){
		for(mode in data.modes){
			if(message.content.toUpperCase().includes(mode)){
				saved(message.guild).mode = mode
				await saveFile()
				let embed = new Discord.RichEmbed()
					.setAuthor(`Nouveau mode appliqué : ${mode} ✅`,client.user.avatarURL)
					.setDescription(data.modes[mode])
					.setColor(message.guild.me.displayColor)
				return await message.channel.send(embed)
			}
		}
		let embed = new Discord.RichEmbed()
			.setAuthor(`Mode inconnu ❌`,client.user.avatarURL)
			.setDescription(`Essayez avec l'un des modes suivants :`)
			.setColor(message.guild.me.displayColor)
		for(mode in data.modes){
			embed.addField(`${mode} ↓`,data.modes[mode],false)
		}
		return await message.channel.send(embed)
	}
	if(message.content.startsWith(prefix + "auto")){
		saved(message.guild).auto = !saved(message.guild).auto
		await saveFile()
		let embed = new Discord.RichEmbed()
			.setAuthor(`Couleurs automatiques ${saved(message.guild).auto?"":"dés"}activées ✅`,client.user.avatarURL)
			.setDescription(`Sert à adapter la taille du dégradé au nombre de rôles affichés.`)
			.setColor(message.guild.me.displayColor)
		return await message.channel.send(embed)
	}
	if(message.content.startsWith(prefix + "color")){
		let args = message.content
			.split(" ")
			.map(arg=>arg.trim())
			.filter(arg=>Color.test(arg)!==false)
		if(args.length > 0){
			saved(message.guild).colors = args.slice(0)
			await saveFile()
			let embed = new Discord.RichEmbed()
				.setAuthor(`Couleurs enregistrées ✅`,client.user.avatarURL)
				.setDescription(`Pour tester votre nouvelle palette, effectuez la commande \`${prefix}refresh\`.`)
				.setColor(message.guild.me.displayColor)
			await message.channel.send(embed)
			return await sendColors()
		}
		let embed = new Discord.RichEmbed()
			.setAuthor(`Couleurs inconnues ❌`,client.user.avatarURL)
			.setDescription(`Vous devez donner deux codes couleur de type **hex**.`)
			.setColor(message.guild.me.displayColor)
		return await message.channel.send(embed)
	}
	if(message.content.startsWith(prefix + "reverse")){
		saved(message.guild).colors.reverse()
		await saveFile()
		let embed = new Discord.RichEmbed()
			.setAuthor(`Couleurs enregistrées ✅`,client.user.avatarURL)
			.setDescription(`Pour tester votre nouvelle palette, effectuez la commande \`${prefix}refresh\`.`)
			.setColor(message.guild.me.displayColor)
		return await message.channel.send(embed)
	}
	if(message.content.startsWith(prefix + "refresh")){
		if(!activity[message.guild.id]){
			let wait = client.emojis.get("560972897376665600")
			let embed = new Discord.RichEmbed()
				.setAuthor(`Modification des couleurs en cours...`,wait.url)
				.setColor(message.guild.me.displayColor)
			let m = await message.channel.send(embed)
			let log = await colorGuild(message.guild)
			if(log!==false){
				embed.setAuthor(`Modification des couleurs effectuée ✅`,client.user.avatarURL)
				embed.setDescription(log)
			}else{
				embed.setAuthor(`Permissions manquantes ❌`,client.user.avatarURL)
				embed.setDescription(`${client.user.username} ne peux pas modifier les rôles se trouvant au dessus de lui. Il lui faut également la permissions de gérer les rôles : \`MANAGE_ROLES\``)
			}
			return await m.edit(embed)
		}
		let embed = new Discord.RichEmbed()
			.setAuthor(`Modification déjà en cours ❌`,client.user.avatarURL)
			.setDescription(`Veuillez réessayer dans quelques secondes.`)
			.setColor(message.guild.me.displayColor)
		return await message.channel.send(embed)
	}
	if(message.content.startsWith(prefix + "defaut")){
		let embed = new Discord.RichEmbed()
			.setAuthor(`Modification des couleurs en cours...`,client.user.avatarURL)
			.setColor(message.guild.me.displayColor)
		let m = await message.channel.send(embed)
		let roles = message.guild.roles.array()
		for(var i=0; i<roles.length; i++){
			if(message.guild.me.highestRole.comparePositionTo(roles[i]) >= 0){
				await roles[i].setColor("DEFAULT").catch(err=>{})
			}
		}
		embed.setAuthor(`Modification des couleurs effectuée ✅`,client.user.avatarURL)
		return await m.edit(embed)
	}
	if(message.content.startsWith(prefix + "help")){
		let link = await client.generateInvite(['MANAGE_ROLES'])
		let embed = new Discord.RichEmbed()
			.setAuthor(`Menu d'aide de ${client.user.username}`,client.user.avatarURL)
			.setDescription(
				`Permission de modifier les rôles : \`${message.guild.me.hasPermission('MANAGE_ROLES')}\`\n`+
				`Rôles non modifiables : \`${message.guild.roles.filter(role=>message.guild.me.highestRole.comparePositionTo(role) < 0).size}\`\n`+
				`Rôles modifiables : \`${message.guild.roles.filter(role=>message.guild.me.highestRole.comparePositionTo(role) >= 0).size}\`\n`+
				`Invitation du bot : [clique ici](${link})`
			)
			.setColor(message.guild.me.displayColor)
		if(message.content.includes("im")){
			embed.setImage("https://media.discordapp.net/attachments/554206505897951252/564043328891650048/help_markdown_dark.png")
		}else{
			embed.addField("A savoir ↓",`*Ne peut modifier que les rôles qui se trouvent en dessous du sien.\nLa palette de couleur peut contenir une à plusieur couleurs.\nLe mode \`auto\` rend le dégradé plus esthétique,\nil ne colore que les rôles affichés séparément.*`,false)
			embed.addField("Commands ↓",
				`\`${prefix}color <hexcodes>\`\n`+
				`\`${prefix}reverse\`\n`+
				`\`${prefix}refresh\`\n`+
				`\`${prefix}auto\`\n`+
				`\`${prefix}mode <mode>\``
			,true)
			embed.addField("Desc ↓",
				`[ configure color palette ]\n`+
				`[ reverse color palette ]\n`+
				`[ apply color palette ]\n`+
				`[ auto color on/off ]\n`+
				`[ change color mode ]`
			,true)
		}
		await message.channel.send(embed)
		embed = new Discord.RichEmbed()
			.setAuthor(`Configuration ${message.guild.name}`,message.guild.iconURL)
			.setDescription(
				`auto : \`${saved(message.guild).auto}\`\n`+
				`mode : \`${saved(message.guild).mode}\``
			)
			.setColor(message.guild.me.displayColor)
		await message.channel.send(embed)
		await sendColors()
	}
})

function saved(guild){
	return save[guild.id]
}
async function saveFile(){
	if(!progress){
		progress = true
		await writeFile(__dirname+'/save.json',JSON.stringify(save,null,"\t")).catch(err=>{})
		progress = false
	}
}
async function colorGuild(guild){
	if(!guild.me.hasPermission("MANAGE_ROLES"))return false;
	activity[guild.id] = true
	let log = []
	let roles = []
	let length = 0
	/*if(saved(guild).auto){
		roles = hoistDisplayedRoles(guild)
	}else{*/
		roles = guild.roles.filter(function(role){
			return guild.me.highestRole.comparePositionTo(role) >= 0 && (!saved(guild).auto || role.hoist)
		}).map(role=>role.id)
	//}
	length = guild.roles.filter(role=>roles.includes(role.id)).size
	let colors = []
	if(saved(guild).mode === "GRADIENT"){
		colors = Color.gradient(
			saved(guild).colors.map(hex=>new Color(hex)),length
		)
	}else if(saved(guild).mode === "REFLECT"){
		colors = Color.gradient(
			saved(guild).colors.map(hex=>new Color(hex)),
			Math.floor(length/2)
		).concat(Color.gradient(
			saved(guild).colors.map(hex=>new Color(hex)).reverse(),
			Math.ceil(length/2)
		))
	}else if(saved(guild).mode === "RANDOM"){
		for(var i=0; i<length; i++){
			colors.push(Color.random())
		}
	}else if(saved(guild).mode === "RAINBOW"){
		colors = Color.gradient([
				new Color("#ED1E24"),
				new Color("#F47521"),
				new Color("#F8EC24"),
				new Color("#69BD45"),
				new Color("#6CCCDE"),
				new Color("#3953A4"),
				new Color("#7B4FA0")
			],length
		)
	}else{
		activity[guild.id] = false
		return;
	}
	let allRoles = guild.roles.array().sort(sortByPos)
	var c=0
	var d=0
	for(var i=0; i<allRoles.length; i++){
		if(roles.includes(allRoles[i].id)){
			await allRoles[i].setColor(colors[c].hex).catch(err=>{})
			c++
		}else if(guild.me.highestRole.comparePositionTo(allRoles[i]) >= 0){
			await allRoles[i].setColor("DEFAULT").catch(err=>{})
			d++
		}
	}
	log.push(`**${c}** applied colors`)
	log.push(`**${d}** retired colors`)
	activity[guild.id] = false
	return log.join("\n")
}
function hoistDisplayedRoles(guild){
	let roles = []
  	guild.members.filter(function(member){
  		return member.presence.status !== 'offline'
  	}).forEach(function(member){
	    let displayedRole = member.roles.filter(function(role){
	    	return role.hoist && guild.me.highestRole.comparePositionTo(role) >= 0
	    }).sort(sortByPos).first()
	    if(displayedRole!==null&&displayedRole!==undefined){
	      	roles.push(displayedRole.id)
	    }
  	})
  	return roles
}
function sortByPos(a,b){
	return b.calculatedPosition - a.calculatedPosition
}
async function debug(guild){
	if(!save.hasOwnProperty(guild.id)){
		save[guild.id] = copy(data.guild)
		await client.user.setActivity(client.guilds.size+' guilds. [ 🔓 Public Bot ]',{type: 'WATCHING'})
	}
	if(!activity.hasOwnProperty(guild.id)){
		activity[guild.id] = false
	}
}
function copy(obj){
  	return JSON.parse(JSON.stringify(obj));
}
