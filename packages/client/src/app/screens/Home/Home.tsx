import React, {FC, useEffect, useState, ChangeEvent} from "react";
import SocketIO from "socket.io-client";

import RealTrends from "~/app/components/RealTrends";
import Modal from "~/app/components/Modal";
import Poll from "~/app/components/Poll";

import styles from "./Home.module.scss";

const socket = SocketIO.io("http://localhost:5000");

const status = {
  open: "en curso",
  closed: "pausada",
};

const Home: FC = () => {
  const [poll, setPoll] = useState({});
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState({});
  const [products, setProducts] = useState([]);
  const [username, setUsername] = useState(location.pathname.slice(1));

  useEffect(() => {
    socket.on("get-username", () => socket.emit("set-username", username));
    socket.on("poll-data", (data: any) => {
      setPoll({...data});
      setSelected({...data.options});
    });
  }, []);

  useEffect(() => {
    if (!modal) {
      setProducts([]);
      createPoll();
    }
  }, [modal]);

  const createPoll = () => {
    if (Object.keys(selected).length) socket.emit("set-poll", selected);
  };

  const search = async (e: ChangeEvent<HTMLInputElement>) => {
    const response = await fetch(
      `https://api.mercadolibre.com/sites/MLM/search?q=${e.target.value}`,
    );
    const body = await response.json();
    const results = body.results.map(({id, title, thumbnail}) => ({id, title, thumbnail}));

    setProducts(results);
  };

  let inDebounce: any;
  const debounce = (delay: number, fn: () => null) => {
    return (args) => {
      clearTimeout(inDebounce);
      inDebounce = setTimeout(() => fn(args), delay);
    };
  };

  const selectProduct = (item: any) => {
    const {id} = item;
    const tmpItem = {...item};

    delete tmpItem.id;

    setSelected((prevState) => {
      const state: any = {...prevState};

      if (state[id]) delete state[id];
      else state[id] = tmpItem;

      return state;
    });
  };

  const changeStatus = () => {
    socket.emit("poll-status");
  };

  const removeItem = (id: string) => {
    socket.emit("remove-item", id);
  };

  const reset = () => {
    socket.emit("reset");
  };

  const login = (e) => {
    e.preventDefault();
    const username = e.target[0].value;

    location.replace(username);
  };

  const close = () => {
    setSelected({});
    setProducts([]);
    setModal(false);
  };

  const isOpen = poll.status == "open";

  if (!username)
    return (
      <div className={styles.container}>
        <RealTrends />
        <form onSubmit={login}>
          <input
            autoFocus
            name="username"
            placeholder="Ingresa tu nombre de usuario de Twitch.tv"
            onChange={search}
          />
          <button type="submit">Continuar</button>
        </form>
      </div>
    );

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <RealTrends />
        <button onClick={() => setModal(!modal)}>Añadir artículos</button>
        {poll.status && (
          <>
            <button className={isOpen ? "warning" : "success"} onClick={changeStatus}>
              {isOpen ? "Pausar" : "Reanudar"}
            </button>
            <button className="danger" onClick={reset}>
              Reiniciar
            </button>
          </>
        )}
      </header>
      <div>Votación {status[poll.status] || "pendiente"}</div>
      {poll.status && <div>Total: {poll.total || 0}</div>}
      {poll.status == "closed" && <div>Debes reanudar para recibir nuevos votos.</div>}
      <Poll poll={poll} remove={(id: string) => removeItem(id)} />

      <Modal enabled={modal} setModal={() => setModal(!modal)}>
        <>
          <input
            autoFocus
            onChange={(e) => {
              debounce(200, search)(e);
            }}
          />
          <button
            className="success"
            disabled={Object.keys(selected).length < 2}
            onClick={() => setModal(!modal)}
          >
            Confirmar
          </button>
          <button onClick={close}>Cerrar</button>
          <div className={styles.grid}>
            {products.map((item, i) =>
              !poll?.options?.[item.id] ? (
                <div
                  key={`meli-product-${i}`}
                  className={selected[item.id] ? styles.selected : ""}
                  onClick={() => selectProduct(item)}
                >
                  <img alt={item.title} src={item.thumbnail} width={96} />
                  <h4>{item.title}</h4>
                </div>
              ) : null,
            )}
          </div>
        </>
      </Modal>
    </main>
  );
};

export default Home;
