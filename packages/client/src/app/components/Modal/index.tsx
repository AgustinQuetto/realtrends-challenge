import * as React from "react";

import styles from "./index.module.scss";

const Modal: React.FC = ({enabled, setModal, children}) =>
  enabled ? <section className={styles.modal}>{children}</section> : null;

export default Modal;
