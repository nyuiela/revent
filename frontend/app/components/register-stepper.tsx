import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Transaction, TransactionButton, TransactionResponseType, TransactionSponsor, TransactionStatus, TransactionStatusAction, TransactionStatusLabel } from '@coinbase/onchainkit/transaction';
import { useCallback, useState } from 'react';
import { eventAbi, eventAddress } from '@/lib/contract';
import { EventFormData } from '@/utils/types';
import { useNotification } from '@coinbase/onchainkit/minikit';


export default function VerticalLinearStepper({ domainName, formData, ipfsHash }: { domainName: string, formData: EventFormData, ipfsHash: string }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [transactionTimeout, setTransactionTimeout] = useState<NodeJS.Timeout | null>(null);
  const sendNotification = useNotification();

  // register with tokenization
  const voucher = ""
  const registrarSignature = ""
  const registrationFee = 0.006 * 10 ** 18
  const createEventWithTokenizationArgs = [
    ipfsHash,
    BigInt(formData.startDateTime),
    BigInt(formData.endDateTime),
    BigInt(formData.maxParticipants),
    BigInt(registrationFee),
    voucher,
    registrarSignature,
  ]
  const steps = [
    {
      label: 'Create Event with Tokenization',
      description: `Create a event with tokenization.`,
      functionName: 'createEventWithTokenization',
      buttonText: 'Create Event with Tokenization',
      args: createEventWithTokenizationArgs,
    },
    {
      label: 'Tokenize Domain',
      description:
        'Tokenize the domain to make it more valuable.',
      functionName: 'tokenizeDomain',
      buttonText: 'Tokenize Domain',
      args: [],
    },
    {
      label: 'Setting up domain page',
      description: `You can edit the domain page to your liking.`,
      functionName: 'editDomainPage',
      buttonText: 'Setting up domain page',
      args: [],
    },
  ];

  const handleSuccess = useCallback(async (response: TransactionResponseType) => {
    const transactionHash = response.transactionReceipts[0].transactionHash;

    console.log(`Transaction successful: ${transactionHash}`);

    await sendNotification({
      title: "Congratulations!",
      body: `You sent your a transaction, ${transactionHash}!`,
    });
  }, [sendNotification]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const chainId = 84532;




  return (
    <Box sx={{ maxWidth: 400 }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              optional={
                index === steps.length - 1 ? (
                  <Typography variant="caption">Last step</Typography>
                ) : null
              }
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography>{step.description}</Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 1, mr: 1 }}
                >
                  {index === steps.length - 1 ? 'Finish' : 'Continue'}
                </Button>
                <Transaction
                  chainId={chainId}
                  onSuccess={handleSuccess}
                  calls={({ args: step.args, address: eventAddress as `0x${string}`, functionName: step.functionName, abi: eventAbi.abi }) as never}
                  onStatus={async (lifecycle) => {
                    console.log('Domain transaction lifecycle:', lifecycle.statusName);

                    if (lifecycle.statusName === 'transactionPending' || lifecycle.statusName === 'buildingTransaction') {
                      setIsSubmitting(true);
                    } else if (lifecycle.statusName === 'success' || lifecycle.statusName === 'error' || lifecycle.statusName === 'transactionLegacyExecuted') {
                      if (lifecycle.statusName === 'success') {
                        // Domain minted successfully
                        console.log('Domain minted successfully');
                        setIsSubmitting(false);
                        if (transactionTimeout) {
                          clearTimeout(transactionTimeout);
                          setTransactionTimeout(null);
                        }
                      } else {
                        // Transaction failed or error
                        console.log('Domain transaction failed or error: ', lifecycle.statusData);
                        setIsSubmitting(false);
                      }
                    }
                  }}
                >
                  <TransactionButton text={isSubmitting ? "Minting Domain..." : `Mint ${domainName}`} />
                  <TransactionSponsor />
                  <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                  </TransactionStatus>
                </Transaction>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography>All steps completed - you&apos;re finished</Typography>

          <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
            Reset
          </Button>
        </Paper>
      )}
    </Box>
  );
}
