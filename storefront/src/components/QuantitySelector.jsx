import React from 'react';
import styles from './QuantitySelector.module.css';
//import { FaPlus, FaMinus } from 'react-icons/fa';

function QuantitySelector({ quantity, onDecrease, onIncrease }) {
  return (
    <div className={styles.quantitySelector}>
      <button onClick={onDecrease} className={styles.quantityButton} aria-label="Diminuir quantidade">
        <FaMinus />
      </button>
      <span className={styles.quantityDisplay}>{quantity}</span>
      <button onClick={onIncrease} className={styles.quantityButton} aria-label="Aumentar quantidade">
        <FaPlus />
      </button>
    </div>
  );
}

export default QuantitySelector;