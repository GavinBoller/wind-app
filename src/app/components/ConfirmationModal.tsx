"use client";

import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="confirmation-message">{message}</p>
      <div className="confirmation-actions">
        <button onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn btn-danger">
          Confirm
        </button>
      </div>
    </Modal>
  );
}