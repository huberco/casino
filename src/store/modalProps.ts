// store/modalProps.ts
export interface ModalPropsMap {
    auth: {
      redirectTo?: string
    }
    confirm: {
      title: string
      description?: string
      onConfirm: () => void
    }
    gameResult: {
      winAmount: number
      multiplier: number
    }
  }
  