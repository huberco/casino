export interface PaymentChain {
  chainId: string
  chainName: string
  name: string
  symbol: string
}

export interface PaymentToken {
  id: string
  symbol: string
  name: string
}

export interface PaymentAsset {
  chainId: string
  chainName: string
  tokenId: string
  tokenName: string
  tokenSymbol: string
  tokenDecimals: number
  tokenLogo: string
  minDepositAmount: string
  minWithdrawAmount: string
  withdrawFee: string
  isActive: boolean
}

export interface UserWallet {
  _id: string
  user: string
  openId: string
  chainId: string
  address: string
  tokenId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PaymentTransaction {
  _id: string
  user: string
  openId: string
  type: 'deposit' | 'withdrawal'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  chainId: string
  tokenId: string
  amount: string
  amountUsd: string
  fromAddress: string
  toAddress: string
  txHash?: string
  blockNumber?: number
  confirmations?: number
  paymentTxId?: string
  safeCheckCode?: string
  metadata?: any
  processedAt?: string
  completedAt?: string
  failedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PaymentStats {
  totalDeposits: number
  totalWithdrawals: number
  totalDepositAmount: number
  totalWithdrawalAmount: number
  pendingDeposits: number
  pendingWithdrawals: number
  completedDeposits: number
  completedWithdrawals: number
  failedDeposits: number
  failedWithdrawals: number
}

export interface DepositFormData {
  chainId: string
  tokenId: string
  amount: string
}

export interface WithdrawFormData {
  chainId: string
  tokenId: string
  amount: string
  addressTo: string
  safeCheckCode: string
}
