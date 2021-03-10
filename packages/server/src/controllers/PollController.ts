import * as tmi from "tmi.js";

interface PollObject {
  [key: string]: any;
}

interface ReferencesObject {
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

  numToSSColumn(num: number) {
    let s: string = "",
      t: any;

    while (num > 0) {
      t = (num - 1) % 26;
      s = String.fromCharCode(65 + t) + s;
      num = ((num - t) / 26) | 0;
    }
    return s || "";
  }

  SSColumnToNum(str: string) {
    let out = 0;
    let len = str.length;
    for (let pos = 0; pos < len; pos++) {
      out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
    }
    return out;
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

    const mergedOptions = {...options, ...entryOptions};
    const references: ReferencesObject = {};
    Object.keys(mergedOptions).map((k, i) => {
      const letter = this.numToSSColumn(i + 1);
      if (!letter) return;
      references[letter] = k;
      mergedOptions[k].reference = letter;
    });
    this.polls[channel] = {
      status: status,
      total: total,
      options: mergedOptions,
      references,
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
    const newStatus = status === "open" ? "closed" : "open";
    this.polls[channel].status = newStatus;
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
            const poll = this.polls[channel];
            id = poll.references[id] || id;
            Object.keys(poll.options).map((optionId) => {
              if (poll.options[optionId].valorations[username]) {
                nonExistingVote = false;
                poll.options[optionId].count--;
                delete poll.options[optionId].valorations[username];
              }
            });
            if (!poll.options[id]) return;
            poll.options[id].valorations[username] = {
              message: valoration || "",
              timestamp: +new Date(),
            };
            poll.options[id].count++;
            if (nonExistingVote) poll.total++;
            this.polls[channel] = poll;
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
