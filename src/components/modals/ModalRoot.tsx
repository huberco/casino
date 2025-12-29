'use client'

import { useModalStore } from '@/store/modalStore'
import AuthModal from './AuthModal'

export default function ModalRoot() {
  const { modal, props, closeModal } = useModalStore()

  if (!modal) return null

  switch (modal) {
    case 'auth':
      return <AuthModal {...props} onClose={closeModal} />

    default:
      return null
  }
}
