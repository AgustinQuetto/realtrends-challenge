import * as io from "socket.io";

import PollController from "./controllers/PollController";

/* interface PollList {
  [key: string]: PollController;
}

const Polls: PollList = {}; */

const server = new io.Server(5000, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const PollsInstance = new PollController(server);
PollsInstance.start();
PollsInstance.listeners();

server.on("connection", (socket) => {
  let channel = "";

  socket.emit("get-username");

  socket.on("set-username", (_channel: string) => {
    if (!_channel) socket.disconnect();
    channel = _channel;
    const userPoll = PollsInstance.polls[channel] || false;
    socket.join(channel);
    if (userPoll) {
      server.to(channel).emit("poll-data", userPoll);
    }
  });

  socket.on("poll-status", () => {
    PollsInstance.status(channel);
  });

  socket.on("remove-item", (id: string) => {
    PollsInstance.removeItem(channel, id);
  });

  socket.on("set-poll", (data: any) => {
    if (!channel) return;
    const currentChannels = PollsInstance.twitch.getChannels();
    if (!currentChannels.includes(channel)) PollsInstance.twitch.join(channel);
    const userPoll = PollsInstance.polls[channel] || {};
      PollsInstance.set(channel, data);
  });
});
