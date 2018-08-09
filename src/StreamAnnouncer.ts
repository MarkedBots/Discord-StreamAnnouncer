import * as Discord from "discord.js";
import { Database } from "./lib/Database";
import * as request from "request-promise";

let discord = new Discord.Client();
let database = new Database();
let commandRoleId = database.database().get("config.discord.commandRoleId").value();
let announcementChannelId = database.database().get("config.discord.announcmentChannelId").value();

discord.on("ready", () => {
    console.log("Discord client ready.");
    console.log(`Allowing users with the role id ${commandRoleId} to add streamers`);

    setInterval(() => {
        let ids = database.users().all();
        request({
            method: "GET",
            uri: "https://www.stream.me/api-channel/v1/channels?publicIds=" + ids.join(","),
            json: true
        }).then((response) => {
            response.forEach((user: any) => {
                let streams = user.streams;
            });
        }).catch((error) => {
            console.log(error);
        });
    }, database.database().get("config.checkTime").value());
});

discord.on("error", (error) => {
    console.error(error);
});

discord.on("message", (message: any) => {
    if (message.member.roles.has(commandRoleId)) {
        if (message.content.indexOf("!addstreamer") > -1) {
            let parameters = message.content.split(" ").slice(1);

            parameters = parameters.filter((element: any) => {
                return (element.length > 0 && element !== undefined && element !== null);
            });


            if (parameters.length < 1) {
                message.delete();
                message.reply(`${message.author.username}, you must include a StreamMe username.`)
                       .then((msg: any) => {
                           msg.delete(6000);
                       });

                return;
            }

            let username = parameters[0];

            message.delete();

            if (database.users().add(username)) {
                message.reply(`${message.author.username}, the streamer ${username} has been added.`)
                       .then((msg: any) => {
                           msg.delete(6000);
                       });
            } else {
                message.reply(`${message.author.username}, something went wrong. Is ${username} a valid streamer name?`)
                       .then((msg: any) => {
                           msg.delete(6000);
                       });
            }
        }
    }
});

let token = database.database().get("config.discord.botToken").value();

discord.login(token);