'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from '@heroui/react'
import { gameApi } from '@/lib/api'
import { PaymentAsset, UserWallet } from '@/types/payment'
import { Image } from '@heroui/react'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function WithdrawModal({ isOpen, onClose, onSuccess }: WithdrawModalProps) {
  const [assets, setAssets] = useState<PaymentAsset[]>([])
  const [wallets, setWallets] = useState<UserWallet[]>([])
  const [selectedAsset, setSelectedAsset] = useState<PaymentAsset | null>(null)
  const [formData, setFormData] = useState({
    amount: '',
    addressTo: '',
    safeCheckCode: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadAssets()
      loadWallets()
      setFormData({ amount: '', addressTo: '', safeCheckCode: '' })
      setErrors({})
    }
  }, [isOpen])

  const loadAssets = async () => {
    try {
      const response = await gameApi.payment.getSupportedAssets()
      const payload = (response as any)?.data ?? {}
      const raw = payload.assets ?? payload.data?.assets
      if (Array.isArray(raw)) {
        setAssets(raw)
      } else if (raw && typeof raw === 'object') {
        const flattened: PaymentAsset[] = Object.entries(raw).flatMap(([chainId, list]) => {
          const arr = Array.isArray(list) ? list : []
          return arr.map((t: any) => ({
            chainId: String(chainId),
            chainName: t.chainName || '',
            tokenId: t.tokenId || t.id || '',
            tokenName: t.tokenName || t.name || '',
            tokenSymbol: t.tokenSymbol || t.symbol || '',
            tokenDecimals: t.tokenDecimals ?? 6,
            tokenLogo: t.tokenLogo || '',
            minDepositAmount: t.minDepositAmount ? String(t.minDepositAmount) : '0',
            minWithdrawAmount: t.minWithdrawAmount ? String(t.minWithdrawAmount) : '0',
            withdrawFee: t.withdrawFee ? String(t.withdrawFee) : '0',
            isActive: t.isActive ?? true,
          }))
        })
        setAssets(flattened)
      } else {
        setAssets([])
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  const loadWallets = async () => {
    try {
      const response = await gameApi.payment.getWalletAddresses()
      if (response.success && response.data) {
        setWallets(response.data.wallets || [])
      }
    } catch (error) {
      console.error('Failed to load wallets:', error)
    }
  }

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find(a => `${a.chainId}-${a.tokenId}` === assetId)
    setSelectedAsset(asset || null)
    setErrors({})
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedAsset) {
      newErrors.asset = 'Please select a cryptocurrency'
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount'
      } else if (selectedAsset && amount < parseFloat(selectedAsset.minWithdrawAmount)) {
        newErrors.amount = `Minimum withdrawal amount is ${selectedAsset.minWithdrawAmount} ${selectedAsset.tokenSymbol}`
      }
    }

    if (!formData.addressTo) {
      newErrors.addressTo = 'Recipient address is required'
    } else if (formData.addressTo.length < 10) {
      newErrors.addressTo = 'Please enter a valid address'
    }

    if (!formData.safeCheckCode) {
      newErrors.safeCheckCode = 'Safe check code is required'
    } else if (formData.safeCheckCode.length < 6) {
      newErrors.safeCheckCode = 'Safe check code must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleWithdraw = async () => {
    if (!validateForm() || !selectedAsset) return

    setIsLoading(true)
    try {
      const response = await gameApi.payment.processWithdrawal({
        tokenId: selectedAsset.tokenId,
        amount: formData.amount,
        addressTo: formData.addressTo,
        safeCheckCode: formData.safeCheckCode
      })

      if (response.success) {
        onSuccess?.()
        onClose()
      } else {
        setErrors({ submit: response.error || 'Withdrawal failed' })
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      setErrors({ submit: 'An error occurred while processing withdrawal' })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateFee = () => {
    if (!selectedAsset || !formData.amount) return '0'
    return selectedAsset.withdrawFee
  }

  const calculateTotal = () => {
    if (!formData.amount) return '0'
    const amount = parseFloat(formData.amount)
    const fee = parseFloat(calculateFee())
    return (amount + fee).toFixed(6)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-white">Withdraw Funds</h3>
          <p className="text-gray-400 text-sm">Withdraw your cryptocurrency to an external wallet</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Asset Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Cryptocurrency
              </label>
              <Select
                placeholder="Choose a cryptocurrency"
                selectedKeys={selectedAsset ? [`${selectedAsset.chainId}-${selectedAsset.tokenId}`] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string
                  handleAssetChange(selectedKey)
                }}
                classNames={{
                  trigger: "bg-background-alt border-gray-600",
                  value: "text-white",
                  listbox: "bg-background-alt border-gray-600"
                }}
              >
                {assets.map((asset) => (
                  <SelectItem key={`${asset.chainId}-${asset.tokenId}`}>
                    <div className="flex items-center gap-3">
                      <Image
                        src={asset.tokenLogo}
                        alt={asset.tokenSymbol}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium text-white">{asset.tokenSymbol}</div>
                        <div className="text-sm text-gray-400">{asset.tokenName} on {asset.chainName}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>
              {errors.asset && <p className="text-red-400 text-sm mt-1">{errors.asset}</p>}
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onValueChange={(value) => handleInputChange('amount', value)}
                endContent={
                  selectedAsset && (
                    <div className="flex items-center gap-2">
                      <Image
                        src={selectedAsset.tokenLogo}
                        alt={selectedAsset.tokenSymbol}
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                      <span className="text-gray-400 text-sm">{selectedAsset.tokenSymbol}</span>
                    </div>
                  )
                }
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-background-alt border-gray-600"
                }}
              />
              {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
              {selectedAsset && (
                <p className="text-gray-400 text-xs mt-1">
                  Min: {selectedAsset.minWithdrawAmount} {selectedAsset.tokenSymbol}
                </p>
              )}
            </div>

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address
              </label>
              <Input
                placeholder="Enter recipient wallet address"
                value={formData.addressTo}
                onValueChange={(value) => handleInputChange('addressTo', value)}
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-background-alt border-gray-600"
                }}
              />
              {errors.addressTo && <p className="text-red-400 text-sm mt-1">{errors.addressTo}</p>}
            </div>

            {/* Safe Check Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Safe Check Code
              </label>
              <Input
                type="password"
                placeholder="Enter your safe check code"
                value={formData.safeCheckCode}
                onValueChange={(value) => handleInputChange('safeCheckCode', value)}
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-background-alt border-gray-600"
                }}
              />
              {errors.safeCheckCode && <p className="text-red-400 text-sm mt-1">{errors.safeCheckCode}</p>}
              <p className="text-gray-400 text-xs mt-1">
                This code is required for security verification
              </p>
            </div>

            {/* Fee Information */}
            {selectedAsset && formData.amount && (
              <div className="bg-background-alt rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Withdrawal Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">{formData.amount} {selectedAsset.tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee:</span>
                    <span className="text-white">{calculateFee()} {selectedAsset.tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-gray-300 font-medium">Total:</span>
                    <span className="text-white font-medium">{calculateTotal()} {selectedAsset.tokenSymbol}</span>
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleWithdraw}
            isLoading={isLoading}
            disabled={isLoading || !selectedAsset}
          >
            Withdraw
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
