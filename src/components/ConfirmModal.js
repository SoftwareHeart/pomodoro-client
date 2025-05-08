// src/components/ConfirmModal.js
import React from 'react';

function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>Onay</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="modal-cancel-btn" onClick={onCancel}>İptal</button>
                    <button className="modal-confirm-btn" onClick={onConfirm}>Onayla</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;