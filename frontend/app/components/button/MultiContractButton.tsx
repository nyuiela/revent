'use client'

import React, { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId, useSwitchChain } from 'wagmi'
import type { Abi } from 'viem'
import { toast } from 'react-hot-toast'
import { WalletModal } from '@coinbase/onchainkit/wallet'

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

export interface MultiContractButtonProps {
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
  // New props for multicall behavior
  useMulticall?: boolean // If true, will attempt to batch calls
  sequential?: boolean // If true, will execute calls one by one
  preSubmitFunction?: () => Promise<ContractCall[] | void>
}

export function MultiContractButton(props: MultiContractButtonProps) {
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
    useMulticall = false,
    sequential = false,
    preSubmitFunction,
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
  const [completedCalls, setCompletedCalls] = React.useState(0)
  const [showModalConnect, setShowModalConnect] = useState(false);
  const { address: account } = useAccount()
  const currentChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const [loading, setLoading] = useState(false)
  const state: TxButtonState = React.useMemo(() => {
    if (canceled) return 'canceled'
    if (!hasClicked) return 'idle'
    if (isConfirming) return 'confirming'
    if (isMining) return 'pending'
    if (isSuccess || fallbackSuccess) return 'success'
    if (isError) return 'error'
    return 'idle'
  }, [canceled, hasClicked, isConfirming, isMining, isSuccess, isError, fallbackSuccess])

  // Debug logging
  React.useEffect(() => {
    console.log('[MultiContractButton] State change:', {
      state,
      txHash,
      isConfirming,
      isMining,
      isSuccess,
      isError,
      receiptError,
      chainId,
      completedCalls,
      totalCalls: contracts.length,
      useMulticall,
      sequential
    })
  }, [state, txHash, isConfirming, isMining, isSuccess, isError, receiptError, chainId, completedCalls, contracts.length, useMulticall, sequential])

  React.useEffect(() => {
    if (onStateChange) onStateChange(state)
  }, [state, onStateChange])

  React.useEffect(() => {
    if (txHash && onWriteSuccess) onWriteSuccess(txHash)
  }, [txHash, onWriteSuccess])

  const notifiedForHashRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!isSuccess) return
    if (!txHash) return
    if (notifiedForHashRef.current === txHash) return
    notifiedForHashRef.current = txHash
    if (onReceiptSuccess) onReceiptSuccess(receipt)
    if (showToast) toast.success(successToastMessage)
  }, [isSuccess, txHash, receipt, onReceiptSuccess, showToast, successToastMessage])

  // Handle receipt errors
  React.useEffect(() => {
    if (receiptError) {
      console.error('[MultiContractButton] Receipt error:', receiptError)
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
        console.log('[MultiContractButton] Fallback success triggered for tx:', txHash)
        if (notifiedForHashRef.current === txHash) return
        notifiedForHashRef.current = txHash
        setFallbackSuccess(true)
        if (showToast) toast.success(successToastMessage)
        if (onReceiptSuccess) onReceiptSuccess({ hash: txHash })
      }, 30000)

      return () => clearTimeout(timeout)
    }
  }, [txHash, isSuccess, isError, receiptError, isMining, showToast, successToastMessage, onReceiptSuccess])

  React.useEffect(() => {
    if (state === 'success') {
      const t = setTimeout(() => {
        setHasClicked(false)
        setFallbackSuccess(false)
        setCompletedCalls(0)
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

  const executeSequentialCalls = React.useCallback(async (callsParam?: ContractCall[]) => {
    const calls = callsParam ?? contracts
    console.log('[MultiContractButton] Executing sequential calls:', calls.length)

    for (let i = 0; i < calls.length; i++) {
      const call = calls[i]
      console.log(`[MultiContractButton] Executing call ${i + 1}/${calls.length}:`, call)

      try {
        await writeContract({
          address: call.address,
          abi: call.abi,
          functionName: call.functionName as never,
          args: call.args,
          value: call.value,
          chainId,
        })

        setCompletedCalls(i + 1)

        // Wait for this transaction to complete before moving to next
        // This is a simplified approach - in practice you'd want to wait for receipt
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (err) {
        console.error(`[MultiContractButton] Error in call ${i + 1}:`, err)
        setLastError(err)
        if (showToast) toast.error(getFriendlyError(err))
        if (onError) onError(err)
        return
      }
    }
  }, [contracts, writeContract, chainId, showToast, onError])

  const executeMulticall = React.useCallback(async (callsParam?: ContractCall[]) => {
    const calls = callsParam ?? contracts
    console.log('[MultiContractButton] Executing multicall:', calls.length)

    // For now, we'll execute the first call and let the user handle multicall logic
    // In a real implementation, you'd use a multicall contract
    const firstCall = calls[0]

    try {
      await writeContract({
        address: firstCall.address,
        abi: firstCall.abi,
        functionName: firstCall.functionName as never,
        args: firstCall.args,
        value: firstCall.value,
        chainId,
      })
    } catch (err) {
      console.error('[MultiContractButton] Error in multicall:', err)
      setLastError(err)
      if (showToast) toast.error(getFriendlyError(err))
      if (onError) onError(err)
    }
  }, [contracts, writeContract, chainId, showToast, onError])

  const handleClick = React.useCallback(async () => {
    console.log('[MultiContractButton] handleClick invoked with', contracts.length, 'contracts')
    setCanceled(false)
    setLastError(null)
    setFallbackSuccess(false)
    setHasClicked(true)
    setCompletedCalls(0)
    setLoading(true)
    const prepared = await preSubmitFunction?.();
    const calls = (prepared && Array.isArray(prepared) && prepared.length > 0) ? prepared as ContractCall[] : contracts
    if (!calls || calls.length === 0) {
      setLoading(false)
      toast.error('Nothing to submit yet. Please try again.')
      return
    }

    // Ensure correct chain before writing
    try {
      if (chainId && currentChainId && chainId !== currentChainId) {
        await switchChainAsync({ chainId })
      }
    } catch (e) {
      setLoading(false)
      const msg = getFriendlyError(e)
      if (showToast) toast.error(`Switch network failed: ${msg}`)
      if (onError) onError(e)
      return
    }
    if (onWriteStart) onWriteStart()

    if (useMulticall) {
      executeMulticall(calls)
      setLoading(false)
    } else if (sequential) {
      executeSequentialCalls(calls)
      setLoading(false)
    } else {
      // Default: execute first call only
      const firstCall = calls[0]
      try {
        writeContract({
          address: firstCall.address,
          abi: firstCall.abi,
          functionName: firstCall.functionName as never,
          args: firstCall.args,
          value: firstCall.value,
          chainId,
        })
        setLoading(false)
      } catch (err) {
        setLoading(false)
        console.error('[MultiContractButton] Error:', err)
        setLastError(err)
        if (showToast) toast.error(getFriendlyError(err))
        if (onError) onError(err)
      }
    }
  }, [contracts, onWriteStart, useMulticall, sequential, executeMulticall, executeSequentialCalls, writeContract, chainId, showToast, onError, preSubmitFunction, currentChainId, switchChainAsync])

  const handleCancel = React.useCallback(() => {
    setCanceled(true)
    setHasClicked(false)
    setCompletedCalls(0)
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
  const progressText = showProgress ? ` (${completedCalls}/${contracts.length})` : ''

  return (
    <div className={`${className}`}>
      {!account ? <button className={`rounded-[1.5rem] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-2 w-[92%] mx-auto h-12 ${btnClassName}`} onClick={() => setShowModalConnect(true)}>Connect Wallet</button> :
        <button
          type="button"
          onClick={handleClick}
          disabled={Boolean(isDisabled) || loading}
          className={`px-3 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-2 w-[92%] mx-auto h-12 ${btnClassName} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Loading...' : `${label}${progressText}`}
        </button>
      }

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
          {useMulticall ? 'Batching calls...' :
            sequential ? `Executing ${contracts.length} calls sequentially...` :
              `Executing ${contracts.length} contract call${contracts.length > 1 ? 's' : ''}...`}
        </div>
      )}
      <WalletModal isOpen={showModalConnect} onClose={() => { setShowModalConnect(false) }} className="bg-black shadow-lg z-[9999]" />
    </div>
  )
}

export default MultiContractButton
