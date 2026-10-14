import React, { useState } from "react";
import { useForm, useFieldArray } from "@inertiajs/react";
import {
    IconPlus,
    IconTrash,
    IconArrowUp,
    IconArrowDown,
} from "@tabler/icons-react";

const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(value);
};

const parseCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
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
                  discount_type: "fixed_price",
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

    const {
        fields: itemFields,
        append: appendItem,
        remove: removeItem,
        move: moveItem,
    } = useFieldArray("items", { keyName: "id" });

    const {
        fields: slotFields,
        append: appendSlot,
        remove: removeSlot,
        move: moveSlot,
    } = useFieldArray("slots", { keyName: "id" });

    const handleSubmit = (e) => {
        e.preventDefault();

        const submitData = {
            ...data,
            discount_value: parseCurrency(data.discount_value),
            fixed_price: data.fixed_price ? parseCurrency(data.fixed_price) : null,
            max_per_customer: data.max_per_customer ? parseInt(data.max_per_customer) : null,
            min_products: data.min_products ? parseInt(data.min_products) : null,
            max_products: data.max_products ? parseInt(data.max_products) : null,
            items: data.items.map((item) => ({
                ...item,
                min_qty: parseInt(item.min_qty) || 1,
                max_qty: parseInt(item.max_qty) || 1,
                sort_order: item.sort_order || 0,
            })),
            slots: data.slots.map((slot) => ({
                ...slot,
                min_selection: parseInt(slot.min_selection) || 1,
                max_selection: parseInt(slot.max_selection) || 1,
                sort_order: slot.sort_order || 0,
            })),
        };

        if (isEditing) {
            put(route("restaurant-deals.update", deal.id), submitData);
        } else {
            post(route("restaurant-deals.store"), submitData);
        }
    };

    const addItem = () => {
        appendItem({
            product_id: "",
            restaurant_deal_slot_id: "",
            is_required: true,
            min_qty: 1,
            max_qty: 1,
            sort_order: itemFields.length,
        });
    };

    const addSlot = () => {
        appendSlot({
            name: "",
            description: "",
            min_selection: 1,
            max_selection: 1,
            sort_order: slotFields.length,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                <h3 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">
                    Informasi Dasar
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nama Deal *
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            placeholder="Contoh: Paket Makan Siang"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-rose-600">{errors.name}</p>
                        )}
                    </div>
                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Deskripsi
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            placeholder="Deskripsi deal..."
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Tipe Deal *
                        </label>
                        <select
                            value={data.deal_type}
                            onChange={(e) => setData("deal_type", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="fixed_price">Harga Tetap</option>
                            <option value="dynamic_price">Harga Dinamis</option>
                            <option value="slot_based">Berdasarkan Slot</option>
                            <option value="custom">Kustom</option>
                        </select>
                        {errors.deal_type && (
                            <p className="mt-1 text-sm text-rose-600">{errors.deal_type}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Tipe Diskon *
                        </label>
                        <select
                            value={data.discount_type}
                            onChange={(e) => setData("discount_type", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="percentage">Persentase (%)</option>
                            <option value="fixed_amount">Nominal Tetap</option>
                            <option value="fixed_price">Harga Tetap</option>
                        </select>
                        {errors.discount_type && (
                            <p className="mt-1 text-sm text-rose-600">{errors.discount_type}</p>
                        )}
                    </div>
                    {data.deal_type === "fixed_price" ||
                    data.discount_type === "fixed_price" ? (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Harga Tetap *
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
                                Nilai Diskon *
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
                            <option value="">Global (Semua Outlet)</option>
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
                            Mulai
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
                            Berakhir
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
                            Min Produk
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
                            Max Produk
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
                            Aktif
                        </label>
                    </div>
                </div>
            </div>

            {/* Slots (for slot-based deals) */}
            {data.deal_type === "slot_based" && (
                <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                            Slot
                        </h3>
                        <button
                            type="button"
                            onClick={addSlot}
                            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
                        >
                            <IconPlus size={16} />
                            Tambah Slot
                        </button>
                    </div>
                    {slotFields.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Belum ada slot. Klik "Tambah Slot" untuk membuat slot.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {slotFields.map((slot, index) => (
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
                                                disabled={index === slotFields.length - 1}
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
                                                Nama Slot *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.slots[index]?.name || ""}
                                                onChange={(e) =>
                                                    setData(
                                                        `slots.${index}.name`,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                placeholder="Contoh: Main Dish"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Min Selection *
                                            </label>
                                            <input
                                                type="number"
                                                value={data.slots[index]?.min_selection || 1}
                                                onChange={(e) =>
                                                    setData(
                                                        `slots.${index}.min_selection`,
                                                        parseInt(e.target.value) || 1
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Max Selection *
                                            </label>
                                            <input
                                                type="number"
                                                value={data.slots[index]?.max_selection || 1}
                                                onChange={(e) =>
                                                    setData(
                                                        `slots.${index}.max_selection`,
                                                        parseInt(e.target.value) || 1
                                                    )
                                                }
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
                        Produk
                    </h3>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
                    >
                        <IconPlus size={16} />
                        Tambah Produk
                    </button>
                </div>
                {itemFields.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Belum ada produk. Klik "Tambah Produk" untuk menambahkan produk.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {itemFields.map((item, index) => (
                            <div
                                key={item.id}
                                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                        Produk {index + 1}
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
                                            disabled={index === itemFields.length - 1}
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
                                            Produk *
                                        </label>
                                        <select
                                            value={data.items[index]?.product_id || ""}
                                            onChange={(e) =>
                                                setData(
                                                    `items.${index}.product_id`,
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Pilih Produk</option>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.title} -{" "}
                                                    {formatCurrency(product.sell_price)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {data.deal_type === "slot_based" && (
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Slot
                                            </label>
                                            <select
                                                value={data.items[index]?.restaurant_deal_slot_id || ""}
                                                onChange={(e) =>
                                                    setData(
                                                        `items.${index}.restaurant_deal_slot_id`,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            >
                                                <option value="">Pilih Slot</option>
                                                {slotFields.map((slot, slotIndex) => (
                                                    <option key={slot.id} value={slot.id}>
                                                        Slot {slotIndex + 1} -{" "}
                                                        {data.slots[slotIndex]?.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Min Qty
                                        </label>
                                        <input
                                            type="number"
                                            value={data.items[index]?.min_qty || 1}
                                            onChange={(e) =>
                                                setData(
                                                    `items.${index}.min_qty`,
                                                    parseInt(e.target.value) || 1
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Max Qty
                                        </label>
                                        <input
                                            type="number"
                                            value={data.items[index]?.max_qty || 1}
                                            onChange={(e) =>
                                                setData(
                                                    `items.${index}.max_qty`,
                                                    parseInt(e.target.value) || 1
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            min="1"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`required-${index}`}
                                            checked={data.items[index]?.is_required || false}
                                            onChange={(e) =>
                                                setData(
                                                    `items.${index}.is_required`,
                                                    e.target.checked
                                                )
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label
                                            htmlFor={`required-${index}`}
                                            className="text-sm text-slate-700 dark:text-slate-300"
                                        >
                                            Wajib
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                >
                    {processing ? "Menyimpan..." : isEditing ? "Update" : "Simpan"}
                </button>
            </div>
        </form>
    );
}
