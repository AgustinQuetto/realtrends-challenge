import * as React from "react";

import styles from "./Modal.module.scss";

interface ModalProps {
  enabled: boolean;
  children: React.ReactNode;
}

const Modal: React.FC = ({enabled = false, children}: ModalProps) =>
  enabled ? <section className={styles.modal}>{children}</section> : null;

export default Modal;
