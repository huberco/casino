'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from '@heroui/react'
import { gameApi } from '@/lib/api'
import { PaymentAsset, UserWallet } from '@/types/payment'
import { Image } from '@heroui/react'
import { FaCopy, FaCheck } from 'react-icons/fa'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const [assets, setAssets] = useState<PaymentAsset[]>([])
  const [wallets, setWallets] = useState<UserWallet[]>([])
  const [selectedAsset, setSelectedAsset] = useState<PaymentAsset | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAssets()
      loadWallets()
    }
  }, [isOpen])

  const loadAssets = async () => {
    try {
      const response = await gameApi.payment.getSupportedAssets()
      const payload = (response as any)?.data ?? {}
      const raw = payload.assets ?? payload.data?.assets
      // Normalize to array
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
    
    // Find corresponding wallet
    const wallet = wallets.find(w => w.chainId === asset?.chainId && w.tokenId === asset?.tokenId)
    setSelectedWallet(wallet || null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const createWallet = async () => {
    if (!selectedAsset) return

    setIsLoading(true)
    try {
      const response = await gameApi.payment.createWallet(selectedAsset.chainId, selectedAsset.tokenId)
      if (response.success) {
        await loadWallets() // Reload wallets
      }
    } catch (error) {
      console.error('Failed to create wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-white">Deposit Funds</h3>
          <p className="text-gray-400 text-sm">Select a cryptocurrency to deposit</p>
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
            </div>

            {/* Deposit Address */}
            {selectedAsset && (
              <div className="space-y-4">
                <div className="bg-background-alt rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Deposit Address</h4>
                  
                  {selectedWallet ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={selectedAsset.tokenLogo}
                          alt={selectedAsset.tokenSymbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div>
                          <div className="font-medium text-white">{selectedAsset.tokenSymbol}</div>
                          <div className="text-sm text-gray-400">{selectedAsset.chainName}</div>
                        </div>
                      </div>
                      
                      <div className="bg-background rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <code className="text-sm text-gray-300 break-all flex-1 mr-3">
                            {selectedWallet.address}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => copyToClipboard(selectedWallet.address)}
                            className="min-w-0 px-2"
                          >
                            {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 space-y-1">
                        <p>• Minimum deposit: {selectedAsset.minDepositAmount} {selectedAsset.tokenSymbol}</p>
                        <p>• Only send {selectedAsset.tokenSymbol} to this address</p>
                        <p>• Deposits will be credited after network confirmation</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400 mb-4">No wallet address found for this asset</p>
                      <Button
                        color="primary"
                        onPress={createWallet}
                        isLoading={isLoading}
                        disabled={isLoading}
                      >
                        Generate Deposit Address
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
