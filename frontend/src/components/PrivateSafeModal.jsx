import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './PrivateSafeModal.css';

const PrivateSafeModal = ({ isOpen, onClose }) => {
    // Modes: 'SETUP_Create', 'SETUP_Confirm', 'LOCKED', 'UNLOCKED'
    const [mode, setMode] = useState('LOCKED');
    const [pinInput, setPinInput] = useState('');
    const [tempPin, setTempPin] = useState(''); // For setup confirmation
    const [error, setError] = useState(false);

    const [files, setFiles] = useState([]);
    const [undoStack, setUndoStack] = useState(null); // { file, index }

    // Viewer State
    const [viewingFile, setViewingFile] = useState(null);

    // Check for existing PIN on mount/open
    useEffect(() => {
        if (isOpen) {
            const storedPin = localStorage.getItem('safe_pin');
            if (storedPin) {
                setMode('LOCKED');
            } else {
                setMode('SETUP_Create');
            }
            setPinInput('');
            setError(false);
            setViewingFile(null);

            // Load files
            const storedFiles = localStorage.getItem('safe_files');
            if (storedFiles) {
                setFiles(JSON.parse(storedFiles));
            }
        }
    }, [isOpen]);

    // Handle PIN entry
    const handlePinPress = (key) => {
        if (key === 'backspace') {
            setPinInput(prev => prev.slice(0, -1));
            setError(false);
            return;
        }

        if (pinInput.length < 4) {
            const newPin = pinInput + key;
            setPinInput(newPin);

            // Auto-check when 4 digits reached
            if (newPin.length === 4) {
                handlePinComplete(newPin);
            }
        }
    };

    const handlePinComplete = (input) => {
        if (mode === 'LOCKED') {
            const storedPin = localStorage.getItem('safe_pin');
            if (input === storedPin) {
                setMode('UNLOCKED');
            } else {
                setError(true);
                setTimeout(() => {
                    setPinInput('');
                    setError(false);
                }, 500);
            }
        } else if (mode === 'SETUP_Create') {
            setTempPin(input);
            setMode('SETUP_Confirm');
            setPinInput('');
        } else if (mode === 'SETUP_Confirm') {
            if (input === tempPin) {
                localStorage.setItem('safe_pin', input);
                setMode('UNLOCKED');
            } else {
                alert("PINs do not match. Try again.");
                setMode('SETUP_Create');
                setPinInput('');
                setTempPin('');
            }
        }
    };

    // File Upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (max 500KB to save localStorage)
        if (file.size > 500000) {
            alert("File is too large for Private Safe (Max 500KB during demo).");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const newFile = {
                id: Date.now(),
                url: reader.result,
                type: file.type.startsWith('image') ? 'image' : 'video',
                name: file.name,
                date: new Date().toLocaleDateString()
            };

            const updatedFiles = [...files, newFile];
            setFiles(updatedFiles);
            localStorage.setItem('safe_files', JSON.stringify(updatedFiles));
        };
        reader.readAsDataURL(file);
    };

    // Hold to Delete Logic
    const holdTimer = useRef(null);
    const [holdingFileId, setHoldingFileId] = useState(null);

    const startHold = (fileId) => {
        setHoldingFileId(fileId);
        holdTimer.current = setTimeout(() => {
            deleteFile(fileId);
        }, 1000); // 1 second hold
    };

    const endHold = () => {
        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }
        setHoldingFileId(null);
    };

    const deleteFile = (fileId) => {
        const fileIndex = files.findIndex(f => f.id === fileId);
        const fileToDelete = files[fileIndex];

        const newFiles = files.filter(f => f.id !== fileId);
        setFiles(newFiles);
        localStorage.setItem('safe_files', JSON.stringify(newFiles));

        // Setup Undo
        setUndoStack({ file: fileToDelete, index: fileIndex });
        setHoldingFileId(null); // Stop holding animation
        setTimeout(() => setUndoStack(null), 3000); // Clear undo after 3s
    };

    const handleUndo = () => {
        if (undoStack) {
            const newFiles = [...files];
            newFiles.splice(undoStack.index, 0, undoStack.file);
            setFiles(newFiles);
            localStorage.setItem('safe_files', JSON.stringify(newFiles));
            setUndoStack(null);
        }
    };

    // Helper for back navigation
    const handleBack = () => {
        if (viewingFile) {
            setViewingFile(null);
        } else {
            onClose();
        }
    };


    if (!isOpen) return null;

    // Full Screen Viewer
    if (viewingFile) {
        return createPortal(
            <div className="safe-viewer-overlay">
                <div className="safe-header">
                    <div className="safe-header-left">
                        <button className="safe-back-btn" onClick={() => setViewingFile(null)}>
                            ← Back
                        </button>
                    </div>
                </div>
                <div className="viewer-content">
                    {viewingFile.type === 'image' ? (
                        <img src={viewingFile.url} alt="viewing" />
                    ) : (
                        <video src={viewingFile.url} controls autoPlay />
                    )}
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="private-safe-overlay">
            <div className="safe-header">
                <div className="safe-header-left">
                    {/* Back button logic: if in setup/locked, it closes. If unlocked, it also closes (acts as exit to main app) */}
                    <button className="safe-back-btn" onClick={onClose}>
                        ← Back
                    </button>
                    <div className="safe-title">
                        <span>🔒</span> Private Safe
                    </div>
                </div>
            </div>

            {mode !== 'UNLOCKED' ? (
                // PIN LOCK SCREEN
                <div className="pin-screen-container">
                    <div className="pin-instruction">
                        {mode === 'SETUP_Create' && "Set a 4-digit PIN"}
                        {mode === 'SETUP_Confirm' && "Confirm PIN"}
                        {mode === 'LOCKED' && "Enter Unlock PIN"}
                    </div>

                    <div className="pin-dots-display">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`pin-dot ${i < pinInput.length ? 'filled' : ''} ${error ? 'error' : ''}`}></div>
                        ))}
                    </div>

                    <div className="pin-pad">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} className="pin-key" onClick={() => handlePinPress(num.toString())}>{num}</button>
                        ))}
                        <div></div>
                        <button className="pin-key" onClick={() => handlePinPress('0')}>0</button>
                        <button className="pin-key pin-key-backspace" onClick={() => handlePinPress('backspace')}>⌫</button>
                    </div>
                </div>
            ) : (
                // UNLOCKED GALLERY SCREEN
                <div className="safe-content">
                    {files.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '50px', color: '#718096' }}>
                            No content yet. Tap + to add.
                        </div>
                    ) : (
                        <div className="safe-gallery">
                            {files.map(file => (
                                <div
                                    key={file.id}
                                    className={`safe-file-item ${holdingFileId === file.id ? 'holding' : ''}`}
                                    onMouseDown={() => startHold(file.id)}
                                    onMouseUp={endHold}
                                    onMouseLeave={endHold}
                                    onTouchStart={() => startHold(file.id)}
                                    onTouchEnd={endHold}
                                    onClick={() => setViewingFile(file)}
                                >
                                    {file.type === 'image' ? (
                                        <img src={file.url} alt="safe-content" />
                                    ) : (
                                        <video src={file.url} />
                                    )}

                                    <div className="click-overlay">
                                        <div className="delete-loader"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="safe-add-btn-container">
                        <label className="safe-add-btn">
                            +
                            <input type="file" hidden accept="image/*,video/*" onChange={handleFileUpload} />
                        </label>
                    </div>

                    {undoStack && (
                        <div className="undo-popup">
                            <span className="undo-text">Item deleted</span>
                            <button className="undo-btn" onClick={handleUndo}>UNDO</button>
                        </div>
                    )}
                </div>
            )}
        </div>,
        document.body
    );
};

export default PrivateSafeModal;
