"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[32px] shadow-card-lg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="pt-3 pb-2">
              <div className="w-9 h-1 bg-border-2 rounded-full mx-auto" />
            </div>

            {title && (
              <h2 className="font-display text-lg font-bold text-ink px-5 pb-3">
                {title}
              </h2>
            )}

            <div className="px-5 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
