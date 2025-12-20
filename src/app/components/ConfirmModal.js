import React from 'react';
import styles from '../styles/ConfirmModal.module.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* stopPropagation để click vào hộp thoại không bị đóng modal */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title || "Confirm Deletion"}</h3>
        <p className={styles.message}>
          {message || "Are you sure you want to delete this item? This action cannot be undone."}
        </p>
        
        <div className={styles.actions}>
          <button 
            className={`${styles.btn} ${styles.btnCancel}`} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={`${styles.btn} ${styles.btnDelete}`} 
            onClick={() => {
              onConfirm();
              onClose(); // Đóng modal sau khi xác nhận
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;