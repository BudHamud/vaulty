import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="¿Confirmar acción?">
    <div className="text-center p-4">
      <p className="text-slate-600 mb-6">¿Estás seguro de que quieres eliminar <strong>{title}</strong>? Esta acción no se puede deshacer.</p>
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 cursor-pointer transition-colors shadow-lg shadow-red-100">Eliminar</button>
      </div>
    </div>
  </Modal>
);

export default ConfirmModal;