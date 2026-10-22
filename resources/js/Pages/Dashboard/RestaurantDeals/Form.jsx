import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    IconPlus,
    IconTrash,
    IconArrowUp,
    IconArrowDown,
} from "@tabler/icons-react";

const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("en-US").format(value);
};

const parseCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(value.replace(/,/g, "").replace(".", ".")) || 0;
};

export default function Form({ deal, outlets, products, activeOutlet }) {
    const isEditing = !!deal;

    const { data, setData, post, put, processing, errors } = useForm(
        isEditing
            ? {
                  ...deal,
                  items: deal.items?.map((item) => ({
                      ...item,
                      _destroy: false,
                      deal_variation_prices: item.deal_variation_prices || {},
                  })) || [],
                  slots: deal.slots?.map((slot) => ({
                      ...slot,
                      _destroy: false,
                  })) || [],
              }
            : {
                  name: "",
                  description: "",
                  deal_type: "fixed_price",
                  discount_type: "",
                  discount_value: "",
                  fixed_price: "",
                  is_active: true,
                  priority: 0,
                  outlet_id: activeOutlet?.id || "",
                  starts_at: "",
                  ends_at: "",
                  max_per_customer: "",
                  min_products: "",
                  max_products: "",
                  items: [],
                  slots: [],
              }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting deal data:", data);

        const submitData = {
            ...data,
            is_active: Boolean(data.is_active),
            discount_type: data.deal_type === 'fixed_price' ? 'fixed_price' : (data.discount_type && data.discount_type !== '' ? data.discount_type : null),
            discount_value: data.discount_value ? parseCurrency(data.discount_value) : 0,
            fixed_price: data.fixed_price ? parseCurrency(data.fixed_price) : null,
            max_per_customer: data.max_per_customer ? parseInt(data.max_per_customer) : null,
            min_products: data.min_products ? parseInt(data.min_products) : null,
            max_products: data.max_products ? parseInt(data.max_products) : null,
            items: data.items.map((item) => ({
                ...item,
                min_qty: parseInt(item.min_qty) || 1,
                max_qty: parseInt(item.max_qty) || 1,
                sort_order: item.sort_order || 0,
                is_required: Boolean(item.is_required),
                deal_price: item.deal_price ? parseCurrency(item.deal_price) : null,
                deal_variation_prices: item.deal_variation_prices || {},
            })),
            slots: data.slots.map((slot) => ({
                ...slot,
                min_selection: parseInt(slot.min_selection) || 1,
                max_selection: parseInt(slot.max_selection) || 1,
                sort_order: slot.sort_order || 0,
            })),
        };

        console.log("Final submit data:", submitData);

        if (isEditing) {
            put(route("restaurant-deals.update", deal.id), submitData, {
                onSuccess: () => {
                    console.log("Deal updated successfully");
                },
                onError: (errors) => {
                    console.error("Update failed:", errors);
                    alert("Update failed: " + JSON.stringify(errors, null, 2));
                },
            });
        } else {
            post(route("restaurant-deals.store"), submitData, {
                onSuccess: () => {
                    console.log("Deal created successfully");
                },
                onError: (errors) => {
                    console.error("Creation failed:", errors);
                    // Show detailed error message
                    const errorMessage = Object.entries(errors)
                        .map(([field, message]) => `${field}: ${message}`)
                        .join('\n');
                    alert("Failed to create deal:\n" + errorMessage);
                },
            });
        }
    };

    const addItem = () => {
        setData("items", [
            ...data.items,
            {
                id: Date.now(),
                product_id: "",
                restaurant_deal_slot_id: "",
                is_required: true,
                min_qty: 1,
                max_qty: 1,
                sort_order: data.items.length,
                deal_price: "",
                deal_variation_prices: {},
            },
        ]);
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData("items", newItems);
    };

    const moveItem = (fromIndex, toIndex) => {
        const newItems = [...data.items];
        const [movedItem] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, movedItem);
        setData("items", newItems.map((item, i) => ({ ...item, sort_order: i })));
    };

    const addSlot = () => {
        setData("slots", [
            ...data.slots,
            {
                id: Date.now(),
                name: "",
                description: "",
                min_selection: 1,
                max_selection: 1,
                sort_order: data.slots.length,
            },
        ]);
    };

    const removeSlot = (index) => {
        const newSlots = data.slots.filter((_, i) => i !== index);
        setData("slots", newSlots);
    };

    const moveSlot = (fromIndex, toIndex) => {
        const newSlots = [...data.slots];
        const [movedSlot] = newSlots.splice(fromIndex, 1);
        newSlots.splice(toIndex, 0, movedSlot);
        setData("slots", newSlots.map((slot, i) => ({ ...slot, sort_order: i })));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                <h3 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Deal Name *
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            placeholder="Example: Lunch Meal Package"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-rose-600">{errors.name}</p>
                        )}
                    </div>
                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Description
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            placeholder="Deal description..."
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Deal Type *
                        </label>
                        <select
                            value={data.deal_type}
                            onChange={(e) => setData("deal_type", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="fixed_price">Fixed Price</option>
                            <option value="dynamic_price">Dynamic Price</option>
                            <option value="slot_based">Slot-Based</option>
                            <option value="custom">Custom</option>
                        </select>
                        {errors.deal_type && (
                            <p className="mt-1 text-sm text-rose-600">{errors.deal_type}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Discount Type
                        </label>
                        <select
                            value={data.discount_type}
                            onChange={(e) => setData("discount_type", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="">None</option>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed_amount">Fixed Amount</option>
                            <option value="fixed_price">Fixed Price</option>
                        </select>
                        {errors.discount_type && (
                            <p className="mt-1 text-sm text-rose-600">{errors.discount_type}</p>
                        )}
                    </div>
                    {data.deal_type === "fixed_price" ||
                    data.discount_type === "fixed_price" ? (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Fixed Price *
                            </label>
                            <input
                                type="text"
                                value={formatCurrency(data.fixed_price)}
                                onChange={(e) => setData("fixed_price", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                placeholder="0"
                            />
                            {errors.fixed_price && (
                                <p className="mt-1 text-sm text-rose-600">{errors.fixed_price}</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Discount Value *
                            </label>
                            <input
                                type="text"
                                value={formatCurrency(data.discount_value)}
                                onChange={(e) => setData("discount_value", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                placeholder="0"
                            />
                            {errors.discount_value && (
                                <p className="mt-1 text-sm text-rose-600">{errors.discount_value}</p>
                            )}
                        </div>
                    )}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Outlet
                        </label>
                        <select
                            value={data.outlet_id}
                            onChange={(e) => setData("outlet_id", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="">Global (All Outlets)</option>
                            {outlets.map((outlet) => (
                                <option key={outlet.id} value={outlet.id}>
                                    {outlet.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Priority
                        </label>
                        <input
                            type="number"
                            value={data.priority}
                            onChange={(e) => setData("priority", parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Starts At
                        </label>
                        <input
                            type="datetime-local"
                            value={data.starts_at}
                            onChange={(e) => setData("starts_at", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Ends At
                        </label>
                        <input
                            type="datetime-local"
                            value={data.ends_at}
                            onChange={(e) => setData("ends_at", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Max per Customer
                        </label>
                        <input
                            type="number"
                            value={data.max_per_customer}
                            onChange={(e) => setData("max_per_customer", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            min="1"
                            placeholder="Unlimited"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Minimum Products
                        </label>
                        <input
                            type="number"
                            value={data.min_products}
                            onChange={(e) => setData("min_products", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            min="1"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Maximum Products
                        </label>
                        <input
                            type="number"
                            value={data.max_products}
                            onChange={(e) => setData("max_products", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            min="1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={data.is_active}
                            onChange={(e) => setData("is_active", e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label
                            htmlFor="is_active"
                            className="text-sm text-slate-700 dark:text-slate-300"
                        >
                            Active
                        </label>
                    </div>
                </div>
            </div>

            {/* Slots (for slot-based deals) */}
            {data.deal_type === "slot_based" && (
                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                            Slots
                        </h3>
                        <button
                            type="button"
                            onClick={addSlot}
                            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
                        >
                            <IconPlus size={16} />
                            Add Slot
                        </button>
                    </div>
                    {data.slots.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No slots yet. Click "Add Slot" to create a slot.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {data.slots.map((slot, index) => (
                                <div
                                    key={slot.id}
                                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="font-medium text-slate-900 dark:text-white">
                                            Slot {index + 1}
                                        </h4>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => moveSlot(index, index - 1)}
                                                disabled={index === 0}
                                                className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-30 dark:text-slate-400 dark:hover:text-slate-200"
                                            >
                                                <IconArrowUp size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveSlot(index, index + 1)}
                                                disabled={index === data.slots.length - 1}
                                                className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-30 dark:text-slate-400 dark:hover:text-slate-200"
                                            >
                                                <IconArrowDown size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeSlot(index)}
                                                className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                            >
                                                <IconTrash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Slot Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={slot.name || ""}
                                                onChange={(e) => {
                                                    const newSlots = [...data.slots];
                                                    newSlots[index] = { ...newSlots[index], name: e.target.value };
                                                    setData("slots", newSlots);
                                                }}
                                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                placeholder="Example: Main Dish"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Minimum Selection *
                                            </label>
                                            <input
                                                type="number"
                                                value={slot.min_selection || 1}
                                                onChange={(e) => {
                                                    const newSlots = [...data.slots];
                                                    newSlots[index] = { ...newSlots[index], min_selection: parseInt(e.target.value) || 1 };
                                                    setData("slots", newSlots);
                                                }}
                                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Maximum Selection *
                                            </label>
                                            <input
                                                type="number"
                                                value={slot.max_selection || 1}
                                                onChange={(e) => {
                                                    const newSlots = [...data.slots];
                                                    newSlots[index] = { ...newSlots[index], max_selection: parseInt(e.target.value) || 1 };
                                                    setData("slots", newSlots);
                                                }}
                                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Products */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Products
                    </h3>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
                    >
                        <IconPlus size={16} />
                        Add Product
                    </button>
                </div>
                {data.items.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No products yet. Click "Add Product" to add a product.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {data.items.map((item, index) => {
                            const selectedProduct = products.find(
                                (product) => String(product.id) === String(item.product_id)
                            );
                            const variations = Array.isArray(selectedProduct?.variations)
                                ? selectedProduct.variations
                                : [];
                            const selectedVariationPrice =
                                item.deal_variation_prices?.[item.selected_variation_id];
                            const productVariationPrice =
                                selectedProduct?.variation_prices?.[item.selected_variation_id];
                            const variationDisplayPrice =
                                selectedVariationPrice !== undefined
                                && selectedVariationPrice !== null
                                && selectedVariationPrice !== ""
                                    ? selectedVariationPrice
                                    : productVariationPrice || selectedProduct?.sell_price;

                            return (
                            <div
                                key={item.id}
                                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                        Product {index + 1}
                                    </h4>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => moveItem(index, index - 1)}
                                            disabled={index === 0}
                                            className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-30 dark:text-slate-400 dark:hover:text-slate-200"
                                        >
                                            <IconArrowUp size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveItem(index, index + 1)}
                                            disabled={index === data.items.length - 1}
                                            className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-30 dark:text-slate-400 dark:hover:text-slate-200"
                                        >
                                            <IconArrowDown size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                        >
                                            <IconTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Product *
                                        </label>
                                        <select
                                            value={item.product_id || ""}
                                            onChange={(e) => {
                                                const newItems = [...data.items];
                                                newItems[index] = {
                                                    ...newItems[index],
                                                    product_id: e.target.value,
                                                    selected_variation_id: "",
                                                    deal_variation_prices: {},
                                                };
                                                setData("items", newItems);
                                            }}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Select Product</option>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.title} -{" "}
                                                    {formatCurrency(product.sell_price)}
                                                </option>
                                            ))}
                                        </select>
                                        {variations.length > 0 && (
                                            <div className="mt-4">
                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Required Variation *
                                                </label>
                                                <select
                                                    required
                                                    value={item.selected_variation_id || ""}
                                                    onChange={(e) => {
                                                        const newItems = [...data.items];
                                                        newItems[index] = {
                                                            ...newItems[index],
                                                            selected_variation_id: e.target.value,
                                                        };
                                                        setData("items", newItems);
                                                    }}
                                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                >
                                                    <option value="">Select Variation</option>
                                                    {variations.map((variationId) => {
                                                        const variationPrice =
                                                            selectedProduct.variation_prices?.[variationId]
                                                            || selectedProduct.sell_price;

                                                        return (
                                                            <option key={variationId} value={variationId}>
                                                                {String(variationId)
                                                                    .replace(/^[a-z]+_/, "")
                                                                    .replace(/_/g, " ")
                                                                    .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                                                                {" - "}
                                                                {formatCurrency(variationPrice)}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                {item.selected_variation_id && (
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        Price: {formatCurrency(variationDisplayPrice)}{" "}
                                                        · Inventory is shared across this product's variations.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {data.deal_type === "slot_based" && (
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Slot
                                            </label>
                                            <select
                                                value={item.restaurant_deal_slot_id || ""}
                                                onChange={(e) => {
                                                    const newItems = [...data.items];
                                                    newItems[index] = { ...newItems[index], restaurant_deal_slot_id: e.target.value };
                                                    setData("items", newItems);
                                                }}
                                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            >
                                                <option value="">Select Slot</option>
                                                {data.slots.map((slot, slotIndex) => (
                                                    <option key={slot.id} value={slot.id}>
                                                        Slot {slotIndex + 1} -{" "}
                                                        {slot.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {data.deal_type === "custom" && (
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Deal Price *
                                            </label>
                                            <input
                                                type="text"
                                                value={formatCurrency(item.deal_price || "")}
                                                onChange={(e) => {
                                                    const newItems = [...data.items];
                                                    newItems[index] = { ...newItems[index], deal_price: e.target.value };
                                                    setData("items", newItems);
                                                }}
                                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                placeholder="0"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Minimum Quantity
                                        </label>
                                        <input
                                            type="number"
                                            value={item.min_qty || 1}
                                            onChange={(e) => {
                                                const newItems = [...data.items];
                                                newItems[index] = { ...newItems[index], min_qty: parseInt(e.target.value) || 1 };
                                                setData("items", newItems);
                                            }}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Maximum Quantity
                                        </label>
                                        <input
                                            type="number"
                                            value={item.max_qty || 1}
                                            onChange={(e) => {
                                                const newItems = [...data.items];
                                                newItems[index] = { ...newItems[index], max_qty: parseInt(e.target.value) || 1 };
                                                setData("items", newItems);
                                            }}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            min="1"
                                        />
                                    </div>
                                    {data.deal_type === "custom" && (
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Variation Prices (Optional)
                                            </label>
                                            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                    Set specific prices for product variations (e.g., Small, Regular, Large)
                                                </p>
                                                <div className="space-y-2">
                                                    {item.product_id && (() => {
                                                        const product = products.find(p => p.id === parseInt(item.product_id));
                                                        if (!product || !product.variations || product.variations.length === 0) {
                                                            return <p className="text-xs text-slate-400">No variations available for this product</p>;
                                                        }
                                                        return product.variations.map(variationId => {
                                                            // Simplified variation name mapping
                                                            const variationName = variationId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                                                            return (
                                                                <div key={variationId} className="flex items-center gap-2">
                                                                    <span className="text-sm text-slate-600 dark:text-slate-400 w-32">
                                                                        {variationName}
                                                                    </span>
                                                                    <input
                                                                        type="text"
                                                                        value={formatCurrency(item.deal_variation_prices?.[variationId] || "")}
                                                                        onChange={(e) => {
                                                                            const newItems = [...data.items];
                                                                            newItems[index] = {
                                                                                ...newItems[index],
                                                                                deal_variation_prices: {
                                                                                    ...(newItems[index].deal_variation_prices || {}),
                                                                                    [variationId]: e.target.value
                                                                                }
                                                                            };
                                                                            setData("items", newItems);
                                                                        }}
                                                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                                        placeholder="Price"
                                                                    />
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`required-${index}`}
                                            checked={item.is_required || false}
                                            onChange={(e) => {
                                                const newItems = [...data.items];
                                                newItems[index] = { ...newItems[index], is_required: e.target.checked };
                                                setData("items", newItems);
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label
                                            htmlFor={`required-${index}`}
                                            className="text-sm text-slate-700 dark:text-slate-300"
                                        >
                                            Required
                                        </label>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                >
                    {processing ? "Saving..." : isEditing ? "Update" : "Save"}
                </button>
            </div>
        </form>
    );
}