import { Dialog } from "@headlessui/react"
import React from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  showSubmitBtn?: boolean
  showCancelBtn?: boolean
  onSubmit?: () => void
  submitText?: string
  cancelText?: string
  closeOnBackdrop?: boolean
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  showSubmitBtn = false,
  showCancelBtn = false,
  onSubmit,
  submitText = "Submit",
  cancelText = "Cancel",
  closeOnBackdrop = true,
}: ModalProps) => {
  return (
    <Dialog
      as="div"
      open={isOpen}
      onClose={closeOnBackdrop ? onClose : () => { }}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative">
          {title && (
            <Dialog.Title className="text-lg font-semibold mb-4">
              {title}
            </Dialog.Title>
          )}

          {children}

          {(showCancelBtn || showSubmitBtn) && <div className="mt-6 flex justify-end gap-3">
            {showCancelBtn && <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              {cancelText}
            </button>}
            {showSubmitBtn && <button
              onClick={onSubmit}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitText}
            </button>}
          </div>}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default Modal
