import React, {
    useEffect,
    useMemo,
    useState,
    useCallback,
    useRef,
} from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import toast from "react-hot-toast";
import POSLayout from "@/Layouts/POSLayout";
import ProductGrid from "@/Components/POS/ProductGrid";
import CartPanel from "@/Components/POS/CartPanel";
import CustomerSelect from "@/Components/POS/CustomerSelect";
import NumpadModal from "@/Components/POS/NumpadModal";
import HeldTransactions, {
    HoldButton,
} from "@/Components/POS/HeldTransactions";
import useBarcodeScanner from "@/Hooks/useBarcodeScanner";
import { getProductImageUrl } from "@/Utils/imageUrl";
import { useAuthorization } from "@/Utils/authorization";
import { queueTransaction, getPendingTransactions, getPendingCount, removePendingTransaction } from "@/Utils/offlineDb";
import {
    IconUser,
    IconShoppingCart,
    IconReceipt,
    IconKeyboard,
    IconBarcode,
    IconTrash,
    IconCash,
    IconCreditCard,
    IconBuildingBank,
    IconAlertTriangle,
    IconWallet,
} from "@tabler/icons-react";
import { formatCurrency as formatPrice } from "@/Utils/currency";

const roundUpToNearest = (value, step) =>
    Math.ceil(value / step) * step;

export default function Index({
    carts = [],
    carts_total = 0,
    heldCarts = [],
    customers = [],
    products = [],
    categories = [],
    initialPricingPreview = { items: [], summary: {} },
    paymentGateways = [],
    defaultPaymentGateway = "cash",
    bankAccounts = [],
    loyaltyTierOptions = [],
}) {
    const { t } = useTranslation();
    const {
        auth,
        errors,
        flash,
        lowStockNotifications = [],
        activeCashierShift,
    } = usePage().props;
    const { can } = useAuthorization();
    const canOpenShift = can("cashier-shifts-open");

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [addingProductId, setAddingProductId] = useState(null);
    const [removingItemId, setRemovingItemId] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [pricingPreview, setPricingPreview] = useState(initialPricingPreview);
    const [isLoadingPricing, setIsLoadingPricing] = useState(false);
    const [discountInput, setDiscountInput] = useState("");
    const [redeemPointsInput, setRedeemPointsInput] = useState("");
    const [cashInput, setCashInput] = useState("");
    const [shippingInput, setShippingInput] = useState("");
    const [orderType, setOrderType] = useState("in_store");
    const [orderNote, setOrderNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState(
        defaultPaymentGateway ?? "cash"
    );
    const [payLater, setPayLater] = useState(false);
    const [dueDate, setDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mobileView, setMobileView] = useState("products"); // 'products' | 'cart'
    const [numpadOpen, setNumpadOpen] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [selectedBankAccount, setSelectedBankAccount] = useState(null);
    const [splitMode, setSplitMode] = useState(false);
    const emptyTender = { method: "", amount: "", cash_received: "", bank_account_id: null };
    const [splitTenders, setSplitTenders] = useState([{ ...emptyTender }, { ...emptyTender }]);
    const [selectedVoucherId, setSelectedVoucherId] = useState("");
    const [openingCashInput, setOpeningCashInput] = useState("");
    const [shiftNotesInput, setShiftNotesInput] = useState("");
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const normalizedSelectedCategory =
        selectedCategory === null ? null : Number(selectedCategory);
    const pricingItemsByCartId = useMemo(() => {
        const items = pricingPreview?.items || [];

        return items.reduce((accumulator, item) => {
            accumulator[item.cart_id] = item;

            return accumulator;
        }, {});
    }, [pricingPreview]);

    // Ref for search input to enable keyboard focus
    const searchInputRef = useRef(null);

    // Set default payment method
    useEffect(() => {
        setPaymentMethod(defaultPaymentGateway ?? "cash");
    }, [defaultPaymentGateway]);

    useEffect(() => {
        setPricingPreview(initialPricingPreview);
    }, [initialPricingPreview]);

    // Show flash messages
    useEffect(() => {
        if (flash?.error) toast.error(flash.error);
        if (flash?.success) toast.success(flash.success);
    }, [flash]);

    // Auto-select walk-in customer on load
    useEffect(() => {
        const walkInCustomer = customers.find((c) => c.is_walkin);
        if (walkInCustomer && !selectedCustomer) {
            setSelectedCustomer(walkInCustomer);
        }
    }, [customers]);

    // Barcode scanner integration
    const handleBarcodeScan = useCallback(
        (barcode) => {
            const product = products.find(
                (p) => p.barcode?.toLowerCase() === barcode.toLowerCase()
            );

            if (product) {
                if (product.stock > 0) {
                    handleAddToCart(product);
                    toast.success(`${product.title} added (barcode)`);
                } else {
                    toast.error(`${product.title} is out of stock`);
                }
            } else {
                toast.error(`Product not found: ${barcode}`);
            }
        },
        [products]
    );

    const { isScanning } = useBarcodeScanner(handleBarcodeScan, {
        enabled: true,
        minLength: 3,
    });

    const LowStockAlerts = () => null;

    // Calculations
    const discount = useMemo(
        () => Math.max(0, Number(discountInput) || 0),
        [discountInput]
    );
    const shipping = useMemo(
        () => Math.max(0, Number(shippingInput) || 0),
        [shippingInput]
    );
    const baseSubtotal = useMemo(
        () => Number(pricingPreview?.summary?.base_subtotal ?? carts_total ?? 0),
        [pricingPreview, carts_total]
    );
    const promoDiscount = useMemo(
        () => Number(pricingPreview?.summary?.promo_discount_total ?? 0),
        [pricingPreview]
    );
    const voucherDiscount = useMemo(
        () => Number(pricingPreview?.summary?.voucher_discount_total ?? 0),
        [pricingPreview]
    );
    const loyaltyDiscount = useMemo(
        () => Number(pricingPreview?.summary?.loyalty_discount_total ?? 0),
        [pricingPreview]
    );
    const taxTotal = useMemo(
        () => Number(pricingPreview?.summary?.tax_total ?? 0),
        [pricingPreview]
    );
    const subtotal = useMemo(
        () => Number(pricingPreview?.summary?.subtotal_after_promo ?? 0),
        [pricingPreview]
    );
    const payable = useMemo(
        () => Number(pricingPreview?.summary?.grand_total ?? 0),
        [pricingPreview]
    );
    const quickCashAmounts = useMemo(() => {
        if (payable <= 0) return [];

        return [...new Set([
            payable,
            roundUpToNearest(payable, 10000),
            roundUpToNearest(payable, 50000),
            roundUpToNearest(payable, 100000),
        ])]
            .filter((amount) => amount >= payable)
            .slice(0, 4);
    }, [payable]);
    const isCashPayment = !payLater && !splitMode && paymentMethod === "cash";
    const isDelivery = orderType === "delivery";
    const cash = useMemo(
        () => (isCashPayment ? Math.max(0, Number(cashInput) || 0) : payable),
        [cashInput, isCashPayment, payable]
    );
    const cartCount = useMemo(
        () => carts.reduce((total, item) => total + Number(item.qty), 0),
        [carts]
    );
    const pricingDependency = useMemo(
        () => carts.map((item) => `${item.id}:${item.qty}`).join("|"),
        [carts]
    );

    useEffect(() => {
        if (carts.length === 0) {
            setPricingPreview({
                items: [],
                summary: {
                    base_subtotal: 0,
                    promo_discount_total: 0,
                    subtotal_after_promo: 0,
                    voucher_discount_total: 0,
                    loyalty_discount_total: 0,
                    manual_discount_total: 0,
                    shipping_cost: 0,
                    tax_total: 0,
                    grand_total: 0,
                },
            });
            setIsLoadingPricing(false);

            return;
        }

        const controller = new AbortController();
        setIsLoadingPricing(true);

        const timeoutId = window.setTimeout(() => {
            axios
                .post(
                    route("transactions.pricing-preview"),
                    {
                        customer_id: selectedCustomer?.id ?? null,
                        discount,
                        shipping_cost: shipping,
                        redeem_points: Number(redeemPointsInput || 0),
                        customer_voucher_id: selectedVoucherId || null,
                    },
                    { signal: controller.signal }
                )
                .then((response) => {
                    if (!controller.signal.aborted) {
                        setPricingPreview(response.data?.data ?? initialPricingPreview);
                    }
                })
                .catch(() => {
                    if (!controller.signal.aborted) {
                        toast.error("Failed to load active promo");
                    }
                })
                .finally(() => {
                    if (!controller.signal.aborted) {
                        setIsLoadingPricing(false);
                    }
                });
        }, 150);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [
        selectedCustomer?.id,
        pricingDependency,
        discount,
        shipping,
        redeemPointsInput,
        selectedVoucherId,
    ]);

    useEffect(() => {
        if (!selectedCustomer?.is_loyalty_member) {
            setRedeemPointsInput("");
            setSelectedVoucherId("");
        }
    }, [selectedCustomer?.id, selectedCustomer?.is_loyalty_member]);

    useEffect(() => {
        const eligibleVoucherIds = new Set(
            (pricingPreview?.eligible_vouchers || []).map((voucher) =>
                String(voucher.id)
            )
        );

        if (selectedVoucherId && !eligibleVoucherIds.has(selectedVoucherId)) {
            setSelectedVoucherId("");
        }
    }, [pricingPreview?.eligible_vouchers, selectedVoucherId]);

    // Payment options
    const paymentOptions = useMemo(() => {
        const options = Array.isArray(paymentGateways)
            ? paymentGateways.filter(
                  (gateway) =>
                      gateway?.value && gateway.value.toLowerCase() !== "cash"
              )
            : [];

        return [
            {
                value: "cash",
                label: t("transactions.cash"),
                description: t("transactions.directCashPayment"),
            },
            ...options,
        ];
    }, [paymentGateways]);

    // Auto-set cash input for non-cash payment
    useEffect(() => {
        if (!isCashPayment && payable >= 0) {
            setCashInput(String(payable));
        }
    }, [isCashPayment, payable]);

    // Split payment helpers
    const activeSplitTenders = useMemo(
        () => splitTenders.filter((t) => t.method && Number(t.amount) > 0),
        [splitTenders]
    );
    const splitTotal = useMemo(
        () => activeSplitTenders.reduce((sum, t) => sum + Number(t.amount || 0), 0),
        [activeSplitTenders]
    );
    const splitRemaining = payable - splitTotal;
    const updateSplitTender = (index, patch) =>
        setSplitTenders((prev) =>
            prev.map((tender, i) =>
                i === index ? { ...tender, ...patch } : tender
            )
        );
    const resetSplitTenders = () => {
        setSplitMode(false);
        setSplitTenders([{ ...emptyTender }, { ...emptyTender }]);
    };

    const handleOpenShift = () => {
        router.post(route("cashier-shifts.store"), {
            opening_cash: Number(openingCashInput || 0),
            notes: shiftNotesInput,
            redirect_to: "transactions",
        });
    };

    // Handle add product to cart
    const handleAddToCart = async (product, unit = null, variationId = null, variationName = null) => {
        if (!product?.id) return;

        setAddingProductId(product.id);

        // Calculate correct price: variation price takes precedence over unit price
        const finalPrice = variationId && product.variation_prices?.[variationId]
            ? product.variation_prices[variationId]
            : (unit ? unit.sell_price : product.sell_price);

        router.post(
            route("transactions.addToCart"),
            {
                product_id: product.id,
                sell_price: finalPrice,
                qty: 1,
                unit_id: unit ? unit.unit_id : undefined,
                variation_id: variationId,
                variation_name: variationName,
            },
            {
                preserveScroll: true,
                only: ["carts", "carts_total", "initialPricingPreview"],
                onSuccess: () => {
                    toast.success(`${product.title}${variationName ? ` (${variationName})` : ""}${unit ? ` (${unit.code})` : ""} added to cart`);
                    setAddingProductId(null);
                },
                onError: () => {
                    toast.error("Failed to add product");
                    setAddingProductId(null);
                },
            }
        );
    };

    // Handle update cart quantity
    const [updatingCartId, setUpdatingCartId] = useState(null);

    const handleUpdateQty = (cartId, newQty) => {
        if (newQty < 1) return;
        setUpdatingCartId(cartId);

        router.patch(
            route("transactions.updateCart", cartId),
            { qty: newQty },
            {
                preserveScroll: true,
                only: ["carts", "carts_total", "initialPricingPreview"],
                onSuccess: () => {
                    setUpdatingCartId(null);
                },
                onError: (errors) => {
                    toast.error(errors?.message || "Failed to update quantity");
                    setUpdatingCartId(null);
                },
            }
        );
    };

    // Handle numpad confirm for cash input
    const handleNumpadConfirm = useCallback((value) => {
        setCashInput(String(value));
    }, []);

    const handleOrderTypeChange = (value) => {
        setOrderType(value);

        if (value !== "delivery") {
            setShippingInput("");
        }
    };

    // Handle hold transaction
    const [isHolding, setIsHolding] = useState(false);

    const handleHoldCart = async (label = null) => {
        if (carts.length === 0) {
            toast.error(t("transactions.cartEmpty"));
            return;
        }

        setIsHolding(true);

        router.post(
            route("transactions.hold"),
            { label },
            {
                preserveScroll: true,
                only: ["carts", "carts_total", "heldCarts", "initialPricingPreview"],
                onSuccess: () => {
                    toast.success(t("transactions.transactionHeld"));
                    setIsHolding(false);
                },
                onError: (errors) => {
                    toast.error(errors?.message || t("transactions.transactionHeldError"));
                    setIsHolding(false);
                },
            }
        );
    };

    // Pending offline transactions
    const refreshPendingCount = useCallback(async () => {
        try {
            setPendingSyncCount(await getPendingCount());
        } catch {
            // IndexedDB unavailable
        }
    }, []);

    const flushPendingTransactions = useCallback(async () => {
        if (!navigator.onLine) return;

        const pending = await getPendingTransactions();
        if (pending.length === 0) return;

        const { data } = await axios.post(
            "/api/v1/pos/transactions/sync",
            {
                transactions: pending.map((row) => ({
                    ...row.data,
                    queue_id: row.id,
                })),
            },
            { headers: { Accept: "application/json" } }
        );

        const results = data?.data?.results || [];
        let synced = 0;
        let failed = 0;

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const row = pending[i];

            if (
                ["synced", "pending_approval", "duplicate"].includes(
                    result.status
                )
            ) {
                await removePendingTransaction(row.id);
                synced++;
            } else {
                failed++;
                toast.error(
                    `Sync failed: ${result.reason || "Unknown error"}`
                );
            }
        }

        if (synced > 0) {
            toast.success(
                `${synced} offline transaction(s) synced. The page will reload.`,
                { duration: 2500 }
            );
            router.reload({ only: ["carts", "carts_total"] });
        }

        await refreshPendingCount();
    }, [refreshPendingCount]);

    // Flush pending transactions on mount (if online)
    useEffect(() => {
        refreshPendingCount();

        if (navigator.onLine) {
            flushPendingTransactions().catch(() => {});
        }
    }, [refreshPendingCount, flushPendingTransactions]);

    // Flush on reconnect
    useEffect(() => {
        const handleOnline = () => {
            flushPendingTransactions().catch(() => {});
        };

        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, [flushPendingTransactions]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
                return;

            switch (e.key) {
                case "/":
                case "F5":
                    e.preventDefault();
                    // Focus search input
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                    break;
                case "F1":
                    e.preventDefault();
                    setNumpadOpen(true);
                    break;
                case "F2":
                    e.preventDefault();
                    if (carts.length > 0 && selectedCustomer)
                        handleSubmitTransaction();
                    break;
                case "F3":
                    e.preventDefault();
                    setMobileView(
                        mobileView === "products" ? "cart" : "products"
                    );
                    break;
                case "F4":
                    e.preventDefault();
                    setShowShortcuts(!showShortcuts);
                    break;
                case "Escape":
                    setNumpadOpen(false);
                    setShowShortcuts(false);
                    setSearchQuery("");
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [carts, selectedCustomer, mobileView, showShortcuts]);

    // Handle remove from cart
    const handleRemoveFromCart = (cartId) => {
        setRemovingItemId(cartId);

        router.delete(route("transactions.destroyCart", cartId), {
            preserveScroll: true,
            only: ["carts", "carts_total", "initialPricingPreview"],
            onSuccess: () => {
                toast.success("Item removed from cart");
                setRemovingItemId(null);
            },
            onError: () => {
                toast.error("Failed to remove item");
                setRemovingItemId(null);
            },
        });
    };

    // Handle submit transaction
    const handleSubmitTransaction = () => {
        if (carts.length === 0) {
            toast.error("The cart is empty");
            return;
        }

        // Walk-in sales can proceed without a customer; credit sales require a customer.
        if (payLater && !selectedCustomer?.id) {
            toast.error(t("transactions.messages.payLaterRequiresCustomer"));
            return;
        }

        if (payLater && !dueDate) {
            toast.error("Enter a due date for the credit sale.");
            return;
        }

        if (!payLater && isCashPayment && cash < payable) {
            toast.error(t("transactions.paymentInsufficient"));
            return;
        }

        // Validate bank transfer requires bank selection
        const isBankTransfer = paymentMethod === "bank_transfer";
        if (!splitMode && isBankTransfer && !selectedBankAccount) {
            toast.error(t("transactions.selectBankAccount"));
            return;
        }

        // Split payment validation
        if (splitMode) {
            if (payLater) {
                toast.error("Split payment not applicable for credit notes");
                return;
            }
            if (activeSplitTenders.length < 2) {
                toast.error("Split payment requires 2 methods");
                return;
            }
            if (splitRemaining !== 0) {
                toast.error(
                    splitRemaining > 0
                        ? t("transactions.shortMessage", { amount: formatPrice(splitRemaining) })
                        : t("transactions.excessMessage", { amount: formatPrice(-splitRemaining) })
                );
                return;
            }
            const bankTender = activeSplitTenders.find(
                (t) => t.method === "bank_transfer"
            );
            if (bankTender && !bankTender.bank_account_id) {
                toast.error("Select destination bank account for transfer tender");
                return;
            }
            const cashTender = activeSplitTenders.find(
                (t) => t.method === "cash"
            );
            if (
                cashTender &&
                Number(cashTender.cash_received || 0) < Number(cashTender.amount)
            ) {
                toast.error(t("transactions.splitCashError"));
                return;
            }
        }

        setIsSubmitting(true);

        if (!navigator.onLine && splitMode) {
            toast.error("Split payment not available offline");
            setIsSubmitting(false);
            return;
        }

        if (!navigator.onLine) {
            const payload = {
                client_uuid: crypto.randomUUID(),
                customer_id: selectedCustomer?.id ?? null,
                discount,
                redeem_points: Number(redeemPointsInput || 0),
                customer_voucher_id: selectedVoucherId || null,
                shipping_cost: shipping,
                grand_total: payable,
                cash: isCashPayment ? cash : payable,
                payment_gateway: payLater ? null : isCashPayment ? null : paymentMethod,
                pay_later: payLater,
                due_date: payLater ? dueDate : null,
                bank_account_id: isBankTransfer ? selectedBankAccount?.id : null,
                order_type: orderType,
                note: orderNote || null,
                items: carts.map((item) => ({
                    product_id: item.product_id,
                    unit_id: item.unit?.id ?? item.unit_id ?? null,
                    qty: Number(item.qty),
                })),
            };
            queueTransaction(payload).then(() => {
                refreshPendingCount();
                setCarts([]);
                setPricingPreview(initialPricingPreview);
                toast.success("Transaction saved offline. Will be sent when online.");
            });
            setIsSubmitting(false);
            return;
        }

        router.post(
            route("transactions.store"),
            {
                customer_id: selectedCustomer?.id ?? null,
                discount,
                redeem_points: Number(redeemPointsInput || 0),
                customer_voucher_id: selectedVoucherId || null,
                shipping_cost: shipping,
                grand_total: payable,
                cash: isCashPayment ? cash : payable,
                change: isCashPayment ? Math.max(cash - payable, 0) : 0,
                // ponytail: tenders[] only when split active — legacy single-method path otherwise
                tenders: splitMode
                    ? activeSplitTenders.map((tender) => ({
                          method: tender.method,
                          amount: Number(tender.amount),
                          cash_received:
                              tender.method === "cash"
                                  ? Number(tender.cash_received || tender.amount)
                                  : null,
                          bank_account_id:
                              tender.method === "bank_transfer"
                                  ? tender.bank_account_id
                                  : null,
                      }))
                    : null,
                payment_gateway: splitMode
                    ? null
                    : payLater
                      ? null
                      : isCashPayment
                        ? null
                        : paymentMethod,
                bank_account_id: isBankTransfer
                    ? selectedBankAccount?.id
                    : null,
                pay_later: payLater,
                due_date: dueDate,
                order_type: orderType,
                note: orderNote || null,
            },
            {
                onSuccess: () => {
                    setDiscountInput("");
                    setRedeemPointsInput("");
                    setCashInput("");
                    setShippingInput("");
                    setSelectedCustomer(null);
                    setSelectedBankAccount(null);
                    resetSplitTenders();
                    setSelectedVoucherId("");
                    setPaymentMethod(defaultPaymentGateway ?? "cash");
                    setPayLater(false);
                    setDueDate("");
                    setOrderType("in_store");
                    setOrderNote("");
                    setIsSubmitting(false);
                    toast.success("Transaction successful!");
                },
                onError: () => {
                    setIsSubmitting(false);
                    toast.error("Failed to save transaction");
                },
            }
        );
    };

    // Filter products including out of stock
    const allProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCategory =
                normalizedSelectedCategory === null ||
                Number(product.category_id) === normalizedSelectedCategory;
            const matchesSearch =
                !searchQuery ||
                product.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                product.barcode
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, normalizedSelectedCategory, searchQuery]);

    if (!activeCashierShift) {
        return (
            <>
                <Head title={t("transactions.openShift")} />

                <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center px-4 py-10">
                    <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <IconWallet size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Cashier shift not opened
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Open shift first to enable transactions, cart, and cash closing.
                        </p>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Opening Cash
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={openingCashInput}
                                    onChange={(event) => setOpeningCashInput(event.target.value)}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    placeholder="0"
                                />
                                {errors?.opening_cash && (
                                    <p className="mt-2 text-xs text-rose-500">{errors.opening_cash}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Notes
                                </label>
                                <input
                                    type="text"
                                    value={shiftNotesInput}
                                    onChange={(event) => setShiftNotesInput(event.target.value)}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    placeholder={t("common.labels.optional")}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            {canOpenShift && (
                                <button
                                    type="button"
                                    onClick={handleOpenShift}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                                >
                                    <IconWallet size={18} />
                                    <span>Open Shift Now</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => router.visit(route("cashier-shifts.index"))}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <span>View Shift History</span>
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={t("transactions.title")} />

            <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                {/* Enhanced Mobile Tab Switcher */}
                <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <button
                        onClick={() => setMobileView("products")}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-300 ${
                            mobileView === "products"
                                ? "text-primary-600 border-b-2 border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/50"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                    >
                        <IconShoppingCart size={20} className={mobileView === "products" ? "text-primary-600" : "text-slate-400"} />
                        <span>Products</span>
                    </button>
                    <button
                        onClick={() => setMobileView("cart")}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-300 relative ${
                            mobileView === "cart"
                                ? "text-primary-600 border-b-2 border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/50"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                    >
                        <IconReceipt size={20} className={mobileView === "cart" ? "text-primary-600" : "text-slate-400"} />
                        <span className="relative inline-flex items-center gap-1">
                            Cart
                            {cartCount > 0 && (
                                <span className="inline-flex items-center justify-center px-2 min-w-[24px] h-6 text-[11px] font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-md shadow-primary-500/30">
                                    {cartCount}
                                </span>
                            )}
                        </span>
                    </button>
                </div>

                {/* Left Panel - Products */}
                <div
                    data-tour="pos-products"
                    className={`flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden ${
                        mobileView !== "products"
                            ? "hidden lg:flex lg:flex-col"
                            : "flex flex-col"
                    }`}
                >
                    <ProductGrid
                        products={allProducts}
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={(categoryId) =>
                            setSelectedCategory(
                                categoryId === null ? null : Number(categoryId)
                            )
                        }
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        isSearching={isSearching}
                        onAddToCart={handleAddToCart}
                        addingProductId={addingProductId}
                        searchInputRef={searchInputRef}
                    />
                </div>

                {/* Right Panel - Cart & Payment */}
                <div
                        className={`w-full min-w-0 lg:w-[420px] xl:w-[480px] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 min-h-0 overflow-hidden shadow-xl lg:shadow-none ${
                        mobileView !== "cart" ? "hidden lg:flex" : "flex"
                    }`}
                    style={{ height: "calc(100vh - 4rem)" }}
                >
                    {/* Customer Select - Fixed */}
                    <div
                        data-tour="pos-customer"
                        className="min-w-0 p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
                    >
                        <CustomerSelect
                            customers={customers}
                            selected={selectedCustomer}
                            onSelect={setSelectedCustomer}
                            placeholder={t("transactions.selectCustomer")}
                            error={errors?.customer_id}
                            label={t("transactions.customer")}
                            tierOptions={loyaltyTierOptions}
                        />
                    </div>

                    {/* Held Transactions & Alerts */}
                    {heldCarts.length > 0 && (
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                            <HeldTransactions
                                heldCarts={heldCarts}
                                hasActiveCart={carts.length > 0}
                            />
                        </div>
                    )}

                    {/* Cart Items - Scrollable */}
                    <div data-tour="pos-cart" className="flex-1 overflow-y-auto min-h-0">
                        {/* Hold Button - at top of cart section */}
                        {carts.length > 0 && (
                            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                                <HoldButton
                                    hasItems={carts.length > 0}
                                    onHold={handleHoldCart}
                                    isHolding={isHolding}
                                />
                            </div>
                        )}

                        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <IconShoppingCart size={16} />
                                    Cart
                                </h3>
                                {carts.length > 0 && (
                                    <span className="px-2.5 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-full whitespace-nowrap">
                                        {cartCount} item
                                    </span>
                                )}
                            </div>

                            {carts.length > 0 ? (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {carts.map((item) => (
                                        (() => {
                                            const pricingItem =
                                                pricingItemsByCartId[item.id];
                                            const baseLineTotal = Number(
                                                pricingItem?.line_base_total ??
                                                    item.price ??
                                                    0
                                            );
                                            const effectiveLineTotal = Number(
                                                pricingItem?.line_total ??
                                                    item.price ??
                                                    0
                                            );
                                            const effectiveUnitPrice = Number(
                                                pricingItem?.effective_unit_price ??
                                                    item.product?.sell_price ??
                                                    0
                                            );
                                            const baseUnitPrice = Number(
                                                pricingItem?.base_unit_price ??
                                                    item.product?.sell_price ??
                                                    0
                                            );
                                            const pricingRule =
                                                pricingItem?.pricing_rule;

                                            return (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                                {item.product?.image ? (
                                                    <img
                                                        src={getProductImageUrl(
                                                            item.product.image
                                                        )}
                                                        alt={item.product.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <IconShoppingCart
                                                            size={14}
                                                            className="text-slate-400"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                                    {item.product?.title ||
                                                        "Product"}
                                                </p>
                                                <div className="text-xs text-slate-500">
                                                    {pricingRule &&
                                                        effectiveUnitPrice <
                                                            baseUnitPrice && (
                                                            <p className="line-through text-slate-400">
                                                                {formatPrice(
                                                                    baseUnitPrice
                                                                )}{" "}
                                                                × {item.qty}
                                                            </p>
                                                        )}
                                                    <p>
                                                        {formatPrice(
                                                            effectiveUnitPrice
                                                        )}{" "}
                                                        × {item.qty}
                                                    </p>
                                                    {pricingRule && (
                                                        <p className="mt-0.5 text-[11px] font-medium text-rose-500">
                                                            {pricingRule.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        handleUpdateQty(
                                                            item.id,
                                                            Math.max(
                                                                1,
                                                                item.qty - 1
                                                            )
                                                        )
                                                    }
                                                    disabled={item.qty <= 1}
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 disabled:opacity-50 text-xs"
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center text-xs font-medium">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleUpdateQty(
                                                            item.id,
                                                            item.qty + 1
                                                        )
                                                    }
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 text-xs"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleRemoveFromCart(
                                                            item.id
                                                        )
                                                    }
                                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/50 ml-1"
                                                >
                                                    <IconTrash size={12} />
                                                </button>
                                            </div>
                                            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 w-16 text-right">
                                                {formatPrice(
                                                    effectiveLineTotal
                                                )}
                                            </p>
                                        </div>
                                            );
                                        })()
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <IconShoppingCart
                                        size={32}
                                        className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
                                    />
                                    <p className="text-sm text-slate-400">
                                        {t("transactions.cartEmpty")}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Payment Details - Scrollable */}
                        <div data-tour="pos-payment" className="p-3 space-y-4">
                            {/* Pay later toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                        {t("transactions.payLaterLabel")}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {t("transactions.payLaterDescription")}
                                    </p>
                                </div>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={payLater}
                                        onChange={(e) => {
                                            setPayLater(e.target.checked);
                                            if (e.target.checked) {
                                                setSelectedBankAccount(null);
                                                setPaymentMethod("cash");
                                            }
                                        }}
                                    />
                                    <span
                                        className={`w-11 h-6 flex items-center bg-slate-300 rounded-full p-1 transition ${
                                            payLater ? "bg-primary-500" : ""
                                        }`}
                                    >
                                        <span
                                            className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                                                payLater ? "translate-x-5" : ""
                                            }`}
                                        />
                                    </span>
                                </label>
                            </div>

                            {payLater && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                        {t("transactions.dueDate")}
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                </div>
                            )}

                            {/* Order details */}
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                    {t("transactions.orderDetails")}
                                </p>

                                <div>
                                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                        {t("transactions.orderType")}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: "in_store", label: t("transactions.inStore") },
                                            { value: "takeaway", label: t("transactions.takeaway") },
                                            { value: "delivery", label: t("transactions.delivery") },
                                        ].map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => handleOrderTypeChange(type.value)}
                                                className={`min-h-10 rounded-lg px-1 py-2 text-xs font-semibold transition-all ${
                                                    orderType === type.value
                                                        ? "bg-primary-500 text-white"
                                                        : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {isDelivery && (
                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                            Shipping Fee
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                Rs
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={shippingInput}
                                                onChange={(e) =>
                                                    setShippingInput(e.target.value.replace(/[^\d]/g, ""))
                                                }
                                                placeholder="0"
                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                            />
                                        </div>
                                        <div className="mt-2 grid grid-cols-4 gap-2">
                                            {[10000, 15000, 20000, 25000].map((amt) => (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    onClick={() => setShippingInput(String(amt))}
                                                    className={`min-h-9 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-all ${
                                                        Number(shippingInput) === amt
                                                            ? "bg-primary-500 text-white"
                                                            : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                                    }`}
                                                >
                                                    {formatPrice(amt)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                        {t("Manual Discount (Rs)")}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                            Rs
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={discountInput}
                                            onChange={(e) =>
                                                setDiscountInput(e.target.value.replace(/[^\d]/g, ""))
                                            }
                                            placeholder="0"
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                        {t("transactions.note")}
                                    </label>
                                    <textarea
                                        value={orderNote}
                                        onChange={(e) => setOrderNote(e.target.value)}
                                        rows={2}
                                        maxLength={1000}
                                        placeholder={t("transactions.orderNotePlaceholder")}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    {t("transactions.paymentMethod")}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {paymentOptions.map((method) => (
                                        <button
                                            key={method.value}
                                            onClick={() =>
                                                !payLater &&
                                                setPaymentMethod(method.value)
                                            }
                                            disabled={payLater}
                                            className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                                                paymentMethod === method.value && !payLater
                                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                            } ${payLater ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    paymentMethod ===
                                                        method.value &&
                                                    !payLater
                                                        ? "bg-primary-500 text-white"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                }`}
                                            >
                                                {method.value === "cash" ? (
                                                    <IconCash size={16} />
                                                ) : method.value ===
                                                  "bank_transfer" ? (
                                                    <IconBuildingBank
                                                        size={16}
                                                    />
                                                ) : (
                                                    <IconCreditCard size={16} />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p
                                                    className={`text-sm font-semibold ${
                                                        paymentMethod ===
                                                        method.value
                                                            ? "text-primary-700 dark:text-primary-300"
                                                            : "text-slate-700 dark:text-slate-300"
                                                    }`}
                                                >
                                                    {method.label}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {!payLater && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (splitMode) {
                                                resetSplitTenders();
                                            } else {
                                                setSplitMode(true);
                                                setSplitTenders([
                                                    { ...emptyTender, method: "cash" },
                                                    { ...emptyTender },
                                                ]);
                                            }
                                        }}
                                        className={`mt-2 w-full rounded-xl border-2 border-dashed p-2 text-xs font-semibold transition-colors ${
                                            splitMode
                                                ? "border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950/30 dark:text-primary-300"
                                                : "border-slate-300 text-slate-500 hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:text-slate-400"
                                        }`}
                                    >
                                        {splitMode
                                            ? t("transactions.cancelSplitPayment")
                                            : t("transactions.splitPaymentLabel")}
                                    </button>
                                )}
                            </div>

                            {/* Split tender rows */}
                            {splitMode && !payLater && (
                                <div className="space-y-3 rounded-2xl border border-primary-100 bg-primary-50/50 p-3 dark:border-primary-900/50 dark:bg-primary-950/20">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                            {t("transactions.splitPayment")}
                                        </p>
                                        <span
                                            className={`text-xs font-semibold ${
                                                splitRemaining === 0
                                                    ? "text-success-600 dark:text-success-400"
                                                    : "text-amber-600 dark:text-amber-400"
                                            }`}
                                        >
                                            {splitRemaining === 0
                                                ? t("transactions.complete")
                                                : `${t("transactions.remaining")} ${formatPrice(splitRemaining)}`}
                                        </span>
                                    </div>
                                    {splitTenders.map((tender, index) => (
                                        <div
                                            key={index}
                                            className="space-y-2 rounded-xl bg-white p-3 dark:bg-slate-900"
                                        >
                                            <select
                                                value={tender.method}
                                                onChange={(e) =>
                                                    updateSplitTender(index, {
                                                        method: e.target.value,
                                                        bank_account_id: null,
                                                    })
                                                }
                                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                            >
                                                <option value="">
                                                    Select a payment method...
                                                </option>
                                                {paymentOptions.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {tender.method && (
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                                        Rs
                                                    </span>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={tender.amount}
                                                        onChange={(e) =>
                                                            updateSplitTender(
                                                                index,
                                                                {
                                                                    amount:
                                                                        e.target.value.replace(
                                                                            /[^\d]/g,
                                                                            ""
                                                                        ) || "",
                                                                }
                                                            )
                                                        }
                                                        placeholder="Amount"
                                                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                    />
                                                </div>
                                            )}
                                            {tender.method === "cash" && (
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={tender.cash_received}
                                                    onChange={(e) =>
                                                        updateSplitTender(index, {
                                                            cash_received:
                                                                e.target.value.replace(
                                                                    /[^\d]/g,
                                                                    ""
                                                                ) || "",
                                                        })
                                                    }
                                                    placeholder="Cash received (optional)"
                                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                />
                                            )}
                                            {tender.method === "bank_transfer" &&
                                                bankAccounts.length > 0 && (
                                                    <select
                                                        value={
                                                            tender.bank_account_id ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            updateSplitTender(index, {
                                                                bank_account_id:
                                                                    Number(
                                                                        e.target.value
                                                                    ) || null,
                                                            })
                                                        }
                                                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                    >
                                                        <option value="">
                                                            Select a bank account...
                                                        </option>
                                                        {bankAccounts.map(
                                                            (bank) => (
                                                                <option
                                                                    key={bank.id}
                                                                    value={bank.id}
                                                                >
                                                                    {
                                                                        bank.bank_name
                                                                    }{" "}
                                                                    -{" "}
                                                                    {
                                                                        bank.account_number
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bank Selector - Only for bank_transfer */}
                            {paymentMethod === "bank_transfer" &&
                                bankAccounts.length > 0 &&
                                !payLater && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            {t("transactions.destinationBank")}
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {bankAccounts.map((bank) => {
                                                const isActive =
                                                    selectedBankAccount?.id ===
                                                    bank.id;
                                                return (
                                                    <button
                                                        key={bank.id}
                                                        onClick={() =>
                                                            setSelectedBankAccount(
                                                                bank
                                                            )
                                                        }
                                                        className={`p-3 rounded-xl border-2 transition-colors flex items-center gap-3 text-left ${
                                                            isActive
                                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                                                                : "border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800"
                                                        }`}
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                                            {bank.logo_url ? (
                                                                <img
                                                                    src={
                                                                        bank.logo_url
                                                                    }
                                                                    alt={
                                                                        bank.bank_name
                                                                    }
                                                                    className="max-w-full max-h-full object-contain"
                                                                />
                                                            ) : (
                                                                <IconBuildingBank
                                                                    size={18}
                                                                    className="text-slate-500"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                                {
                                                                    bank.bank_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                {
                                                                    bank.account_number
                                                                }
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-500">
                                                                Account name:{" "}
                                                                {
                                                                    bank.account_name
                                                                }
                                                            </p>
                                                        </div>
                                                        {isActive && (
                                                            <span className="text-[11px] font-semibold text-primary-600">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            {/* Cash payment stays next to its quick amount actions. */}
                            {isCashPayment && (
                                <div className="space-y-3 rounded-2xl border border-primary-100 bg-primary-50/50 p-3 dark:border-primary-900/50 dark:bg-primary-950/20">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                {t("transactions.cashPayment")}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {t("transactions.totalDue")} {formatPrice(payable)}
                                            </p>
                                        </div>
                                        {cash < payable && payable > 0 && (
                                            <span className="text-right text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                {t("transactions.insufficientMessage", { amount: formatPrice(payable - cash) })}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                            {t("transactions.amountPaid")}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                Rs
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={cashInput}
                                                onChange={(e) =>
                                                    setCashInput(e.target.value.replace(/[^\d]/g, ""))
                                                }
                                                placeholder="0"
                                                className="h-12 w-full rounded-xl border border-primary-200 bg-white pl-10 pr-4 text-lg font-semibold text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-primary-800 dark:bg-slate-900 dark:text-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                Quick Amounts
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setCashInput(String(payable))}
                                                className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                            >
                                                Exact Amount
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {quickCashAmounts.map((amount) => (
                                                <button
                                                    key={amount}
                                                    type="button"
                                                    onClick={() => setCashInput(String(amount))}
                                                    className={`min-h-10 rounded-lg px-1 py-2 text-xs font-semibold transition-all ${
                                                        Number(cashInput) === amount
                                                            ? "bg-primary-500 text-white"
                                                            : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                                    }`}
                                                >
                                                    {formatPrice(amount)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-between rounded-xl p-3 ${
                                        cash >= payable && payable > 0
                                            ? "bg-success-100/70 dark:bg-success-950/30"
                                            : "bg-white/70 dark:bg-slate-900/50"
                                    }`}>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {t("transactions.change")}
                                        </span>
                                        <span className={`text-lg font-bold ${
                                            cash >= payable && payable > 0
                                                ? "text-success-600 dark:text-success-400"
                                                : "text-slate-400"
                                        }`}>
                                            {formatPrice(Math.max(cash - payable, 0))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Discount Input */}
                            {promoDiscount > 0 && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                                {t("transactions.autoPromoActive")}
                                            </p>
                                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                                                Item prices have been adjusted according to the active promotion rules.
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                            -{formatPrice(promoDiscount)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {selectedCustomer?.is_loyalty_member && (
                                <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 dark:border-primary-900/40 dark:bg-primary-950/20">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                                {t("transactions.loyaltyMember")}
                                            </p>
                                            <p className="text-xs text-primary-600/80 dark:text-primary-400/80">
                                                {t("transactions.tier")} {selectedCustomer.loyalty_tier} | {t("transactions.balance")}{" "}
                                                {pricingPreview?.summary
                                                    ?.available_loyalty_points ??
                                                    0}{" "}
                                                {t("transactions.points")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedCustomer?.is_loyalty_member && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                        {t("transactions.redeemPoints")}
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={redeemPointsInput}
                                        onChange={(e) =>
                                            setRedeemPointsInput(
                                                e.target.value.replace(
                                                    /[^\d]/g,
                                                    ""
                                                )
                                            )
                                        }
                                        placeholder={`Max ${
                                            pricingPreview?.summary
                                                ?.available_loyalty_points ?? 0
                                        } points`}
                                        className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                </div>
                            )}

                            {selectedCustomer?.is_loyalty_member &&
                                (pricingPreview?.eligible_vouchers || [])
                                    .length > 0 && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            {t("transactions.customerVoucher")}
                                        </label>
                                        <select
                                            value={selectedVoucherId}
                                            onChange={(e) =>
                                                setSelectedVoucherId(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        >
                                            <option value="">
                                                No voucher
                                            </option>
                                            {(
                                                pricingPreview?.eligible_vouchers ||
                                                []
                                            ).map((voucher) => (
                                                <option
                                                    key={voucher.id}
                                                    value={voucher.id}
                                                >
                                                    {voucher.code} -{" "}
                                                    {voucher.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                        </div>
                    </div>

                    {/* Summary & Submit - Fixed at bottom */}
                    <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3">
                        {/* Summary Row */}
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-slate-500">{t("transactions.baseSubtotal")}</span>
                            <span className="font-medium">
                                {formatPrice(baseSubtotal)}
                            </span>
                        </div>
                        {promoDiscount > 0 && (
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-slate-500">
                                    {t("transactions.autoPromo")}
                                </span>
                                <span className="text-emerald-600">
                                    -{formatPrice(promoDiscount)}
                                </span>
                            </div>
                        )}
                        {(pricingPreview?.applied_groups || []).length > 0 && (
                            <div className="mb-3 rounded-xl border border-slate-200 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/60">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {t("transactions.activePromoGroup")}
                                </div>
                                <div className="space-y-1.5">
                                    {(pricingPreview?.applied_groups || []).map(
                                        (group) => (
                                            <div
                                                key={group.key}
                                                className="flex items-center justify-between text-xs"
                                            >
                                                <span className="truncate pr-3 text-slate-600 dark:text-slate-300">
                                                    {group.label}
                                                </span>
                                                <span className="font-medium text-emerald-600">
                                                    -{formatPrice(group.discount_total)}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        {voucherDiscount > 0 && (
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-slate-500">{t("transactions.voucher")}</span>
                                <span className="text-primary-600">
                                    -{formatPrice(voucherDiscount)}
                                </span>
                            </div>
                        )}
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-slate-500">
                                    {t("transactions.redeemPoints")}
                                </span>
                                <span className="text-primary-600">
                                    -{formatPrice(loyaltyDiscount)}
                                </span>
                            </div>
                        )}
                        {discount > 0 && (
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-slate-500">{t("transactions.manualDiscount")}</span>
                                <span className="text-danger-500">
                                    -{formatPrice(discount)}
                                </span>
                            </div>
                        )}
                        {shipping > 0 && (
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-slate-500">Shipping Fee</span>
                                <span className="font-medium">
                                    +{formatPrice(shipping)}
                                </span>
                            </div>
                        )}
                        {taxTotal > 0 && (
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-slate-500">VAT</span>
                                <span className="font-medium">
                                    +{formatPrice(taxTotal)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-slate-800 dark:text-white">
                                Total
                            </span>
                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                {formatPrice(payable)}
                            </span>
                        </div>

                        {paymentMethod === "cash" &&
                            !payLater &&
                            cash >= payable &&
                            payable > 0 && (
                                <div className="flex justify-between items-center mb-3 p-2 rounded-lg bg-success-50 dark:bg-success-950/30">
                                    <span className="text-sm text-success-700 dark:text-success-400">
                                        Change
                                    </span>
                                    <span className="font-bold text-success-600">
                                        {formatPrice(cash - payable)}
                                    </span>
                                </div>
                            )}

                        {/* Submit Button - Always visible */}
                        <button
                            onClick={handleSubmitTransaction}
                            disabled={
                                !carts.length ||
                                !selectedCustomer ||
                                (!payLater &&
                                    paymentMethod === "cash" &&
                                    cash < payable) ||
                                isLoadingPricing ||
                                isSubmitting
                            }
                            className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                carts.length &&
                                selectedCustomer &&
                                (paymentMethod !== "cash" || cash >= payable)
                                    && !isLoadingPricing
                                    ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/30"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            }`}
                        >
                            {isSubmitting || isLoadingPricing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconReceipt size={18} />
                                    <span>
                                        {!carts.length
                                            ? "Cart is Empty"
                                            : !selectedCustomer
                                            ? "Select a Customer"
                                            : paymentMethod === "cash" &&
                                              cash < payable
                                            ? `${t("transactions.insufficientMessage", { amount: formatPrice(payable - cash) })}`
                                            : isLoadingPricing
                                            ? t("transactions.calculatingPromo")
                                            : t("transactions.completeTransaction")}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Numpad Modal */}
            <NumpadModal
                isOpen={numpadOpen}
                onClose={() => setNumpadOpen(false)}
                onConfirm={handleNumpadConfirm}
                title={t("transactions.paymentAmount")}
                initialValue={Number(cashInput) || 0}
                isCurrency={true}
            />

            {/* Keyboard Shortcuts Help */}
            {showShortcuts && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60"
                        onClick={() => setShowShortcuts(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <IconKeyboard size={24} />
                            {t("transactions.keyboardShortcuts")}
                        </h3>
                        <div className="space-y-3">
                            {[
                                ["F1", t("transactions.openNumpad")],
                                ["F2", t("transactions.completeTransaction")],
                                ["F3", t("transactions.toggleProductCart")],
                                ["F4", t("transactions.showHelp")],
                                ["Esc", t("transactions.closeModal")],
                            ].map(([key, desc]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {desc}
                                    </span>
                                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {key}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowShortcuts(false)}
                            className="mt-6 w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <POSLayout children={page} />;
