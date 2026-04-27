import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
                <div className="confirm-modal-body">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>
                <div className="confirm-modal-actions">
                    {onCancel && <button className="confirm-btn-cancel" onClick={onCancel}>{cancelText}</button>}
                    <button className={`confirm-btn-action ${type}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
