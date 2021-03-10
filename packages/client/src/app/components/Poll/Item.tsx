import * as React from "react";
import dayjs from "dayjs";

import styles from "./Poll.module.scss";

const getPercentage = (x, y) => {
  let result = 0;

  if (typeof x === "number" && typeof y === "number") result = (x / y) * 100;

  return isNaN(result) ? 0 : result;
};

const colors = (percentage: number) => {
  if (percentage < 25) return "rgb(201, 56, 56)";
  if (percentage < 50) return "orange";
  if (percentage < 75) return "rgb(200, 255, 0)";
  if (percentage <= 100) return "rgb(68, 201, 56)";

  return "gray";
};

const Item: React.FC = ({id, item, total, remove}) => {
  const percentage = getPercentage(item.count, total);
  const color = colors(percentage);
  const {count} = item;
  const votesText = `${count} voto${count == 1 ? "" : "s"}`;

  return (
    <div
      className={styles.card}
      style={{
        "--linearColor": color,
        "--linearPercentage": `${percentage}%`,
      }}
    >
      <h3>{item.title}</h3>
      <h1>{item.reference}</h1>
      <h5>{id}</h5>
      <h4>{percentage}%</h4>
      <div className={styles.innerCard}>
        <div className={styles.progress} />
        <figure>
          <img height={256} src={item.thumbnail} />
        </figure>
        <h3>{votesText}</h3>
        Valoraciones
        <div className={styles.valorations}>
          {Object.entries(item.valorations).map(([username, valoration]) =>
            valoration ? (
              <div key={`username_${username}`} className={styles.tooltip}>
                <b>{username}:</b> {valoration.message}
                <span className={styles.tooltiptext}>
                  {dayjs(valoration.timestamp).format("DD/MM/YYYY HH:mm")}
                </span>
              </div>
            ) : null,
          )}
        </div>
        <button onClick={() => remove(id)}>Eliminar</button>
      </div>
    </div>
  );
};

export default Item;
