import React, { useMemo } from "react";
import {
    IconCash,
    IconCreditCard,
    IconReceipt,
    IconArrowRight,
    IconCheck,
    IconAlertCircle,
    IconBuildingBank,
    IconQrcode,
    IconCalendar,
    IconCalculator,
    IconSparkles,
    IconCoin,
} from "@tabler/icons-react";
import { formatCurrency } from "@/Utils/currency";

// Quick Amount Button with enhanced UI
function QuickAmountButton({ amount, onClick, isSelected }) {
    return (
        <button
            type="button"
            onClick={() => onClick(amount)}
            className={`
                flex-1 py-3 px-2 rounded-xl text-sm font-semibold
                transition-all duration-300 min-h-touch
                ${
                    isSelected
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 ring-2 ring-primary-500/30 transform scale-105"
                        : "bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-700"
                }
            `}
        >
            <span className="flex items-center justify-center gap-1">
                <IconCoin size={14} className={isSelected ? "text-white/80" : "text-slate-400"} />
                {formatCurrency(amount)}
            </span>
        </button>
    );
}

// Payment Method Card with enhanced UI
function PaymentMethodCard({ method, isSelected, onClick }) {
    const getIcon = () => {
        if (method.value === "cash") return IconCash;
        if (method.value === "bank_transfer") return IconBuildingBank;
        if (method.value === "qris") return IconQrcode;
        if (method.value === "pay_later") return IconCalendar;
        return IconCreditCard;
    };
    const IconComponent = getIcon();

    return (
        <button
            type="button"
            onClick={() => onClick(method.value)}
            className={`
                w-full p-4 rounded-2xl text-left transition-all duration-300
                border-2 flex items-center gap-3 relative overflow-hidden
                ${
                    isSelected
                        ? "border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/50 shadow-lg shadow-primary-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-slate-900 hover:shadow-md"
                }
            `}
        >
            {/* Gradient accent for selected */}
            {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 animate-pulse" />
            )}

            <div
                className={`
                w-12 h-12 rounded-xl flex items-center justify-center relative z-10 shadow-md
                ${
                    isSelected
                        ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white"
                        : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-400"
                }
            `}
            >
                <IconComponent size={22} />
            </div>
            <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2">
                    <p
                        className={`text-sm font-semibold ${
                            isSelected
                                ? "text-primary-700 dark:text-primary-300"
                                : "text-slate-800 dark:text-slate-200"
                        }`}
                    >
                        {method.label}
                    </p>
                    {isSelected && <IconSparkles size={14} className="text-primary-500" />}
                </div>
                {method.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {method.description}
                    </p>
                )}
            </div>
            {isSelected && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center relative z-10 shadow-md">
                    <IconCheck size={16} />
                </div>
            )}
        </button>
    );
}

// Main PaymentPanel Component
export default function PaymentPanel({
    subtotal = 0,
    promoDiscount = 0,
    voucherDiscount = 0,
    loyaltyDiscount = 0,
    discount = 0,
    taxTotal = 0,
    discountInput = "",
    onDiscountChange,
    redeemPointsInput = "",
    onRedeemPointsChange,
    availablePoints = 0,
    selectedVoucherId = "",
    voucherOptions = [],
    onVoucherChange,
    cash = 0,
    cashInput = "",
    onCashChange,
    paymentMethod = "cash",
    onPaymentMethodChange,
    paymentOptions = [],
    bankAccounts = [],
    selectedBankAccount = null,
    onBankAccountChange,
    onSubmit,
    isSubmitting = false,
    hasItems = false,
    selectedCustomer = null,
    className = "",
}) {
    // Quick amount options
    const quickAmounts = [10000, 20000, 50000, 100000];

    // Calculations
    const payable = Math.max(subtotal - discount, 0);
    const isCashPayment = paymentMethod === "cash";
    const isBankTransfer = paymentMethod === "bank_transfer";
    const change = isCashPayment ? Math.max(cash - payable, 0) : 0;
    const remaining = isCashPayment ? Math.max(payable - cash, 0) : 0;

    // Validation
    const canSubmit =
        hasItems &&
        selectedCustomer &&
        (isCashPayment ? cash >= payable : true) &&
        (isBankTransfer ? selectedBankAccount !== null : true) &&
        !isSubmitting;

    // Submit label
    const submitLabel = useMemo(() => {
        if (!hasItems) return "Cart Is Empty";
        if (!selectedCustomer) return "Select Customer";
        if (isCashPayment && remaining > 0)
            return `Short ${formatCurrency(remaining)}`;
        return "Complete Transaction";
    }, [hasItems, selectedCustomer, isCashPayment, remaining]);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header with glassmorphism */}
            <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                    <IconReceipt
                        size={20}
                        className="text-white"
                    />
                </div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                    Payment
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
                {/* Enhanced Summary Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                                Subtotal
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>
                        {promoDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <IconSparkles size={14} className="text-primary-500" />
                                    Automatic Promotion
                                </span>
                                <span className="font-medium text-danger-500 tabular-nums">
                                    - {formatCurrency(promoDiscount)}
                                </span>
                            </div>
                        )}
                        {voucherDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">
                                    Voucher
                                </span>
                                <span className="font-medium text-danger-500 tabular-nums">
                                    - {formatCurrency(voucherDiscount)}
                                </span>
                            </div>
                        )}
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <IconCoin size={14} className="text-amber-500" />
                                    Redeemed Points
                                </span>
                                <span className="font-medium text-danger-500 tabular-nums">
                                    - {formatCurrency(loyaltyDiscount)}
                                </span>
                            </div>
                        )}
                        {discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">
                                    Discount
                                </span>
                                <span className="font-medium text-danger-500 tabular-nums">
                                    - {formatCurrency(discount)}
                                </span>
                            </div>
                        )}
                        {taxTotal > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">
                                    Sales Tax
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                                    {formatCurrency(taxTotal)}
                                </span>
                            </div>
                        )}
                        <div className="h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700 dark:to-transparent my-3" />
                        <div className="flex justify-between items-center">
                            <span className="text-base font-semibold text-slate-800 dark:text-white">
                                Total
                            </span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300 tabular-nums">
                                {formatCurrency(payable)}
                            </span>
                        </div>
                    </div>
                </div>

                {selectedCustomer?.is_loyalty_member && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <IconCoin size={18} className="text-amber-600 dark:text-amber-400" />
                            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                Loyalty Rewards
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Redeem Points
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={redeemPointsInput}
                                    onChange={(e) =>
                                        onRedeemPointsChange?.(
                                            e.target.value.replace(/[^\d]/g, "")
                                        )
                                    }
                                    placeholder={`Max ${availablePoints} points`}
                                    className="w-full h-11 pl-4 pr-12 rounded-xl border border-amber-300 dark:border-amber-700
                                        bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200
                                        focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
                                        transition-all text-base"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-amber-600 dark:text-amber-400">
                                    {availablePoints} pts
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Customer Voucher
                            </label>
                            <select
                                value={selectedVoucherId}
                                onChange={(e) =>
                                    onVoucherChange?.(e.target.value)
                                }
                                className="w-full h-11 px-4 rounded-xl border border-amber-300 dark:border-amber-700
                                    bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200
                                    focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
                                    transition-all text-base"
                            >
                                <option value="">No voucher</option>
                                {voucherOptions.map((voucher) => (
                                    <option key={voucher.id} value={voucher.id}>
                                        {voucher.code} - {voucher.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Discount Input with enhanced UI */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <IconCalculator size={16} className="text-slate-400" />
                        Discount (Rs)
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={discountInput}
                        onChange={(e) =>
                            onDiscountChange(
                                e.target.value.replace(/[^\d]/g, "")
                            )
                        }
                        placeholder="0"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700
                            bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200
                            focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                            transition-all text-base shadow-sm"
                    />
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Payment Method
                    </label>
                    <div className="space-y-2">
                        {paymentOptions.map((method) => (
                            <PaymentMethodCard
                                key={method.value}
                                method={method}
                                isSelected={paymentMethod === method.value}
                                onClick={onPaymentMethodChange}
                            />
                        ))}
                    </div>
                </div>

                {/* Bank Selector (only for bank_transfer) */}
                {paymentMethod === "bank_transfer" &&
                    bankAccounts.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <IconBuildingBank size={16} className="text-slate-400" />
                                Select Destination Account
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {bankAccounts.map((bank) => {
                                    const isActive =
                                        selectedBankAccount?.id === bank.id;
                                    return (
                                        <button
                                            type="button"
                                            key={bank.id}
                                            onClick={() =>
                                                onBankAccountChange?.(bank)
                                            }
                                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                                                isActive
                                                    ? "border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/50 shadow-lg shadow-primary-500/20"
                                                    : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-slate-900 hover:shadow-md"
                                            }`}
                                        >
                                            {isActive && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 animate-pulse" />
                                            )}
                                            <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm relative z-10">
                                                {bank.logo_url ? (
                                                    <img
                                                        src={bank.logo_url}
                                                        alt={bank.bank_name}
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                ) : (
                                                    <IconBuildingBank
                                                        size={24}
                                                        className="text-slate-500"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                    {bank.bank_name}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                                                    {bank.account_number}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                                    Account Name: {bank.account_name}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center relative z-10 shadow-md">
                                                    <IconCheck size={16} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                {/* Cash Input (only for cash payment) */}
                {isCashPayment && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
                        <label className="block text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                            <IconCash size={18} className="text-emerald-600 dark:text-emerald-400" />
                            Payment Amount (Rs)
                        </label>

                        {/* Quick Amounts */}
                        <div className="flex gap-2 mb-3">
                            {quickAmounts.map((amount) => (
                                <QuickAmountButton
                                    key={amount}
                                    amount={amount}
                                    onClick={(a) => onCashChange(String(a))}
                                    isSelected={cash === amount}
                                />
                            ))}
                        </div>

                        {/* Cash Input */}
                        <input
                            type="text"
                            inputMode="numeric"
                            value={cashInput}
                            onChange={(e) =>
                                onCashChange(
                                    e.target.value.replace(/[^\d]/g, "")
                                )
                            }
                            placeholder="0"
                            className="w-full h-14 px-4 rounded-xl border-2 border-emerald-300 dark:border-emerald-700
                                bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200
                                focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                                transition-all text-lg font-semibold text-center shadow-sm"
                        />

                        {/* Enhanced Change Display */}
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                    <IconCalculator size={16} />
                                    Change
                                </span>
                                <span
                                    className={`text-2xl font-bold tabular-nums ${
                                        change > 0
                                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-300"
                                            : "text-slate-400"
                                    }`}
                                >
                                    {formatCurrency(change)}
                                </span>
                            </div>
                            {remaining > 0 && (
                                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-700">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Amount Due
                                        </span>
                                        <span className="text-sm font-semibold text-danger-500 tabular-nums">
                                            {formatCurrency(remaining)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Non-cash payment info */}
                {!isCashPayment && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                <IconAlertCircle
                                    size={20}
                                    className="text-white"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                    Non-Cash Payment
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    The payment link will appear on the invoice
                                    page after the transaction is created.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Submit Button */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className={`
                        w-full h-16 rounded-2xl text-base font-semibold
                        flex items-center justify-center gap-3
                        transition-all duration-300 relative overflow-hidden
                        ${
                            canSubmit
                                ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 active:scale-[0.98]"
                                : "bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        }
                    `}
                >
                    {canSubmit && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
                    )}
                    {isSubmitting ? (
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span className="relative z-10">{submitLabel}</span>
                            {canSubmit && (
                                <IconArrowRight size={22} className="relative z-10 transition-transform group-hover:translate-x-1" />
                            )}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// Export sub-components
PaymentPanel.QuickAmountButton = QuickAmountButton;
PaymentPanel.PaymentMethodCard = PaymentMethodCard;