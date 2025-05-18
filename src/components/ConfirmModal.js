import React from 'react';

function ConfirmModal({
    isOpen,
    title,
    message,
    confirmButtonText = "Onayla",
    cancelButtonText = "İptal",
    onConfirm,
    onCancel
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="modal-cancel-btn" onClick={onCancel}>
                        {cancelButtonText}
                    </button>
                    <button className="modal-confirm-btn" onClick={onConfirm}>
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;