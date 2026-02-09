'use client'

import React, { useState, useEffect, useCallback } from 'react'
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Card, CardBody, Tabs, Tab, Select, SelectItem, Avatar, Snippet, Input, Button } from "@heroui/react";
import { gameApi } from '@/lib/api'
import { UserWallet, PaymentStats, PaymentChain, PaymentToken } from '@/types/payment'
import { useAuth } from '@/contexts/AuthContext'
import QRCode from '@/components/QRCode'
import { useModalType } from '@/contexts/modalContext';
import PaymentTransactionHistory from '@/components/table/PaymentTransactionHistory'
import { useWebSocket } from '@/contexts/socketContext'

// NOW Payments crypto options (same list as HyperPack)
const CRYPTO_OPTIONS = [
  { id: 'usdterc20', name: 'Tether', symbol: 'USDT', network: 'Ethereum' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', network: 'Bitcoin' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', network: 'Ethereum' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', network: 'Ethereum' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', network: 'Solana' },
  { id: 'xrp', name: 'Ripple', symbol: 'XRP', network: 'Ripple' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', network: 'Litecoin' },
  { id: 'dai', name: 'Dai', symbol: 'DAI', network: 'Ethereum' },
]

export default function WalletPage() {
  const { user, refreshProfile } = useAuth()
  const { showModal: showErrorModal } = useModalType('error')
  const { on, off } = useWebSocket()
  const [wallets, setWallets] = useState<UserWallet[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = React.useState<React.Key>("deposit")

  // NOW Payments deposit state
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null)
  const [showDepositDetails, setShowDepositDetails] = useState(false)
  const [depositId, setDepositId] = useState<string | null>(null)
  const [payAddress, setPayAddress] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [minDepositAmount, setMinDepositAmount] = useState('')
  const [depositStatus, setDepositStatus] = useState<string>('PENDING')
  const [isStarting, setIsStarting] = useState(false)

  const [chains, setChains] = useState<PaymentChain[]>([])
  const [tokens, setTokens] = React.useState<PaymentToken[]>([])
  const [assets, setAssets] = useState<Record<string, PaymentToken[]>>({})
  const [selectedChain, setSelectedChain] = React.useState<React.Key>(chains[0]?.chainId)
  const [selectedToken, setSelectedToken] = React.useState<React.Key>(tokens[0]?.id)
  const [amount, setAmount] = React.useState<string>("")
  const [addressTo, setAddressTo] = React.useState<string>("")
  const [paymentWallets, setPaymentWallets] = React.useState<{ address: string, chainID: string }[]>([])



  useEffect(() => {
    loadWalletData()
  }, [])



  const loadWalletData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadAssets(),
        loadPaymentStats()
        // loadWallets(),
      ])
    } catch (error) {
      console.error('Failed to load wallet data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPaymentStats = async () => {
    try {
      const response = await gameApi.payment.getTransactionStats()
      if (response.success && response.data) {
        setPaymentStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load payment stats:', error)
    }
  }

  const refreshPaymentStats = async () => {
    await loadPaymentStats()
  }

  const handleStartDeposit = useCallback(async () => {
    if (!selectedCrypto) return
    setIsStarting(true)
    try {
      const response = await gameApi.payment.startNowPaymentsDeposit({
        pay_currency: selectedCrypto,
      })
      const data = response.data as any
      const payload = data?.data ?? data
      if (!response.success || !payload) {
        showErrorModal({
          title: 'Deposit failed',
          message: (response as any).error || 'Could not start deposit',
          onClose: () => {},
        })
        return
      }
      setDepositId(payload.depositRequestId)
      setPayAddress(payload.payAddress || '')
      setPayAmount(payload.payAmount || '')
      setMinDepositAmount(payload.minDepositAmount || payload.payAmount || '')
      setDepositStatus(payload.status || 'PENDING')
      setShowDepositDetails(true)
    } catch (e) {
      console.error('Start deposit error:', e)
      showErrorModal({
        title: 'Deposit failed',
        message: e instanceof Error ? e.message : 'Failed to start deposit',
        onClose: () => {},
      })
    } finally {
      setIsStarting(false)
    }
  }, [selectedCrypto, showErrorModal])

  useEffect(() => {
    const handleDepositStatus = (data: { depositId?: string; status?: string }) => {
      if (depositId && data.depositId === depositId) {
        setDepositStatus(data.status || 'PENDING')
        if (data.status === 'COMPLETED') {
          refreshProfile()
          refreshPaymentStats()
        }
      }
    }
    on('deposit:status-updated', handleDepositStatus)
    return () => off('deposit:status-updated', handleDepositStatus)
  }, [depositId, on, off, refreshProfile])

  useEffect(() => {
    setSelectedChain(chains[0]?.chainId)
    if (paymentWallets.length === 0 && chains.length > 0) {
      const chainIds = chains.map(c => c.chainId).join(",")
      loadWallets(chainIds)
    }
  }, [chains])



  useEffect(() => {
    setSelectedToken(tokens[0]?.id)
  }, [tokens])

  useEffect(() => {
    if (selectedChain) {
      const key = String(selectedChain)
      setTokens(assets?.[key] ?? [])
    }
  }, [assets, selectedChain])


  const loadAssets = async () => {
    try {
      const response = await gameApi.payment.getSupportedAssets()
      const res = response.data
      setChains(res.data.chains || [])
      setAssets(res.data.assets || {})
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  const loadWallets = async (chainId: string) => {
    // try {
    //   const response = await gameApi.payment.createWallet(chainId)
    //   if (response.success && response.data) {
    //     console.log(response.data)
    //     // {"success":false,"error":"Openid is already registered"}
    //   }
    // } catch (error) {
    //   console.error('Failed to load wallets:', error)
    // }
    // try {
    //   const response = await gameApi.payment.createPaymentUser()
    //   if (response.success && response.data) {
    //     console.log(response.data)
    //     // {"success":false,"error":"Openid is already registered"}
    //   }
    // } catch (error) {
    //   console.error('Failed to load wallets:', error)
    // }
    try {
      const response = await gameApi.payment.getWalletAddresses(chainId)
      if (response.success && response.data) {
        console.log(response.data.data)
        setPaymentWallets(response.data.data.paymentAddresses || [])
      }
    } catch (error) {
      console.error('Failed to load wallets:', error)
    }
  }

  const createPaymentAccount = async () => {
    try {
      const response = await gameApi.payment.createPaymentUser()
      if (response.success && response.data) {
        console.log(response.data)
      }
    } catch (error) {
      console.error('Failed to create payment account:', error)
    }
  }

  const requestWithdraw = async (chainId: string, tokenId: string, amount: string, addressTo: string) => {
    try {

      // validate amount
      // if (Number(amount) < 1) {
      //   showErrorModal({
      //     title: 'Invalid amount',
      //     message: 'Amount must be greater than 1',
      //     onClose: () => {
      //     }
      //   })
      //   return
      // }

      // validate address
      if (!addressTo) {
        showErrorModal({
          title: 'Invalid address',
          message: 'Address is required',
          onClose: () => {
          }
        })
        return
      }

      const response = await gameApi.payment.processWithdrawal({
        tokenId: tokenId,
        amount: amount,
        addressTo: addressTo,
        safeCheckCode: user.id,
      })
      if (response.success && response.data) {
        console.log(response.data)
      }
      else {
        showErrorModal({
          title: 'Failed to request withdrawal',
          message: response.error,
          onClose: () => {
          }
        })
      }
    } catch (error) {
      console.error('Failed to request withdrawal:', error)
      showErrorModal({
        title: 'Failed to request withdrawal',
        message: error,
        onClose: () => {
        }
      })
    }
  }

  const getToken = (chainId: string, tokenId: string): PaymentToken | undefined => {
    const list = assets?.[String(chainId)] ?? []
    return list.find((t: PaymentToken) => t.id === tokenId)
  }

  const getAssetForWallet = (wallet: UserWallet) => {
    const token = getToken(wallet.chainId, wallet.tokenId)
    if (!token) return null
    const chain = chains.find(c => c.chainId === wallet.chainId)
    return {
      tokenSymbol: token.symbol,
      tokenName: token.name,
      chainName: chain?.chainName || '',
      tokenDecimals: 6,
      tokenLogo: `/assets/images/tokens/${token.symbol.toLowerCase()}.webp`,
    }
  }


  useEffect(() => {
    if (!user?.profile?.paymentAccount) {
      console.log('Creating payment account')
      createPaymentAccount()
    }
  }, [user?.profile?.paymentAccount])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Wallet</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading wallet data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Wallet</h1>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-background-alt rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Game Balance</h3>
          <p className="text-3xl font-bold text-green-500">${user?.profile?.balance.toFixed(2)}</p>
        </div>
        <div className="bg-background-alt rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Total Deposits</h3>
          <p className="text-3xl font-bold text-blue-400">
            {isLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              `$${paymentStats?.totalDepositAmount?.toFixed(2) || '0.00'}`
            )}
          </p>
        </div>
        <div className="bg-background-alt rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Total Withdrawals</h3>
          <p className="text-3xl font-bold text-red-400">
            {isLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              `$${paymentStats?.totalWithdrawalAmount?.toFixed(2) || '0.00'}`
            )}
          </p>
        </div>
        <div className="bg-background-alt rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Net Balance</h3>
          <p className="text-3xl font-bold text-purple-400">
            {isLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              `$${((paymentStats?.totalDepositAmount || 0) - (paymentStats?.totalWithdrawalAmount || 0)).toFixed(2)}`
            )}
          </p>
        </div>
      </div>

      <Card className="max-w-full">
        <CardBody className="overflow-hidden bg-background-alt">
          <Tabs
            fullWidth
            aria-label="Tabs form"
            selectedKey={selected as any}
            size="md"
            onSelectionChange={setSelected}
            classNames={{
              tabList:"bg-background",
              cursor:"bg-background-alt! text-primary!",
              tabContent:["group-data-[selected=true]:text-primary!"],
            }}
          >
            <Tab key="deposit" title="Deposit">
              <div className="flex flex-col gap-4 w-full">
                {!showDepositDetails ? (
                  <>
                    <p className="text-sm text-default-500">Select a currency and start deposit to get your unique address.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                      {CRYPTO_OPTIONS.map((crypto) => (
                        <Button
                          key={crypto.id}
                          onPress={() => setSelectedCrypto(selectedCrypto === crypto.id ? null : crypto.id)}
                          className={`flex flex-col items-center gap-2 min-h-[100px] ${
                            selectedCrypto === crypto.id
                              ? 'bg-primary/20 border-2 border-primary'
                              : 'bg-background hover:bg-default-100 border border-default-200'
                          }`}
                        >
                          <Avatar
                            size="sm"
                            src={`/assets/images/tokens/${crypto.symbol.toLowerCase()}.webp`}
                            name={crypto.symbol}
                            className="shrink-0"
                          />
                          <span className="text-sm font-medium text-foreground">{crypto.name}</span>
                          <span className="text-xs text-default-400">{crypto.symbol}</span>
                        </Button>
                      ))}
                    </div>
                    <PrimaryButton
                      className="bg-primary hover:bg-primary/80 text-background font-semibold"
                      onClick={handleStartDeposit}
                      isLoading={isStarting}
                      disabled={!selectedCrypto || isStarting}
                    >
                      Start Deposit
                    </PrimaryButton>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-500">Status:</span>
                      <span className="text-sm font-medium capitalize">{depositStatus.toLowerCase()}</span>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <QRCode
                          value={payAddress}
                          size={200}
                          className="p-2 bg-white rounded-lg shadow-sm"
                        />
                        <p className="text-xs text-default-500">Scan to copy address</p>
                      </div>
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div>
                          <p className="text-sm font-medium text-default-700 mb-1">Deposit Address</p>
                          <Snippet symbol="" className="w-full text-xs bg-background" classNames={{ pre: 'max-w-full truncate' }}>
                            {payAddress || '—'}
                          </Snippet>
                        </div>
                        {minDepositAmount && (
                          <p className="text-xs text-default-500">
                            Min amount: <span className="text-foreground font-medium">{minDepositAmount} {CRYPTO_OPTIONS.find(c => c.id === selectedCrypto)?.symbol ?? ''}</span>
                          </p>
                        )}
                        <div className="bg-background border border-danger-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-danger font-semibold mb-1">Instructions</p>
                          <ul className="text-xs text-default-500 space-y-1">
                            <li>• Send only {CRYPTO_OPTIONS.find(c => c.id === selectedCrypto)?.name ?? selectedCrypto} to this address</li>
                            <li>• Use the correct network ({CRYPTO_OPTIONS.find(c => c.id === selectedCrypto)?.network ?? '—'})</li>
                            <li>• Balance updates after network confirmation</li>
                          </ul>
                        </div>
                        <Button
                          variant="flat"
                          onPress={() => {
                            setShowDepositDetails(false)
                            setDepositId(null)
                            setPayAddress('')
                            setDepositStatus('PENDING')
                          }}
                          className="mt-2"
                        >
                          Back
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Tab>
            <Tab key="withdraw" title="Withdraw">
              <div className='flex flex-col gap-2 w-full '>
                <div className='flex flex-col lg:flex-row gap-2 w-full'>
                  <Select
                    className=""
                    classNames={{
                      label: "hidden",
                      listboxWrapper: "max-h-[400px]",
                      innerWrapper: 'pt-0!',
                      trigger:"bg-background"
                    }}
                    selectedKeys={selectedChain ? [String(selectedChain)] as any : []}
                    onChange={(e) => { if (e.target.value) setSelectedChain(e.target.value as any) }}
                    items={chains}
                    label="Assigned to"
                    listboxProps={{
                      itemClasses: {
                        base: [
                          "rounded-md",
                          "text-default-500",
                          "transition-opacity",
                          "data-[hover=true]:text-foreground",
                          "data-[hover=true]:bg-default-100",
                          "dark:data-[hover=true]:bg-default-50",
                          "data-[selectable=true]:focus:bg-default-50",
                          "data-[pressed=true]:opacity-70",
                          "data-[focus-visible=true]:ring-default-500",
                        ],
                      },
                    }}
                    popoverProps={{
                      classNames: {
                        base: "before:bg-default-200",
                        content: "p-0 border-small border-divider bg-background",
                      },
                    }}
                    renderValue={(items) => {
                      return items.map((item: any) => (
                        <div key={item.key} className="flex items-center gap-2">
                          <Avatar alt={item.data.name} className="shrink-0" size="sm" src={`/assets/images/tokens/${item.data.symbol}.webp`} />
                          <div className="flex flex-col">
                            <span>{item.data.chainName}</span>
                          </div>
                        </div>
                      ));
                    }}
                  >
                    {(chain: PaymentChain) => (
                      <SelectItem key={chain.chainId} textValue={chain.name}>
                        <div className="flex gap-2 items-center">
                          <Avatar alt={chain.name} className="shrink-0" size="sm" src={`/assets/images/tokens/${chain.symbol}.webp`} />
                          <div className="flex flex-col">
                            <span className="text-small">{chain.chainName}</span>
                          </div>
                        </div>
                      </SelectItem>
                    )}
                  </Select>
                  <Select
                    className=""
                    classNames={{
                      label: "hidden",
                      listboxWrapper: "max-h-[400px]",
                      innerWrapper: 'pt-0!',
                      trigger:"bg-background"
                    }}
                    selectedKeys={selectedToken ? [String(selectedToken)] as any : []}
                    onChange={(e) => { if (e.target.value) setSelectedToken(e.target.value as any) }}
                    items={tokens}
                    label="Assigned to"
                    listboxProps={{
                      itemClasses: {
                        base: [
                          "rounded-md",
                          "text-default-500",
                          "transition-opacity",
                          "data-[hover=true]:text-foreground",
                          "data-[hover=true]:bg-default-100",
                          "dark:data-[hover=true]:bg-default-50",
                          "data-[selectable=true]:focus:bg-default-50",
                          "data-[pressed=true]:opacity-70",
                          "data-[focus-visible=true]:ring-default-500",
                        ],
                      },
                    }}
                    popoverProps={{
                      classNames: {
                        base: "before:bg-default-200",
                        content: "p-0 border-small border-divider bg-background",
                      },
                    }}
                    renderValue={(items) => {
                      return items.map((item: any) => (
                        <div key={item.key} className="flex items-center gap-2">
                          <Avatar alt={item.data.name} className="shrink-0" size="sm" src={`/assets/images/tokens/${item.data.symbol}.webp`} />
                          <div className="flex flex-col">
                            <span>{item.data.name}</span>
                            <span className='text-xs text-default-400'>{item.data.chain}</span>
                          </div>
                        </div>
                      ));
                    }}
                  >
                    {(token: PaymentToken) => (
                      <SelectItem key={token.id} textValue={token.name}>
                        <div className="flex gap-2 items-center">
                          <Avatar alt={token.name} className="shrink-0" size="sm" src={`/assets/images/tokens/${token.symbol}.webp`} />
                          <div className="flex flex-col">
                            <span className="text-small">{token.name}</span>
                          </div>
                        </div>
                      </SelectItem>
                    )}
                  </Select>
                </div>
                <div className='flex flex-col gap-2 w-full '>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 w-full'>
                    <Input
                      label="Withdrawal Address"
                      value={addressTo}
                      onChange={(e) => setAddressTo(e.target.value)}
                      classNames={{
                        inputWrapper:"bg-background"
                      }}
                    />
                    <Input
                      label="Amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      classNames={{
                        inputWrapper:"bg-background"
                      }}
                    />
                  </div>
                  <PrimaryButton
                    className='mt-8 bg-primary hover:bg-primary/80 text-background font-semibold'
                    onClick={() => requestWithdraw(selectedChain as string, selectedToken as string, amount, addressTo as string)}
                  >
                    Withdraw
                  </PrimaryButton>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>


      {/* Payment Transaction History */}
      <PaymentTransactionHistory
        className="bg-background-alt rounded-lg p-6 hidden lg:block"
        showStats={true}
        showFilters={true}
        limit={20}
        onTransactionUpdate={refreshPaymentStats}
      />
    </div>
  )
}
