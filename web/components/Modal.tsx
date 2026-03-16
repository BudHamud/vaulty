'use client'

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: ModalSize;
}

const Modal = ({ isOpen, onClose, title, children, size = "md" }: ModalProps) => {
    if (!isOpen) return null;

    const sizeClasses: Record<ModalSize, string> = {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl",
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className={`relative bg-vaulty-sidebar rounded-3xl shadow-2xl border border-vaulty-border w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}
                >
                    <div className="flex justify-between items-center p-6 border-b border-vaulty-border">
                        <h2 className="text-xl font-black text-vaulty-text uppercase tracking-tight">{title}</h2>
                        <button onClick={onClose} className="text-vaulty-muted hover:text-vaulty-text transition-colors text-2xl">&times;</button>
                    </div>
                    <div className="p-6">{children}</div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default Modal;
