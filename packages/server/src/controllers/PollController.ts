import * as tmi from "tmi.js";

interface PollObject {
  [key: string]: any;
}

/* interface ReferencesObject {
  [key: string]: any;
} */

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

  //números a letras: 1 -> A
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

  //letras a números: A -> 1
  SSColumnToNum(str: string) {
    let out = 0;
    let len = str.length;
    for (let pos = 0; pos < len; pos++) {
      out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
    }
    return out;
  }

  //inicializa el cliente de twitch
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

  //crea o recrea/actualiza elementos de la votación
  set(channel: string, entryOptions: any) {
    const currentPoll = this.polls[channel] || {};
    const {total = 0, options = {}, status = "open"} = currentPoll;
    let {references = {}} = currentPoll;
    //difiere los nuevos de los actuales para mantener estado
    Object.keys(entryOptions).map((id) => {
      if (!options[id]) {
        entryOptions[id].valorations = {};
        entryOptions[id].count = 0;
      } else {
        delete entryOptions[id];
      }
    });

    const mergedOptions = {...options, ...entryOptions};
    /* const references: ReferencesObject =  */
    const existingReferences = Object.values(references);
    //crea IDs de referencias tipo "atajos" al ID de producto MercadoLibre
    //los eliminados no los vuelve a utilizar para no ingresar votos erróneos
    //creyendo que estaría votando otro que ocupó su lugar al ser eliminado
    Object.keys(mergedOptions).map((k, i) => {
      if (existingReferences.includes(k)) return;
      let from = 1;
      while (!mergedOptions[k].reference) {
        const letter = this.numToSSColumn(i + from);
        if (!references[letter]) {
          references[letter] = k;
          mergedOptions[k].reference = letter;
          break;
        }
        from++;
      }
    });

    this.polls[channel] = {
      status: status,
      total: total,
      options: mergedOptions,
      references,
    };
    //actualiza al cliente la votación
    this.updateClientPoll(channel);
  }

  //elimina un item de la votación y actualiza los contadores totales
  removeItem(channel: string, id: string) {
    let poll = this.polls[channel];
    const idData = poll.options[id];
    if (idData) {
      const {total} = poll;
      const count = poll.options[id].count;
      poll.total = total - count;
      delete poll.options[id];
      if (!Object.keys(poll.options).length) poll = {};
      this.polls[channel] = poll;
      this.updateClientPoll(channel);
    }
  }

  //envía al canal del socket un evento actualizando la votación
  updateClientPoll(channel: string) {
    this.server.to(channel).emit("poll-data", this.polls[channel]);
  }

  //alterna el estado de la votación permitiendo o no votar
  status(channel: string) {
    const status = this.polls[channel].status;
    const newStatus = status === "open" ? "closed" : "open";
    this.polls[channel].status = newStatus;
    this.updateClientPoll(channel);
  }

  //setea métodos de escucha del chat
  listeners() {
    //regex para detección y agrupación
    const commandRegex = new RegExp(/(!)(VOTE|vote) (\w{1,}) ?(.*)/);
    this.twitch.on("chat", (channel: any, user: any, message: any) => {
      //el channel viene con # delante, lo elimino
      channel = channel.replace("#", "");
      const status = this.polls[channel].status;
      //desestima la votación no está abierta
      if (status !== "open") return;

      const {username} = user;

      //detecto según regex si es un mensaje común o un comando válido
      const command = message.match(commandRegex);
      if (!command) return;

      //extraigo todo, !, tipo de comando, ID a votar y su valoración
      let [full, key, type, id, valoration = ""] = command;
      type = type.toUpperCase();
      id = id.toUpperCase();
      if (key === "!") {
        switch (type) {
          case "VOTE":
            this.vote(channel, username, id, valoration);
            break;
          default:
            console.error(`command ${type} not recognized`);
            break;
        }
      }
    });
  }

  vote(channel: string, username: string, id: string, valoration: string) {
    let nonExistingVote = true;
    const poll = this.polls[channel];
    id = poll.references[id] || id;
    if (!poll.options[id]) return;
    //busca una propiedad en algún producto que sea el usuario que haya votado
    Object.keys(poll.options).map((optionId) => {
      //si votó, elimino su comentario y reduzco en 1 el contador
      if (poll.options[optionId].valorations[username]) {
        nonExistingVote = false;
        poll.options[optionId].count--;
        delete poll.options[optionId].valorations[username];
      }
    });
    //añado la valoración al elemento
    poll.options[id].valorations[username] = {
      message: (valoration || "").trim(),
      timestamp: +new Date(),
    };
    poll.options[id].count++;
    //según si votó o no anteriormente, suma 1 al total
    //o lo deja igual por haberlo movido a otro elemento
    if (nonExistingVote) poll.total++;
    this.polls[channel] = poll;
    //actualizo el cliente con la nueva información
    this.updateClientPoll(channel);
  }
}

export default PollController;
