import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="¿Confirmar acción?">
    <div className="text-center p-4">
      <p className="text-slate-600 dark:text-slate-300 mb-6">¿Estás seguro de que quieres eliminar <strong>{title}</strong>? Esta acción no se puede deshacer.</p>
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer transition-colors">Cancelar</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-xl font-bold hover:bg-red-600 dark:hover:bg-red-700 cursor-pointer transition-colors shadow-lg shadow-red-100 dark:shadow-red-900/30">Eliminar</button>
      </div>
    </div>
  </Modal>
);

export default ConfirmModal;