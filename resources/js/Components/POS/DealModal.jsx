import React, { useState, useEffect, useRef } from "react";
import { IconX, IconPlus, IconMinus, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import toast from "react-hot-toast";
import CustomComboBuilder from "@/Components/POS/CustomComboBuilder";

const formatPrice = (value = 0) =>
    Number(value || 0).toLocaleString("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
    });

const formatVariationName = (variationId) =>
    String(variationId || "")
        .replace(/^[a-z]+_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getDealItemPrice = (item, dealType) => {
    const variationId = item.selected_variation_id;
    const variationPrice = Number(item.product?.variation_prices?.[variationId] || 0);
    const productPrice = variationPrice || Number(item.product?.sell_price || 0);

    if (dealType !== "custom") {
        return productPrice;
    }

    const overridePrice = item.deal_variation_prices?.[variationId];
    if (overridePrice !== undefined && overridePrice !== null && overridePrice !== "") {
        return Number(overridePrice);
    }

    return item.deal_price ?? productPrice;
};

export default function DealModal({
    isOpen,
    onClose,
    onAddToCart,
    onCustomComboSubmit,
    customComboSubmitting = false,
    activeOutlet,
}) {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [dealTotal, setDealTotal] = useState(0);
    const [showCustomCombo, setShowCustomCombo] = useState(false);
    const requestControllerRef = useRef(null);

    // Fetch available deals when the modal opens
    useEffect(() => {
        if (isOpen) {
            fetchDeals();
        } else {
            requestControllerRef.current?.abort();
            requestControllerRef.current = null;
        }

        return () => requestControllerRef.current?.abort();
    }, [isOpen, activeOutlet?.id]);

    const fetchDeals = async () => {
        requestControllerRef.current?.abort();
        const controller = new AbortController();
        requestControllerRef.current = controller;
        setLoading(true);
        setLoadError(false);
        try {
            const { data } = await axios.get("/api/v1/pos/restaurant-deals", {
                signal: controller.signal,
            });
            if (!Array.isArray(data?.data)) {
                throw new Error("Unexpected restaurant deals response");
            }
            setDeals(data.data);
        } catch (error) {
            if (controller.signal.aborted) return;
            setDeals([]);
            setLoadError(true);
            toast.error("Failed to load deals");
            if (import.meta.env.DEV) {
                console.error("Error fetching deals:", {
                    status: error.response?.status,
                    message: error.response?.data?.message || error.message,
                });
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
                if (requestControllerRef.current === controller) {
                    requestControllerRef.current = null;
                }
            }
        }
    };

    const handleSelectDeal = (deal) => {
        setSelectedDeal(deal);
        setSelectedItems({});
        setDealTotal(0);

        // Initialize selected items for slot-based deals
        if (deal.deal_type === "slot_based" && deal.slots) {
            const initialItems = {};
            deal.slots.forEach((slot) => {
                initialItems[slot.id] = [];
            });
            setSelectedItems(initialItems);
        }
    };

    const handleItemSelection = (productId, slotId = null, variationId = null) => {
        if (selectedDeal.deal_type === "slot_based") {
            // Handle slot-based deal selection
            setSelectedItems((prev) => {
                const slotItems = prev[slotId] || [];
                const exists = slotItems.includes(productId);

                if (exists) {
                    return {
                        ...prev,
                        [slotId]: slotItems.filter((id) => id !== productId),
                    };
                } else {
                    const slot = selectedDeal.slots.find((s) => s.id === slotId);
                    if (slotItems.length < slot.max_selection) {
                        return {
                            ...prev,
                            [slotId]: [...slotItems, productId],
                        };
                    } else {
                        toast.error(
                            `Maximum ${slot.max_selection} items allowed for this slot`
                        );
                        return prev;
                    }
                }
            });
        } else {
            // Handle fixed-price or custom deal selection
            setSelectedItems((prev) => {
                const exists = prev[productId];
                if (exists) {
                    const newItems = { ...prev };
                    delete newItems[productId];
                    return newItems;
                } else {
                    // For custom deals with variations, store variation info
                    if (selectedDeal.deal_type === "custom" && variationId) {
                        return { ...prev, [productId]: { selected: true, variationId } };
                    }
                    return { ...prev, [productId]: true };
                }
            });
        }
    };

    const calculateDealPrice = () => {
        if (!selectedDeal) return 0;

        if (selectedDeal.deal_type === "fixed_price") {
            return selectedDeal.fixed_price || 0;
        }

        if (selectedDeal.deal_type === "custom") {
            // Custom deal: use deal_price for each selected item
            const itemIds = Object.keys(selectedItems).filter(
                (id) => selectedItems[id]
            );
            const items = selectedDeal.items.filter((item) =>
                itemIds.includes(String(item.product_id))
            );
            
            return items.reduce((sum, item) => {
                return sum + getDealItemPrice(item, selectedDeal.deal_type);
            }, 0);
        }

        if (selectedDeal.deal_type === "dynamic_price") {
            const itemIds = Object.keys(selectedItems).filter(
                (id) => selectedItems[id]
            );
            const items = selectedDeal.items.filter((item) =>
                itemIds.includes(String(item.product_id))
            );
            const baseTotal = items.reduce(
                (sum, item) => sum + getDealItemPrice(item, selectedDeal.deal_type),
                0
            );

            if (selectedDeal.discount_type === "percentage") {
                return baseTotal * (1 - (selectedDeal.discount_value || 0) / 100);
            } else if (selectedDeal.discount_type === "fixed_amount") {
                return Math.max(0, baseTotal - (selectedDeal.discount_value || 0));
            }
            return baseTotal;
        }

        return 0;
    };

    useEffect(() => {
        setDealTotal(calculateDealPrice());
    }, [selectedItems, selectedDeal]);

    const handleAddToCart = () => {
        if (!selectedDeal) {
            toast.error("Please select a deal first");
            return;
        }

        // Validate slot-based deal selections
        if (selectedDeal.deal_type === "slot_based") {
            const slotValidations = selectedDeal.slots.map((slot) => {
                const selectedCount = (selectedItems[slot.id] || []).length;
                if (selectedCount < slot.min_selection) {
                    return `Slot "${slot.name}" requires at least ${slot.min_selection} items`;
                }
                return null;
            });

            const errors = slotValidations.filter((e) => e !== null);
            if (errors.length > 0) {
                toast.error(errors[0]);
                return;
            }
        }

        // Validate that non-slot deals contain at least one selected item
        if (selectedDeal.deal_type !== "fixed_price") {
            const itemCount = Object.keys(selectedItems).filter(
                (id) => selectedItems[id]
            ).length;
            if (itemCount === 0) {
                toast.error("Please select at least one product");
                return;
            }
        }

        onAddToCart({
            deal: selectedDeal,
            selectedItems,
            totalPrice: dealTotal,
        });

        handleClose();
    };

    const handleClose = () => {
        setSelectedDeal(null);
        setSelectedItems({});
        setDealTotal(0);
        setShowCustomCombo(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {showCustomCombo
                            ? "Build Your Own Deal"
                            : selectedDeal ? selectedDeal.name : "Select a Deal"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <IconX size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
                    {showCustomCombo ? (
                        <CustomComboBuilder
                            onBack={() => setShowCustomCombo(false)}
                            submitting={customComboSubmitting}
                            onSubmit={onCustomComboSubmit}
                        />
                    ) : loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-slate-500">Loading deals...</div>
                        </div>
                    ) : loadError ? (
                        <div>
                            <div className="mb-5 flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-900 dark:bg-rose-950/20">
                                <p className="text-slate-600 dark:text-slate-300">
                                    Unable to load predefined deals. You can retry or build a combo from available products.
                                </p>
                                <button
                                    type="button"
                                    onClick={fetchDeals}
                                    className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
                                >
                                    Retry
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCustomCombo(true)}
                                className="w-full rounded-xl border-2 border-dashed border-primary-400 p-5 text-left text-primary-700 transition-colors hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-950/30"
                            >
                                <span className="text-lg font-semibold">+ Build Your Own Deal</span>
                                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">Choose available products and add them to the cart at their current prices.</span>
                            </button>
                        </div>
                    ) : !selectedDeal ? (
                        // Deal Selection View
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowCustomCombo(true)}
                                className="mb-5 w-full rounded-xl border-2 border-dashed border-primary-400 p-5 text-left text-primary-700 transition-colors hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-950/30"
                            >
                                <span className="text-lg font-semibold">+ Build Your Own Deal</span>
                                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">Choose available products and add them to the cart at their current prices.</span>
                            </button>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {deals.map((deal) => (
                                    <div
                                        key={deal.id}
                                        onClick={() => handleSelectDeal(deal)}
                                        className="cursor-pointer rounded-xl border-2 border-slate-200 p-4 transition-all hover:border-primary-500 hover:shadow-lg dark:border-slate-700 dark:hover:border-primary-500"
                                    >
                                        <div className="mb-2 flex items-start justify-between">
                                            <h3 className="font-semibold text-slate-800 dark:text-white">
                                                {deal.name}
                                            </h3>
                                            {deal.is_active ? (
                                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="mb-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                                            {deal.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium capitalize text-slate-600 dark:text-slate-400">
                                                {deal.deal_type.replace(/_/g, " ")}
                                            </span>
                                            {deal.deal_type === "fixed_price" && (
                                                <span className="text-lg font-bold text-primary-600">
                                                    {formatPrice(deal.fixed_price)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {deals.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-slate-500">
                                        No deals available
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Deal Customization View
                        <div>
                            {/* Deal Information */}
                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
                                    {selectedDeal.name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    {selectedDeal.description}
                                </p>
                                {selectedDeal.deal_type === "fixed_price" && (
                                    <div className="text-2xl font-bold text-primary-600">
                                        {formatPrice(selectedDeal.fixed_price)}
                                    </div>
                                )}
                            </div>

                            {/* Product Selection */}
                            {selectedDeal.deal_type === "slot_based" ? (
                                // Slot-based selection
                                <div className="space-y-6">
                                    {selectedDeal.slots?.map((slot) => (
                                        <div key={slot.id}>
                                            <h4 className="font-medium text-slate-800 dark:text-white mb-3">
                                                {slot.name}{" "}
                                                <span className="text-sm font-normal text-slate-500">
                                                    (Select {slot.min_selection}-{slot.max_selection} items)
                                                </span>
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {selectedDeal.items
                                                    .filter(
                                                        (item) =>
                                                            item.restaurant_deal_slot_id === slot.id
                                                    )
                                                    .map((item) => {
                                                        const isSelected = (
                                                            selectedItems[slot.id] || []
                                                        ).includes(item.product_id);
                                                        return (
                                                            <button
                                                                key={item.product_id}
                                                                onClick={() =>
                                                                    handleItemSelection(
                                                                        item.product_id,
                                                                        slot.id
                                                                    )
                                                                }
                                                                className={`p-3 rounded-lg border-2 transition-all ${
                                                                    isSelected
                                                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                                                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                                                }`}
                                                            >
                                                                <div className="text-sm font-medium text-slate-800 dark:text-white">
                                                                    {item.product?.title}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {formatPrice(
                                                                        getDealItemPrice(
                                                                            item,
                                                                            selectedDeal.deal_type
                                                                        )
                                                                    )}
                                                                </div>
                                                                {item.selected_variation_id && (
                                                                    <div className="mt-1 text-xs text-slate-500">
                                                                        {formatVariationName(item.selected_variation_id)}
                                                                        {" · "}
                                                                        Inventory shared across variations
                                                                    </div>
                                                                )}
                                                                {isSelected && (
                                                                    <div className="mt-2 flex justify-center">
                                                                        <IconCheck
                                                                            size={20}
                                                                            className="text-primary-600"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Regular product selection
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {selectedDeal.items?.map((item) => {
                                        const isSelected = selectedItems[item.product_id];
                                        const displayPrice = getDealItemPrice(
                                            item,
                                            selectedDeal.deal_type
                                        );
                                        
                                        return (
                                            <button
                                                key={item.product_id}
                                                onClick={() =>
                                                    handleItemSelection(item.product_id)
                                                }
                                                className={`p-3 rounded-lg border-2 transition-all ${
                                                    isSelected
                                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="text-sm font-medium text-slate-800 dark:text-white">
                                                    {item.product?.title || "Unknown Product"}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {formatPrice(displayPrice)}
                                                </div>
                                                {item.selected_variation_id && (
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {formatVariationName(item.selected_variation_id)}
                                                        {" · "}
                                                        Inventory shared across variations
                                                    </div>
                                                )}
                                                {isSelected && (
                                                    <div className="mt-2 flex justify-center">
                                                        <IconCheck
                                                            size={20}
                                                            className="text-primary-600"
                                                        />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Dynamic Price Display */}
                            {(selectedDeal.deal_type === "dynamic_price" || selectedDeal.deal_type === "custom") && (
                                <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Total Deal Price
                                        </span>
                                        <span className="text-2xl font-bold text-primary-600">
                                            {formatPrice(dealTotal)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {selectedDeal && (
                    <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setSelectedDeal(null)}
                            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleAddToCart}
                            className="px-6 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                        >
                            <IconPlus size={20} />
                            Add to Cart
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}