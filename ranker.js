"use strict";
const opts = require('./auths')
const fs = require('fs')
const Discord = require("discord.js")

const bot = new Discord.Client()
let members = JSON.parse(fs.readFileSync(opts.data))

function main(){
  try{
    console.log("Starting...\n")
    bot.login(opts.discordToken)
  }
  catch (e) {
      bot.destroy()
      main()
  }
}

main()

function convert(score, cur) {
	if (score-(((5/3.0)*(cur**3))+((45/2.0)*(cur**2))+((455/6.0)*cur)) >= 0){
		return convert(score,cur+1)
	} else {
		return cur-1
	}
}

function getScore(user){
	return ((members[user]["msgs"]*15) + (members[user]["rctn"]*5) + (members[user]["voce"]));
}

bot.on('message', async (Message) => {
	if (Message.cleanContent.startsWith("!rank")) {
		var exp = getScore(Message.author.id)
		var level = convert(exp,0)
		var next = (((5/3.0)*((level+1)**3))+((45/2.0)*((level+1)**2))+((455/6.0)*(level+1)))-exp;
		let del = new Discord.RichEmbed()
            .setColor('#3377ff')
            .setAuthor(Message.author.tag, Message.author.iconURL)
            .addField("Level:",level, true)
			.addField("Total Experience:",exp | 0, true)
			.addField("To next level:",next | 0, true)
			.addField("Message Experience:",(members[Message.author.id]["msgs"]*15) | 0, true)
			.addField("Reaction Experience:",(members[Message.author.id]["rctn"]*5) | 0, true)
			.addField("Voice Experience:",(members[Message.author.id]["voce"]) | 0, true)
		await Message.channel.send(del);
	} else {
		if (Message.author.id in members) {
			var level = convert(getScore(Message.author.id),0)
			members[Message.author.id]["msgs"] += 1;
			if (level != convert(getScore(Message.author.id),0)) {
				var r = await Message.author.createDM()
				await r.send("Congrats! You've reached level " + (level+1) + "!");
			}
		} else {
			members[Message.author.id] = {"msgs":1,"rctn":0,"voce":0,"stmp":0}
		}
		fs.writeFileSync(opts.data,JSON.stringify(members))
	}
})

bot.on("messageReactionAdd", async (messageReaction, user) => {
	if (user.id in members) {
		members[user.id]["rctn"] += 1;
	} else {
		members[Message.author.id] = {"msgs":0,"rctn":1,"voce":0,"stmp":0}
	}
	fs.writeFileSync(opts.data,JSON.stringify(members))
})

bot.on('voiceStateUpdate', async (oldState, newState) => {
	
	console.log(newState.voiceChannelID);

	if (oldState.voiceChannelID === undefined && newState.voiceChannelID !== undefined) {
		members[newState.user.id]["stmp"] = Date.now()
		fs.writeFileSync(opts.data,JSON.stringify(members))
	} else if (oldState.voiceChannelID !== undefined && newState.voiceChannelID === null) {
		members[oldState.user.id]["voce"] += Math.floor((Date.now() - members[oldState.user.id]["stmp"]) / 3600000);
		members[oldState.user.id]["stmp"] = 0;
		fs.writeFileSync(opts.data,JSON.stringify(members))
	}
})