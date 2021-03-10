import * as tmi from "tmi.js";

interface PollObject {
  [key: string]: any;
}

class PollController {
  [x: string]: any;
  twitch: any;
  polls: PollObject;
  server: any;

  constructor(server: any) {
    this.twitch = false;
    this.server = server;
    this.polls = {};
  }

  start() {
    this.twitch = new tmi.Client({
      options: {},
      connection: {
        port: 7000,
        reconnect: true,
        secure: true,
      },
      channels: [],
    });
    this.twitch.connect().catch();
  }

  set(channel: string, entryOptions: any) {
    const currentPoll = this.polls[channel] || {};
    const {total = 0, options = {}, status = "open"} = currentPoll;
    Object.keys(entryOptions).map((id) => {
      if (!options[id]) {
        entryOptions[id].valorations = {};
        entryOptions[id].count = 0;
      } else {
        delete entryOptions[id];
      }
    });
    this.polls[channel] = {
      status: status,
      total: total,
      options: {...options, ...entryOptions},
    };
    this.updateClientPoll(channel);
  }

  removeItem(channel: string, id: string) {
    const idData = this.polls[channel].options[id];
    if (idData) {
      const {total} = this.polls[channel];
      const count = this.polls[channel].options[id].count;
      this.polls[channel].total = total - count;
      delete this.polls[channel].options[id];
      if (!Object.keys(this.polls[channel].options).length) this.polls[channel] = {};
      this.updateClientPoll(channel);
    }
  }

  updateClientPoll(channel: string) {
    this.server.to(channel).emit("poll-data", this.polls[channel]);
  }

  status(channel: string) {
    const status = this.polls[channel].status;
    this.polls[channel].status = status === "open" ? "closed" : "open";
    this.updateClientPoll(channel);
  }

  listeners() {
    const commandRegex = new RegExp(/(!)(VOTE|vote) (\w{1,}) ?(.*)/);
    this.twitch.on("chat", (channel: any, user: any, message: any) => {
      channel = channel.replace("#", "");
      const status = this.polls[channel].status;
      if (status !== "open") return;

      const {username} = user;

      const command = message.match(commandRegex);
      if (!command) return;

      let [full, key, type, id, valoration = ""] = command;
      type = type.toUpperCase();
      id = id.toUpperCase();
      if (key === "!") {
        switch (type) {
          case "VOTE":
            let nonExistingVote = true;
            Object.keys(this.polls[channel].options).map((optionId) => {
              if (this.polls[channel].options[optionId].valorations[username]) {
                nonExistingVote = false;
                this.polls[channel].options[optionId].count--;
                delete this.polls[channel].options[optionId].valorations[username];
              }
            });
            if (!this.polls[channel].options[id]) return;
            this.polls[channel].options[id].valorations[username] = {
              message: valoration || "",
              timestamp: +new Date(),
            };
            this.polls[channel].options[id].count++;
            if (nonExistingVote) this.polls[channel].total++;
            this.updateClientPoll(channel);
            break;
          default:
            console.error(`command ${type} not recognized`);
            break;
        }
      }
    });
  }
}

export default PollController;
