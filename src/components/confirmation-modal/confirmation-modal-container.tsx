'use client';

import { useConfirmationModal } from './confirmation-modal-context';
import ConfirmationModal from './confirmation-modal';

export default function ConfirmationModalContainer() {
  const { modal, hideConfirmation } = useConfirmationModal();

  if (!modal) return null;

  return (
    <ConfirmationModal
      id={modal.id}
      title={modal.title}
      message={modal.message}
      confirmText={modal.confirmText}
      cancelText={modal.cancelText}
      onConfirm={modal.onConfirm}
      onCancel={modal.onCancel}
      onClose={hideConfirmation}
    />
  );
}
