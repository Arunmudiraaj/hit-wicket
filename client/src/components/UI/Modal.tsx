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
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-elevated-bg border border-muted-bg rounded-2xl shadow-xl p-6 max-w-md w-full">
          {title && (
            <Dialog.Title className="text-lg font-semibold mb-4 text-base-text">
              {title}
            </Dialog.Title>
          )}

          <div className="text-base-text">
            {children}
          </div>

          {(showCancelBtn || showSubmitBtn) && (
            <div className="mt-6 flex justify-end gap-3">
              {showCancelBtn && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl font-semibold text-muted-text bg-muted-bg hover:bg-elevated-bg hover:text-base-text transition-all duration-200"
                >
                  {cancelText}
                </button>
              )}
              {showSubmitBtn && (
                <button
                  onClick={onSubmit}
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {submitText}
                </button>
              )}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default Modal