import React, {FC, useEffect, useState, ChangeEvent} from "react";
import SocketIO from "socket.io-client";

import Modal from "~/app/components/Modal";
import Poll from "~/app/components/Poll";
import logo from "~/assets/logo.svg";

import styles from "./Home.module.scss";

const socket = SocketIO.io("http://localhost:5000");

const status = {
  open: "en curso",
  closed: "cerrada",
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
    });
  }, []);

  useEffect(() => {
    if (!modal) {
      setProducts([]);
      createPoll();
    }
  }, [modal]);

  const createPoll = () => {
    const data = selected;

    socket.emit("set-poll", data);
  };

  const search = async (e: ChangeEvent<HTMLInputElement>) => {
    const response = await fetch(
      `https://api.mercadolibre.com/sites/MLM/search?q=${e.target.value}`,
    );
    const body = await response.json();
    const results = body.results.map(({id, title, thumbnail}) => ({id, title, thumbnail}));

    setProducts(results);
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

  const isOpen = poll.status == "open";

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>
          <img alt="RealTrends" src={logo} width={180} />
        </h1>
        <h3>Lets get this party started</h3>
        <button onClick={() => setModal(!modal)}>Añadir artículos</button>
        {poll.status && (
          <button className={isOpen ? "danger" : "success"} onClick={() => changeStatus()}>
            {isOpen ? "Cerrar" : "Reanudar"} votación
          </button>
        )}
      </header>
      <div>Votación {status[poll.status] || "pendiente"}</div>
      {poll.status == "closed" && <div>Debes reanudar para recibir nuevos votos.</div>}
      <Poll poll={poll} remove={(id) => removeItem(id)} />

      <Modal enabled={modal} setModal={() => setModal(!modal)}>
        <>
          <input autoFocus onChange={search} />
          <button
            className="success"
            disabled={Object.keys(selected).length < 2}
            onClick={() => setModal(!modal)}
          >
            Confirmar
          </button>
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
