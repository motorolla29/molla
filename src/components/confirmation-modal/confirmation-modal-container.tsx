'use client';

import { useConfirmationModal } from './confirmation-modal-context';
import ConfirmationModal from './confirmation-modal';

import { AnimatePresence } from 'framer-motion';

export default function ConfirmationModalContainer() {
  const { modal, hideConfirmation } = useConfirmationModal();

  return (
    <AnimatePresence>
      {modal && (
        <ConfirmationModal
          id={modal.id}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          icon={modal.icon}
          iconBgColor={modal.iconBgColor}
          iconColor={modal.iconColor}
          iconSize={modal.iconSize}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
          onClose={hideConfirmation}
        />
      )}
    </AnimatePresence>
  );
}
