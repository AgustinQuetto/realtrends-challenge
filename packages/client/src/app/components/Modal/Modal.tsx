import * as React from "react";

import styles from "./Modal.module.scss";

interface ModalProps {
  enabled: boolean;
  setModal: () => void;
  children: React.ReactNode;
}

const Modal: React.FC = ({enabled, setModal, children}: ModalProps) =>
  enabled ? <section className={styles.modal}>{children}</section> : null;

export default Modal;
