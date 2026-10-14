import React, { useState, useEffect } from "react";
import { IconX, IconPlus, IconMinus, IconCheck } from "@tabler/icons-react";
import axios from "axios";
import toast from "react-hot-toast";

const formatPrice = (value = 0) =>
    Number(value || 0).toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    });

export default function DealModal({ isOpen, onClose, onAddToCart, activeOutlet }) {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [dealTotal, setDealTotal] = useState(0);

    // Fetch available deals when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchDeals();
        }
    }, [isOpen, activeOutlet]);

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/v1/pos/restaurant-deals", {
                params: { outlet_id: activeOutlet?.id },
            });
            setDeals(data.data || []);
        } catch (error) {
            toast.error("Gagal memuat deals");
            console.error("Error fetching deals:", error);
        } finally {
            setLoading(false);
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

    const handleItemSelection = (productId, slotId = null) => {
        if (selectedDeal.deal_type === "slot_based") {
            // Slot-based deal selection
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
                        toast.error(`Maksimal ${slot.max_selection} item untuk slot ini`);
                        return prev;
                    }
                }
            });
        } else {
            // Fixed-price or custom deal selection
            setSelectedItems((prev) => {
                const exists = prev[productId];
                if (exists) {
                    const newItems = { ...prev };
                    delete newItems[productId];
                    return newItems;
                } else {
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

        if (selectedDeal.deal_type === "dynamic_price") {
            const itemIds = Object.keys(selectedItems).filter((id) => selectedItems[id]);
            const items = selectedDeal.items.filter((item) =>
                itemIds.includes(String(item.product_id))
            );
            const baseTotal = items.reduce(
                (sum, item) => sum + (item.product?.sell_price || 0),
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
            toast.error("Pilih deal terlebih dahulu");
            return;
        }

        // Validate slot-based deal selections
        if (selectedDeal.deal_type === "slot_based") {
            const slotValidations = selectedDeal.slots.map((slot) => {
                const selectedCount = (selectedItems[slot.id] || []).length;
                if (selectedCount < slot.min_selection) {
                    return `Slot "${slot.name}" minimal ${slot.min_selection} item`;
                }
                return null;
            });

            const errors = slotValidations.filter((e) => e !== null);
            if (errors.length > 0) {
                toast.error(errors[0]);
                return;
            }
        }

        // Validate non-slot deals have at least one item
        if (selectedDeal.deal_type !== "fixed_price") {
            const itemCount = Object.keys(selectedItems).filter(
                (id) => selectedItems[id]
            ).length;
            if (itemCount === 0) {
                toast.error("Pilih minimal satu produk");
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
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {selectedDeal ? selectedDeal.name : "Pilih Deal"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <IconX size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-slate-500">Memuat deals...</div>
                        </div>
                    ) : !selectedDeal ? (
                        // Deal Selection View
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {deals.map((deal) => (
                                <div
                                    key={deal.id}
                                    onClick={() => handleSelectDeal(deal)}
                                    className="cursor-pointer p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-slate-800 dark:text-white">
                                            {deal.name}
                                        </h3>
                                        {deal.is_active ? (
                                            <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                                Non-aktif
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                                        {deal.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
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
                                <div className="col-span-full text-center py-12 text-slate-500">
                                    Tidak ada deal tersedia
                                </div>
                            )}
                        </div>
                    ) : (
                        // Deal Customization View
                        <div>
                            {/* Deal Info */}
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
                                                    (Pilih {slot.min_selection}-{slot.max_selection} item)
                                                </span>
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {selectedDeal.items
                                                    .filter((item) => item.restaurant_deal_slot_id === slot.id)
                                                    .map((item) => {
                                                        const isSelected = (selectedItems[slot.id] || []).includes(
                                                            item.product_id
                                                        );
                                                        return (
                                                            <button
                                                                key={item.product_id}
                                                                onClick={() =>
                                                                    handleItemSelection(item.product_id, slot.id)
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
                                                                    {formatPrice(item.product?.sell_price)}
                                                                </div>
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
                                        return (
                                            <button
                                                key={item.product_id}
                                                onClick={() => handleItemSelection(item.product_id)}
                                                className={`p-3 rounded-lg border-2 transition-all ${
                                                    isSelected
                                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="text-sm font-medium text-slate-800 dark:text-white">
                                                    {item.product?.title || 'Unknown Product'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {formatPrice(item.product?.sell_price || 0)}
                                                </div>
                                                {isSelected && (
                                                    <div className="mt-2 flex justify-center">
                                                        <IconCheck size={20} className="text-primary-600" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Dynamic Price Display */}
                            {selectedDeal.deal_type === "dynamic_price" && (
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
                            Kembali
                        </button>
                        <button
                            onClick={handleAddToCart}
                            className="px-6 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                        >
                            <IconPlus size={20} />
                            Tambah ke Keranjang
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
