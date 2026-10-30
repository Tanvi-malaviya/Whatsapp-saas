import { Form } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { useClipboard } from '@/hooks/use-clipboard';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { confirm } from '@/routes/two-factor';

function ShieldBadgeIcon() {
    return (
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-950/20">
            <ShieldCheck className="size-5 text-[#1da851]" />
        </div>
    );
}

function TwoFactorSetupStep({
    qrCodeSvg,
    manualSetupKey,
    buttonText,
    onNextStep,
    errors,
}: {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    buttonText: string;
    onNextStep: () => void;
    errors: string[];
}) {
    const [copiedText, copy] = useClipboard();
    const isCopied = copiedText === manualSetupKey;
    const IconComponent = isCopied ? Check : Copy;

    return (
        <>
            {errors?.length ? (
                <AlertError errors={errors} />
            ) : (
                <div className="flex w-full flex-col items-center space-y-2.5">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center">
                        <div className="relative aspect-square w-36 rounded-xl border border-border/80 bg-white p-2 shadow-xs">
                            <div className="flex h-full w-full items-center justify-center">
                                {qrCodeSvg ? (
                                    <div
                                        className="size-full [&_svg]:size-full"
                                        dangerouslySetInnerHTML={{
                                            __html: qrCodeSvg,
                                        }}
                                    />
                                ) : (
                                    <Spinner />
                                )}
                            </div>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground text-center">
                            Scan with Google Authenticator or Authy
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="relative flex w-full items-center justify-center my-0">
                        <div className="absolute inset-0 top-1/2 h-px w-full bg-border/60" />
                        <span className="relative bg-background px-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            or enter key manually
                        </span>
                    </div>

                    {/* Manual Key Box */}
                    <div className="w-full">
                        {!manualSetupKey ? (
                            <div className="flex w-full items-center justify-center rounded-lg border border-border bg-muted/30 p-2">
                                <Spinner />
                            </div>
                        ) : (
                            <div className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 transition-colors hover:bg-muted/50">
                                <code className="select-all font-mono text-xs font-semibold tracking-wider text-foreground">
                                    {manualSetupKey}
                                </code>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copy(manualSetupKey)}
                                    className="h-6 px-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground shrink-0 gap-1"
                                >
                                    <IconComponent className={`size-3 ${isCopied ? 'text-emerald-600' : ''}`} />
                                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Continue Button */}
                    <div className="w-full pt-0.5">
                        <Button
                            className="w-full bg-[#1da851] hover:bg-[#168a42] text-white shadow-xs font-medium h-9 text-xs sm:text-sm"
                            onClick={onNextStep}
                        >
                            {buttonText}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}

function TwoFactorVerificationStep({
    onClose,
    onBack,
}: {
    onClose: () => void;
    onBack: () => void;
}) {
    const [code, setCode] = useState<string>('');
    const pinInputContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            pinInputContainerRef.current?.querySelector('input')?.focus();
        }, 50);
    }, []);

    return (
        <Form
            {...confirm.form()}
            onSuccess={() => onClose()}
            resetOnError
            resetOnSuccess
        >
            {({
                processing,
                errors,
            }: {
                processing: boolean;
                errors?: { confirmTwoFactorAuthentication?: { code?: string } };
            }) => (
                <div
                    ref={pinInputContainerRef}
                    className="flex w-full flex-col items-center space-y-3 pt-0.5"
                >
                    <div className="flex w-full flex-col items-center space-y-1.5 py-1">
                        <InputOTP
                            id="otp"
                            name="code"
                            maxLength={OTP_MAX_LENGTH}
                            onChange={setCode}
                            disabled={processing}
                            pattern={REGEXP_ONLY_DIGITS}
                            autoFocus
                        >
                            <InputOTPGroup className="gap-1.5">
                                {Array.from(
                                    { length: OTP_MAX_LENGTH },
                                    (_, index) => (
                                        <InputOTPSlot
                                            key={index}
                                            index={index}
                                            className="size-10 text-sm font-semibold border-border rounded-md shadow-2xs"
                                        />
                                    ),
                                )}
                            </InputOTPGroup>
                        </InputOTP>
                        <InputError
                            message={
                                errors?.confirmTwoFactorAuthentication?.code
                            }
                        />
                    </div>

                    <div className="flex w-full gap-2.5 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-9 text-xs"
                            onClick={onBack}
                            disabled={processing}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-9 text-xs bg-[#1da851] hover:bg-[#168a42] text-white"
                            disabled={
                                processing || code.length < OTP_MAX_LENGTH
                            }
                        >
                            {processing ? 'Confirming...' : 'Confirm'}
                        </Button>
                    </div>
                </div>
            )}
        </Form>
    );
}

type Props = {
    isOpen: boolean;
    onClose: () => void;
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    clearSetupData: () => void;
    fetchSetupData: () => Promise<void>;
    errors: string[];
};

export default function TwoFactorSetupModal({
    isOpen,
    onClose,
    requiresConfirmation,
    twoFactorEnabled,
    qrCodeSvg,
    manualSetupKey,
    clearSetupData,
    fetchSetupData,
    errors,
}: Props) {
    const [showVerificationStep, setShowVerificationStep] =
        useState<boolean>(false);

    const modalConfig = useMemo<{
        title: string;
        description: string;
        buttonText: string;
    }>(() => {
        if (twoFactorEnabled) {
            return {
                title: 'Two-factor enabled',
                description:
                    'Scan the QR code or enter the key into your authenticator app.',
                buttonText: 'Close',
            };
        }

        if (showVerificationStep) {
            return {
                title: 'Verify code',
                description:
                    'Enter the 6-digit code from your authenticator app',
                buttonText: 'Continue',
            };
        }

        return {
            title: 'Enable two-factor authentication',
            description:
                'Scan the QR code or enter the setup key into your authenticator app',
            buttonText: 'Continue',
        };
    }, [twoFactorEnabled, showVerificationStep]);

    const resetModalState = useCallback(() => {
        if (twoFactorEnabled) {
            clearSetupData();
        }

        setShowVerificationStep(false);
    }, [clearSetupData, twoFactorEnabled]);

    const handleClose = useCallback(() => {
        resetModalState();
        onClose();
    }, [onClose, resetModalState]);

    const handleModalNextStep = useCallback(() => {
        if (requiresConfirmation) {
            setShowVerificationStep(true);

            return;
        }

        clearSetupData();
        handleClose();
    }, [requiresConfirmation, clearSetupData, handleClose]);

    const fetchSetupDataRef = useRef(fetchSetupData);

    useEffect(() => {
        fetchSetupDataRef.current = fetchSetupData;
    }, [fetchSetupData]);

    useEffect(() => {
        if (isOpen && !qrCodeSvg) {
            void fetchSetupDataRef.current();
        }
    }, [isOpen, qrCodeSvg]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[390px] p-5 gap-3">
                <DialogHeader className="flex flex-col items-center justify-center text-center space-y-1 pb-0.5">
                    <ShieldBadgeIcon />
                    <DialogTitle className="text-base font-semibold tracking-tight">
                        {modalConfig.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground max-w-[300px] text-center">
                        {modalConfig.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center pt-0">
                    {showVerificationStep ? (
                        <TwoFactorVerificationStep
                            onClose={handleClose}
                            onBack={() => setShowVerificationStep(false)}
                        />
                    ) : (
                        <TwoFactorSetupStep
                            qrCodeSvg={qrCodeSvg}
                            manualSetupKey={manualSetupKey}
                            buttonText={modalConfig.buttonText}
                            onNextStep={handleModalNextStep}
                            errors={errors}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
