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

//Instancia de controlador de votaciones
const PollsInstance = new PollController(server);
PollsInstance.start(); //comienzo
PollsInstance.listeners(); //añade los métodos de escucha del chat

server.on("connection", (socket) => {
  let channel = "";

  socket.emit("get-username");

  //seteo de username/channel
  socket.on("set-username", (_channel: string) => {
    if (!_channel) socket.disconnect();
    channel = _channel;
    socket.join(channel);
    //chequea si posee una votación activa
    const userPoll = PollsInstance.polls[channel];
    if (userPoll) {
      PollsInstance.updateClientPoll(channel);
    }
  });

  //seteo de estado de la votación
  socket.on("poll-status", () => {
    PollsInstance.status(channel);
  });

  //elimina un item de la votación
  socket.on("remove-item", (id: string) => {
    PollsInstance.removeItem(channel, id);
  });

  socket.on("set-poll", (data: any) => {
    if (!channel) return;
    const currentChannels = PollsInstance.twitch.getChannels();
    //ingresa al canal, si no lo estaba, para lectura de mensajes
    if (!currentChannels.includes(channel)) PollsInstance.twitch.join(channel);
    PollsInstance.set(channel, data);
  });
});
