import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    IconPhoto,
    IconPlus,
    IconMinus,
    IconTrash,
    IconSearch,
} from "@tabler/icons-react";
import { getProductImageUrl } from "@/Utils/imageUrl";
import { formatCurrency, useCurrencySettings } from "@/Utils/currency";

const variationLabel = (variation) =>
    String(variation).replace(/^[a-z]+_/, "").replace(/_/g, " ");

const productUnitPrice = (product, variationId, unitId) => {
    if (variationId) {
        const variationPrice = Number(product.variation_prices?.[variationId] || 0);
        return variationPrice > 0 ? variationPrice : Number(product.sell_price || 0);
    }

    const unit = product.units?.find((option) => Number(option.unit_id) === Number(unitId));
    return Number(unit?.sell_price || product.sell_price || 0);
};

export default function CustomComboBuilder({ onBack, onSubmit, submitting = false }) {
    const currency = useCurrencySettings();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [productOptions, setProductOptions] = useState({});
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [productsError, setProductsError] = useState(false);
    const [categoriesError, setCategoriesError] = useState(false);
    const [productRetry, setProductRetry] = useState(0);

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        let active = true;
        axios.get("/api/v1/pos/product-categories")
            .then(({ data }) => {
                if (!Array.isArray(data?.data)) {
                    throw new Error("Unexpected product categories response");
                }
                if (active) setCategories(data.data);
            })
            .catch((error) => {
                if (!active) return;
                setCategoriesError(true);
                if (import.meta.env.DEV) {
                    console.error("Error loading POS product categories:", {
                        status: error.response?.status,
                        message: error.response?.data?.message || error.message,
                    });
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        setProducts([]);
        setPage(1);
        setLastPage(1);
        setLoadingProducts(true);
        setProductsError(false);

        axios.get("/api/v1/pos/products", {
            params: {
                search: search || undefined,
                category_id: categoryId || undefined,
                page: 1,
                per_page: 24,
            },
            signal: controller.signal,
        })
            .then(({ data }) => {
                if (!Array.isArray(data?.data)) {
                    throw new Error("Unexpected POS products response");
                }
                setProducts(data.data);
                setLastPage(Number(data.meta?.last_page || 1));
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setProductsError(true);
                if (import.meta.env.DEV) {
                    console.error("Error loading POS products:", {
                        status: error.response?.status,
                        message: error.response?.data?.message || error.message,
                    });
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingProducts(false);
            });

        return () => controller.abort();
    }, [search, categoryId, productRetry]);

    const subtotal = useMemo(
        () => selectedItems.reduce(
            (sum, item) => sum + productUnitPrice(
                item.product,
                item.variationId,
                item.unitId
            ) * item.quantity,
            0
        ),
        [selectedItems]
    );

    const productConfig = (product) => productOptions[product.id] || {
        variationId: "",
        unitId: product.is_composite
            ? ""
            : (product.units?.find((unit) => unit.is_base)?.unit_id
                || product.units?.[0]?.unit_id
                || ""),
        quantity: 1,
    };

    const updateProductOption = (product, patch) => {
        setProductOptions((current) => ({
            ...current,
            [product.id]: { ...productConfig(product), ...patch },
        }));
    };

    const addProduct = (product) => {
        const config = productConfig(product);
        if (!product.is_composite && product.variations?.length && !config.variationId) {
            toast.error(`Select a variation for ${product.title}`);
            return;
        }

        const unitId = product.is_composite
            ? ""
            : config.variationId
            ? product.units?.find((unit) => unit.is_base)?.unit_id || ""
            : config.unitId;
        const variationId = config.variationId || "";
        const quantity = Math.max(1, Math.min(99, Number(config.quantity) || 1));

        setSelectedItems((current) => {
            const matching = current.find((item) =>
                item.product.id === product.id
                && item.variationId === variationId
                && String(item.unitId) === String(unitId)
            );

            if (matching) {
                return current.map((item) => item.key === matching.key
                    ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
                    : item
                );
            }

            return [...current, {
                key: `${product.id}-${variationId}-${unitId}-${Date.now()}-${Math.random()}`,
                product,
                variationId,
                unitId,
                quantity,
            }];
        });
    };

    const updateSelectedItem = (key, patch) => {
        setSelectedItems((current) => current.map((item) =>
            item.key === key ? { ...item, ...patch } : item
        ));
    };

    const removeSelectedItem = (key) => {
        setSelectedItems((current) => current.filter((item) => item.key !== key));
    };

    const loadMore = async () => {
        if (loadingMore || page >= lastPage) return;
        const nextPage = page + 1;
        setLoadingMore(true);
        try {
            const { data } = await axios.get("/api/v1/pos/products", {
                params: {
                    search: search || undefined,
                    category_id: categoryId || undefined,
                    page: nextPage,
                    per_page: 24,
                },
            });
            if (!Array.isArray(data?.data)) {
                throw new Error("Unexpected POS products response");
            }
            setProducts((current) => [...current, ...data.data]);
            setPage(nextPage);
            setLastPage(Number(data.meta?.last_page || nextPage));
        } catch (error) {
            toast.error("Unable to load more products");
            if (import.meta.env.DEV) {
                console.error("Error loading more POS products:", {
                    status: error.response?.status,
                    message: error.response?.data?.message || error.message,
                });
            }
        } finally {
            setLoadingMore(false);
        }
    };

    const addToCart = () => {
        onSubmit(selectedItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            variation_id: item.variationId || null,
            unit_id: item.variationId ? null : (item.unitId || null),
        })));
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <label className="relative flex-1">
                    <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Search products..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </label>
                <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
            </div>
            {categoriesError && (
                <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">
                    Categories could not be loaded; you can still search all products.
                </p>
            )}

            <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section>
                    {loadingProducts ? (
                        <div className="flex h-48 items-center justify-center text-slate-500">Loading products...</div>
                    ) : productsError ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                            <p className="text-slate-500">Products could not be loaded. Your cart has not changed.</p>
                            <button type="button" onClick={() => setProductRetry((retry) => retry + 1)} className="rounded-lg bg-primary-600 px-4 py-2 text-white">
                                Retry
                            </button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex h-48 items-center justify-center text-slate-500">No available products found.</div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {products.map((product) => {
                                const config = productConfig(product);
                                const unitPrice = productUnitPrice(product, config.variationId, config.unitId);
                                const units = (product.units || []).filter((unit) => !unit.is_base);

                                return (
                                    <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex gap-3 p-3">
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                                                {product.image ? (
                                                    <img src={getProductImageUrl(product.image)} alt={product.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-slate-400"><IconPhoto size={22} /></div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-white">{product.title}</h3>
                                                <p className="truncate text-xs text-slate-500">{product.category?.name || "Uncategorized"}</p>
                                                <p className="mt-1 text-sm font-bold text-primary-600">{formatCurrency(unitPrice, currency)}</p>
                                                <p className="text-xs text-slate-500">{product.stock} available</p>
                                            </div>
                                        </div>
                                        {!product.is_composite && product.variations?.length > 0 && (
                                            <label className="block px-3 pb-2">
                                                <span className="sr-only">Variation for {product.title}</span>
                                                <select
                                                    value={config.variationId}
                                                    onChange={(event) => updateProductOption(product, { variationId: event.target.value })}
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                >
                                                    <option value="">Select variation</option>
                                                    {product.variations.map((variation) => (
                                                        <option key={variation} value={variation}>{variationLabel(variation)}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}
                                        {!product.is_composite && !product.variations?.length && units.length > 0 && (
                                            <label className="block px-3 pb-2">
                                                <span className="sr-only">Unit for {product.title}</span>
                                                <select
                                                    value={config.unitId}
                                                    onChange={(event) => updateProductOption(product, { unitId: event.target.value })}
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                >
                                                    {product.units.map((unit) => (
                                                        <option key={unit.unit_id} value={unit.unit_id}>
                                                            {unit.is_base ? `Base (${unit.name})` : unit.name} · {formatCurrency(unit.sell_price, currency)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}
                                        <div className="flex items-center gap-2 px-3 pb-3">
                                            <label className="sr-only" htmlFor={`combo-qty-${product.id}`}>Quantity for {product.title}</label>
                                            <input
                                                id={`combo-qty-${product.id}`}
                                                type="number"
                                                min="1"
                                                max="99"
                                                value={config.quantity}
                                                onChange={(event) => updateProductOption(product, { quantity: event.target.value })}
                                                className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                            <button type="button" onClick={() => addProduct(product)} disabled={Number(product.stock) <= 0} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
                                                <IconPlus size={16} /> Add
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                    {page < lastPage && !loadingProducts && !productsError && (
                        <button type="button" onClick={loadMore} disabled={loadingMore} className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                            {loadingMore ? "Loading..." : "Load more products"}
                        </button>
                    )}
                </section>

                <aside className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Your custom combo</h3>
                    {selectedItems.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">Add products to build your combo.</p>
                    ) : (
                        <div className="max-h-64 space-y-3 overflow-y-auto">
                            {selectedItems.map((item) => {
                                const variations = item.product.variations || [];
                                const units = item.product.units || [];
                                const unitPrice = productUnitPrice(item.product, item.variationId, item.unitId);
                                return (
                                    <div key={item.key} className="border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{item.product.title}</p>
                                                <p className="text-xs text-slate-500">{formatCurrency(unitPrice, currency)} each</p>
                                            </div>
                                            <button type="button" onClick={() => removeSelectedItem(item.key)} aria-label={`Remove ${item.product.title}`} className="text-rose-500 hover:text-rose-700"><IconTrash size={16} /></button>
                                        </div>
                                        {variations.length > 0 && (
                                            <select value={item.variationId} onChange={(event) => updateSelectedItem(item.key, { variationId: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                                {variations.map((variation) => <option key={variation} value={variation}>{variationLabel(variation)}</option>)}
                                            </select>
                                        )}
                                        {!variations.length && units.length > 1 && (
                                            <select value={item.unitId} onChange={(event) => updateSelectedItem(item.key, { unitId: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                                {units.map((unit) => <option key={unit.unit_id} value={unit.unit_id}>{unit.name} · {formatCurrency(unit.sell_price, currency)}</option>)}
                                            </select>
                                        )}
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => updateSelectedItem(item.key, { quantity: Math.max(1, item.quantity - 1) })} aria-label="Decrease quantity" className="rounded border border-slate-200 p-1 dark:border-slate-700"><IconMinus size={14} /></button>
                                                <span className="min-w-5 text-center text-sm">{item.quantity}</span>
                                                <button type="button" onClick={() => updateSelectedItem(item.key, { quantity: Math.min(99, item.quantity + 1) })} aria-label="Increase quantity" className="rounded border border-slate-200 p-1 dark:border-slate-700"><IconPlus size={14} /></button>
                                            </div>
                                            <span className="text-sm font-semibold">{formatCurrency(unitPrice * item.quantity, currency)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                        <div className="flex items-center justify-between font-semibold">
                            <span>Estimated subtotal</span>
                            <span>{formatCurrency(subtotal, currency)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Final taxes, pricing rules, and discounts are recalculated by POS checkout.</p>
                    </div>
                </aside>
            </div>

            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
                <button type="button" onClick={onBack} disabled={submitting} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    Back to deals
                </button>
                <button type="button" onClick={addToCart} disabled={!selectedItems.length || submitting} className="rounded-lg bg-primary-600 px-5 py-2 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting ? "Adding..." : "Add to Cart"}
                </button>
            </div>
        </div>
    );
}
