'use client'

import React, { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import type { Abi } from 'viem'
import { toast } from 'react-hot-toast'
import { WalletModal } from "@coinbase/onchainkit/wallet";

type HexAddress = `0x${string}`

export type TxButtonState =
  | 'idle'
  | 'confirming'
  | 'pending'
  | 'success'
  | 'error'
  | 'canceled'

export interface TxButtonProps {
  address: HexAddress
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  value?: bigint
  chainId?: number
  className?: string
  disabled?: boolean
  idleLabel?: React.ReactNode
  confirmingLabel?: React.ReactNode
  pendingLabel?: React.ReactNode
  successLabel?: React.ReactNode
  errorLabel?: React.ReactNode
  cancelLabel?: React.ReactNode
  showCancel?: boolean
  resetDelayMs?: number
  showToast?: boolean
  successToastMessage?: string
  errorToastMessage?: string
  cancelToastMessage?: string
  btnClassName?: string
  onWriteStart?: () => void
  onWriteSuccess?: (hash: HexAddress) => void
  onReceiptSuccess?: (receipt: unknown) => void
  onError?: (error: unknown) => void
  onCancel?: () => void
  onStateChange?: (state: TxButtonState) => void
}

export function ContractButton(props: TxButtonProps) {
  const {
    address,
    abi,
    functionName,
    args,
    value,
    chainId,
    className,
    disabled,
    idleLabel = 'Submit',
    confirmingLabel = 'Confirm in wallet…',
    pendingLabel = 'Transaction pending…',
    successLabel = 'Success',
    errorLabel = 'Try again',
    cancelLabel = 'Cancel Transaction',
    showCancel = true,
    resetDelayMs = 1500,
    showToast = true,
    successToastMessage = 'Transaction confirmed',
    errorToastMessage = 'Transaction failed',
    cancelToastMessage = 'Transaction canceled',
    btnClassName,
    onWriteStart,
    onWriteSuccess,
    onReceiptSuccess,
    onError,
    onCancel,
    onStateChange,
  } = props

  const { address: account } = useAccount()
  const { writeContract, data: txHash, isPending: isConfirming } = useWriteContract()
  const { isLoading: isMining, isSuccess, isError, data: receipt, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: chainId, // Explicitly pass chainId to ensure proper chain handling
    confirmations: 1, // Reduce confirmations for faster feedback
  })

  const [canceled, setCanceled] = React.useState(false)
  const [lastError, setLastError] = React.useState<unknown>(null)
  const [hasClicked, setHasClicked] = React.useState(false)
  const [fallbackSuccess, setFallbackSuccess] = React.useState(false)
  const [showModal, setShowModal] = useState(false);
  const [showModalConnect, setShowModalConnect] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const state: TxButtonState = React.useMemo(() => {
    if (canceled) return 'canceled'
    if (!hasClicked) return 'idle'
    if (isConfirming) return 'confirming'
    if (isMining) return 'pending'
    if (isSuccess || fallbackSuccess) return 'success'
    if (isError) return 'error'
    return 'idle'
  }, [canceled, hasClicked, isConfirming, isMining, isSuccess, isError, fallbackSuccess])

  // Debug logging for transaction states
  React.useEffect(() => {
    console.log('[TxButton] State change:', {
      state,
      txHash,
      isConfirming,
      isMining,
      isSuccess,
      isError,
      receiptError,
      chainId
    })
  }, [state, txHash, isConfirming, isMining, isSuccess, isError, receiptError, chainId])

  React.useEffect(() => {
    if (onStateChange) onStateChange(state)
  }, [state, onStateChange])

  React.useEffect(() => {
    if (txHash && onWriteSuccess) onWriteSuccess(txHash)
  }, [txHash, onWriteSuccess])

  React.useEffect(() => {
    if (isSuccess && onReceiptSuccess) onReceiptSuccess(receipt)
    if (isSuccess && showToast) toast.success(successToastMessage)
  }, [isSuccess, receipt, onReceiptSuccess, showToast, successToastMessage])

  // Handle receipt errors (including chain-specific issues)
  React.useEffect(() => {
    if (receiptError) {
      console.error('[TxButton] Receipt error:', receiptError)
      setLastError(receiptError)
      if (showToast) {
        const errorMsg = getFriendlyError(receiptError)
        toast.error(`Transaction receipt failed: ${errorMsg}`)
      }
      if (onError) onError(receiptError)
    }
  }, [receiptError, showToast, onError])

  // Fallback success mechanism for chains that might not return receipts properly
  React.useEffect(() => {
    if (txHash && !isSuccess && !isError && !receiptError && isMining) {
      const timeout = setTimeout(() => {
        console.log('[TxButton] Fallback success triggered for tx:', txHash)
        setFallbackSuccess(true)
        if (showToast) toast.success(successToastMessage)
        if (onReceiptSuccess) onReceiptSuccess({ hash: txHash })
      }, 30000) // 30 second timeout

      return () => clearTimeout(timeout)
    }
  }, [txHash, isSuccess, isError, receiptError, isMining, showToast, successToastMessage, onReceiptSuccess])

  React.useEffect(() => {
    if (state === 'success') {
      const t = setTimeout(() => {
        setHasClicked(false)
        setFallbackSuccess(false) // Reset fallback success
      }, resetDelayMs)
      return () => clearTimeout(t)
    }
    return
  }, [state, resetDelayMs])

  const getFriendlyError = (err: unknown): string => {
    const anyErr = err as Record<string, unknown>
    const message: string =
      (typeof anyErr?.shortMessage === 'string' ? anyErr.shortMessage : '') ||
      (typeof anyErr?.message === 'string' ? (anyErr.message as string) : '')
    const name: string = typeof anyErr?.name === 'string' ? (anyErr.name as string) : ''
    // Common user-reject signals
    if (
      name === 'UserRejectedRequestError' ||
      /user rejected|user denied|rejected/i.test(message)
    ) {
      return 'User rejected the request'
    }
    // Attempt to extract revert reason
    const cause = anyErr?.cause as Record<string, unknown> | undefined
    const causeMsg: string =
      (cause && typeof cause.shortMessage === 'string' ? (cause.shortMessage as string) : '') ||
      (cause && typeof cause.message === 'string' ? (cause.message as string) : '')
    const combined = message || causeMsg
    if (combined) return combined
    return 'Unknown error'
  }

  const handleClick = React.useCallback(() => {
    // Debug: verify clicks are reaching handler
    console.log('[TxButton] handleClick invoked')
    setCanceled(false)
    setLastError(null)
    setFallbackSuccess(false) // Reset fallback success
    setHasClicked(true)
    if (onWriteStart) onWriteStart()
    try {
      writeContract({
        address,
        abi,
        functionName: functionName as never,
        args,
        value,
        chainId,
      })
    } catch (err) {
      console.error('Error writing contract:', err)
      setLastError(err)
      if (showToast) toast.error(getFriendlyError(err))
      if (onError) onError(err)
    }
  }, [address, abi, functionName, args, value, chainId, onWriteStart, onError, writeContract, showToast])

  const handleCancel = React.useCallback(() => {
    setCanceled(true)
    setHasClicked(false)
    if (showToast) toast.error(cancelToastMessage)
    if (onCancel) onCancel()
  }, [onCancel, cancelToastMessage, showToast])

  const isDisabled = disabled || state === 'confirming' || state === 'pending'

  let label: React.ReactNode = idleLabel
  if (state === 'confirming') label = confirmingLabel
  else if (state === 'pending') label = pendingLabel
  else if (state === 'success') label = successLabel
  else if (state === 'error') label = errorLabel
  else if (state === 'canceled') label = idleLabel

  return (
    <div className={`${className}`}>
      {!account ? <button className={`rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:opacity-90 flex items-center justify-center gap-2 w-[92%] mx-auto h-10 ${btnClassName}`} onClick={() => setShowModalConnect(true)}>Connect Wallet</button> :
        <button
          type="button"
          onClick={handleClick}
          disabled={Boolean(isDisabled)}
          className={`rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:opacity-90 flex items-center justify-center gap-2 w-[92%] mx-auto h-10 ${btnClassName}`}
        >
          {label}
        </button>}
      {!showCancel && (state === 'confirming' || state === 'pending') && (
        // {showCancel && (
        <button
          type="button"
          onClick={handleCancel}
          className="ml-2 inline-flex items-center justify-center rounded-md font-medium w-full text-foreground underline text-xs py-5"
        >
          {cancelLabel}
        </button>
      )}
      {state === 'error' && Boolean(lastError) && (
        <span className="ml-2 text-xs text-red-500">{errorToastMessage}</span>
      )}
      <WalletModal isOpen={showModalConnect} onClose={() => { setShowModalConnect(false) }} className="bg-black shadow-lg z-50" />
    </div>
  )
}

export default ContractButton


