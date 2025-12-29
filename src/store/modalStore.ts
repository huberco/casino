// store/modalStore.ts
import { create } from 'zustand'
import type { ModalPropsMap } from './modalProps'
import { ModalType } from './modalType'

type ModalState = {
  modal: ModalType | null
  props: any
  openModal: <T extends ModalType>(
    modal: T,
    props?: ModalPropsMap[T]
  ) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  modal: null,
  props: {},
  openModal: (modal, props) => set({ modal, props }),
  closeModal: () => set({ modal: null, props: {} }),
}))
