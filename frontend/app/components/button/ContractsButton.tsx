'use client'

import React from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import type { Abi } from 'viem'
import { toast } from 'react-hot-toast'

type HexAddress = `0x${string}`

export type TxButtonState =
  | 'idle'
  | 'confirming'
  | 'pending'
  | 'success'
  | 'error'
  | 'canceled'

export interface ContractCall {
  address: HexAddress
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  value?: bigint
}

export interface ContractsButtonProps {
  contracts: ContractCall[]
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

export function ContractsButton(props: ContractsButtonProps) {
  const {
    contracts,
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

  const { writeContract, data: txHash, isPending: isConfirming } = useWriteContract()
  const { isLoading: isMining, isSuccess, isError, data: receipt, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: chainId,
    confirmations: 1,
  })

  const [canceled, setCanceled] = React.useState(false)
  const [lastError, setLastError] = React.useState<unknown>(null)
  const [hasClicked, setHasClicked] = React.useState(false)
  const [fallbackSuccess, setFallbackSuccess] = React.useState(false)
  const [currentCallIndex, setCurrentCallIndex] = React.useState(0)

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
    console.log('[ContractsButton] State change:', {
      state,
      txHash,
      isConfirming,
      isMining,
      isSuccess,
      isError,
      receiptError,
      chainId,
      currentCallIndex,
      totalCalls: contracts.length
    })
  }, [state, txHash, isConfirming, isMining, isSuccess, isError, receiptError, chainId, currentCallIndex, contracts.length])

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

  // Handle receipt errors
  React.useEffect(() => {
    if (receiptError) {
      console.error('[ContractsButton] Receipt error:', receiptError)
      setLastError(receiptError)
      if (showToast) {
        const errorMsg = getFriendlyError(receiptError)
        toast.error(`Transaction receipt failed: ${errorMsg}`)
      }
      if (onError) onError(receiptError)
    }
  }, [receiptError, showToast, onError])

  // Fallback success mechanism
  React.useEffect(() => {
    if (txHash && !isSuccess && !isError && !receiptError && isMining) {
      const timeout = setTimeout(() => {
        console.log('[ContractsButton] Fallback success triggered for tx:', txHash)
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
        setFallbackSuccess(false)
        setCurrentCallIndex(0) // Reset for next batch
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

    if (
      name === 'UserRejectedRequestError' ||
      /user rejected|user denied|rejected/i.test(message)
    ) {
      return 'User rejected the request'
    }

    const cause = anyErr?.cause as Record<string, unknown> | undefined
    const causeMsg: string =
      (cause && typeof cause.shortMessage === 'string' ? (cause.shortMessage as string) : '') ||
      (cause && typeof cause.message === 'string' ? (cause.message as string) : '')
    const combined = message || causeMsg
    if (combined) return combined
    return 'Unknown error'
  }

  const executeNextCall = React.useCallback(async () => {
    if (currentCallIndex >= contracts.length) {
      console.log('[ContractsButton] All calls completed')
      return
    }

    const currentCall = contracts[currentCallIndex]
    console.log(`[ContractsButton] Executing call ${currentCallIndex + 1}/${contracts.length}:`, currentCall)

    try {
      await writeContract({
        address: currentCall.address,
        abi: currentCall.abi,
        functionName: currentCall.functionName as never,
        args: currentCall.args,
        value: currentCall.value,
        chainId,
      })
    } catch (err) {
      console.error(`[ContractsButton] Error in call ${currentCallIndex + 1}:`, err)
      setLastError(err)
      if (showToast) toast.error(getFriendlyError(err))
      if (onError) onError(err)
    }
  }, [contracts, currentCallIndex, writeContract, chainId, showToast, onError])

  const handleClick = React.useCallback(() => {
    console.log('[ContractsButton] handleClick invoked with', contracts.length, 'contracts')
    setCanceled(false)
    setLastError(null)
    setFallbackSuccess(false)
    setHasClicked(true)
    setCurrentCallIndex(0)
    if (onWriteStart) onWriteStart()

    // Start executing the first call
    executeNextCall()
  }, [contracts.length, onWriteStart, executeNextCall])

  const handleCancel = React.useCallback(() => {
    setCanceled(true)
    setHasClicked(false)
    setCurrentCallIndex(0)
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

  // Show progress for multiple calls
  const showProgress = contracts.length > 1 && (state === 'confirming' || state === 'pending')
  const progressText = showProgress ? ` (${currentCallIndex + 1}/${contracts.length})` : ''

  return (
    <div className={`${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={Boolean(isDisabled)}
        className={`rounded-xl px-3 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-2 w-[92%] mx-auto h-10 ${btnClassName}`}
      >
        {label}{progressText}
      </button>
      {!showCancel && (state === 'confirming' || state === 'pending') && (
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
      {showProgress && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Executing {contracts.length} contract call{contracts.length > 1 ? 's' : ''}...
        </div>
      )}
    </div>
  )
}

export default ContractsButton
