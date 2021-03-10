import * as React from "react";

import styles from "./Poll.module.scss";
import Item from "./Item";

const Poll: React.FC = ({poll, remove}) => (
  <div className={styles.poll}>
    {Object.entries(poll.options || {}).map(([id, item]) => (
      <Item {...{id, item, total: poll.total}} key={`item-${id}`} remove={remove}/>
    ))}
  </div>
);

export default Poll;
