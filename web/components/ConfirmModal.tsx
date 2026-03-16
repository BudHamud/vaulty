import React from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, title }: ConfirmModalProps) => (
    <Modal isOpen={isOpen} onClose={onClose} title="¿Confirmar acción?">
        <div className="text-center p-4">
            <p className="text-vaulty-muted mb-6">¿Estás seguro de que quieres eliminar <strong className="text-vaulty-text">{title}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex gap-4">
                <button onClick={onClose} className="flex-1 px-4 py-2 bg-vaulty-card border border-vaulty-border text-vaulty-muted rounded-xl font-bold hover:text-vaulty-text transition-colors">Cancelar</button>
                <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30">Eliminar</button>
            </div>
        </div>
    </Modal>
);

export default ConfirmModal;
