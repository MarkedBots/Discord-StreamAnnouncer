import * as lowdb from "lowdb";
import * as FileSync from "lowdb/adapters/FileSync";
import * as request from "request-promise";

export class Database {
    private db: lowdb.LowdbSync<any>;
    private usersModel: Users;

    constructor() {
        this.db = lowdb(new FileSync("stream-announcer.json"));

        this.db.defaults({
            "config": {
                "discord": {
                    "announcmentChannelId": "insertchannelidhere",
                    "commandRoleId": "insertroleidhere",
                    "botToken": "inserttokenhere",
                    "messages": []
                },
                "checkTime": 15000,
                "users": []
            },
            "history": {}
        }).write();

        this.usersModel = new Users(this.db);
    }

    public database(): lowdb.LowdbSync<any> {
        return this.db;
    }

    public users(): Users {
        return this.usersModel;
    }
}

class Users {
    constructor(private db: lowdb.LowdbSync<any>) {}

    public all(): Array<string> {
        return this.db.get("config.users").value();
    }

    public add(username: string): boolean {
        request({
            method: "GET",
            uri: `https://www.stream.me/api-user/v1/${username}/channel`,
            json: true
        }).then(response => {
            let userId = response.userPublicId;

            if (!this.db.get("config.users").value().includes(userId)) {
                this.db.get("config.users").push(userId).write();
                this.db.set(`history.${userId}`, []).write();
            }

            return true;
        }).catch(error => {
            console.log(error);
            return false;
        });

        return true;
    }

    public remove(username: string): boolean {
        request({
            method: "GET",
            uri: `https://www.stream.me/api-user/v1/${username}/channel`,
            json: true
        }).then(response => {
            let userId = response.userPublicId;

            if (this.db.get("config.users").value().includes(userId)) {
                console.log(`Removing ${username} (${userId}) from the list.`);

                let arr: Array<string> = this.all();
                let index: number = arr.indexOf(userId);

                if (index > -1) {
                    arr.splice(index, 1);
                }

                this.db.set("config.users", arr).write();
                this.db.unset(`history.${userId}`).write();
            }

            return true;
        }).catch(error => {
            console.log(error);
            return false;
        });

        return true;
    }
}