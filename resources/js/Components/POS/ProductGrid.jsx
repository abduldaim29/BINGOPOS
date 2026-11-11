import React from "react";
import {
    IconShoppingBag,
    IconPhoto,
    IconPlus,
    IconSparkles,
    IconTag,
    IconX,
    IconArrowsSort,
} from "@tabler/icons-react";
import { getProductImageUrl } from "@/Utils/imageUrl";
import { formatCurrency } from "@/Utils/currency";

function LazyProductImage({ image, title }) {
    const imageRef = React.useRef(null);
    const [shouldLoad, setShouldLoad] = React.useState(false);

    React.useEffect(() => {
        const element = imageRef.current;
        if (!element) return undefined;

        if (!("IntersectionObserver" in window)) {
            setShouldLoad(true);
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "160px" }
        );
        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return (
        <img
            ref={imageRef}
            src={shouldLoad ? getProductImageUrl(image, { thumbnail: true }) : undefined}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
        />
    );
}

// Single Product Card - Unique Modern Design
const ProductCard = React.memo(function ProductCard({ product, onAddToCart, isAdding }) {
    const isLiveCooking = Boolean(product.is_live_cooking);
    const hasStock = isLiveCooking || product.stock > 0;
    const lowStock = !isLiveCooking && product.stock > 0 && product.stock <= 5;
    const promoBadge = product.pricing_badge;
    const promoPrice = Number(promoBadge?.promo_price || 0);
    const basePrice = Number(promoBadge?.base_price || product.sell_price || 0);
    const showPromo = promoBadge && promoPrice > 0 && promoPrice < basePrice;
    const showBadge = Boolean(promoBadge?.label);
    const multiUnits = (product.units || []).filter(
        (u) => !u.is_base
    );
    const [selectedUnitId, setSelectedUnitId] = React.useState(null);
    const selectedUnit =
        multiUnits.find((u) => u.unit_id === selectedUnitId) || null;

    // Variation support
    const hasVariations = product.variations && product.variations.length > 0;
    const [selectedVariationId, setSelectedVariationId] = React.useState(null);
    const selectedVariationPrice = hasVariations && selectedVariationId
        ? Number(product.variation_prices?.[selectedVariationId] || 0)
        : 0;

    const displayPrice = selectedVariationPrice > 0
        ? selectedVariationPrice
        : selectedUnit
          ? selectedUnit.sell_price
          : showPromo
            ? promoPrice
            : product.sell_price;
    const handleAddToCart = () => {
        if (!hasStock || isAdding) return;
        const variationName = selectedVariationId
            ? selectedVariationId.replace(/^[a-z]+_/, "").replace(/_/g, " ")
            : null;

        onAddToCart(product, selectedUnit, selectedVariationId, variationName);
    };

    return (
        <div
            className={`
                group relative flex flex-col
                bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950
                rounded-2xl border border-slate-200/70 dark:border-slate-700/70
                overflow-hidden transition-all duration-300 ease-out
                ${
                    hasStock
                        ? "hover:border-primary-400/70 dark:hover:border-primary-600/70 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 active:scale-[0.97]"
                        : "opacity-50 grayscale"
                }
            `}
        >
            {/* Gradient Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Product Image Container */}
            <button
                type="button"
                onClick={handleAddToCart}
                disabled={!hasStock || isAdding}
                className={`relative block text-left overflow-hidden ${
                    hasStock ? "cursor-pointer" : "cursor-not-allowed"
                }`}
            >
                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                    {product.image ? (
                        <LazyProductImage
                            image={product.image}
                            title={product.title}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                                <IconPhoto
                                    size={32}
                                    className="text-slate-400 dark:text-slate-600"
                                />
                            </div>
                        </div>
                    )}
                    {/* Promotional Gradient Overlay */}
                    {showPromo && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 via-transparent to-amber-500/20" />
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
                        {showBadge && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-rose-500/30">
                                <IconSparkles size={10} />
                                {promoBadge.label}
                            </span>
                        )}
                        {isLiveCooking && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-emerald-500/30">
                                Made to order
                            </span>
                        )}
                        {lowStock && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-amber-500/30">
                                {product.stock} left
                            </span>
                        )}
                    </div>

                    {/* Out of Stock Overlay */}
                    {!hasStock && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-danger-500/20 flex items-center justify-center mx-auto mb-2">
                                    <IconTag size={20} className="text-danger-500" />
                                </div>
                                <span className="px-4 py-2 bg-danger-500 text-white text-xs font-bold rounded-full shadow-lg shadow-danger-500/30">
                                    Out of Stock
                                </span>
                            </div>
                        </div>
                    )}

                </div>
            </button>

            {/* Product Info */}
            <div className="relative p-3 flex flex-col gap-2">
                {/* Decorative Line */}
                <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                {/* Title */}
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug min-h-[2.5rem]">
                    {product.title}
                </h3>

                {/* Price Section */}
                <div className="flex items-end justify-between gap-2">
                    <div className="flex-1">
                        {showPromo && !selectedUnit && (
                            <p className="text-xs text-slate-400 line-through mb-0.5">
                                {formatCurrency(basePrice)}
                            </p>
                        )}
                        <div className="flex items-baseline gap-1">
                            <p className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                                {formatCurrency(displayPrice)}
                            </p>
                            {selectedUnit && (
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    /{selectedUnit.code}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stock Indicator */}
                    {hasStock && !isLiveCooking && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                            selectedVariationId
                                ? "bg-accent-50 dark:bg-accent-950/30"
                                : "bg-emerald-50 dark:bg-emerald-950/30"
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                selectedVariationId
                                    ? "bg-accent-500"
                                    : "bg-emerald-500"
                            }`} />
                            <span className={`text-[10px] font-semibold ${
                                selectedVariationId
                                    ? "text-accent-600 dark:text-accent-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                            }`}>
                                {product.stock}
                            </span>
                        </div>
                    )}
                </div>

                {/* Unit Selection */}
                {multiUnits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => setSelectedUnitId(null)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border-2 transition-all duration-200 ${
                                selectedUnit === null
                                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-md shadow-primary-500/20"
                                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                        >
                            Base
                        </button>
                        {multiUnits.map((u) => (
                            <button
                                key={u.unit_id}
                                type="button"
                                onClick={() => setSelectedUnitId(u.unit_id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border-2 transition-all duration-200 ${
                                    selectedUnitId === u.unit_id
                                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-md shadow-primary-500/20"
                                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                            >
                                {u.code}
                            </button>
                        ))}
                    </div>
                )}

                {/* Variation Selection */}
                {hasVariations && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {product.variations.map((variationId) => {
                            // Extract variation name from ID (e.g., "pizza_small" -> "Small")
                            const variationName = variationId.replace(/^[a-z]+_/, '').replace(/_/g, ' ');
                            const variationPrice = product.variation_prices?.[variationId] || 0;
                            const isSelected = selectedVariationId === variationId;

                            return (
                                <button
                                    key={variationId}
                                    type="button"
                                    onClick={() => setSelectedVariationId(isSelected ? null : variationId)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border-2 transition-all duration-200 ${
                                        isSelected
                                            ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white border-accent-500 shadow-md shadow-accent-500/20"
                                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-accent-300 dark:hover:border-accent-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    {variationName}
                                </button>
                            );
                        })}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!hasStock || isAdding}
                    className="mt-1 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-2 text-sm font-bold text-white shadow-md shadow-primary-500/20 transition hover:from-primary-600 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <IconPlus size={16} />
                    <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
                </button>
            </div>
        </div>
    );
});

// Category Tab Button - Modern Pill Design
function CategoryTab({ category, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                relative px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap
                transition-all duration-300 min-h-touch
                ${
                    isActive
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 border-2 border-primary-500"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700"
                }
            `}
        >
            {category.name}
            {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-400/20 to-accent-400/20 animate-pulse" />
            )}
        </button>
    );
}

// Search Input - Modern Glassmorphism Design
function SearchInput({
    value,
    onChange,
    onSearch,
    isSearching,
    placeholder,
    inputRef,
}) {
    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-xl opacity-50" />
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
                placeholder={
                    placeholder ||
                    "Search products or scan barcode... (/ to focus)"
                }
                className="relative w-full h-12 pl-4 pr-12 rounded-2xl border-2 border-slate-200/70 dark:border-slate-700/70
                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
                    text-slate-800 dark:text-slate-200
                    placeholder-slate-400 dark:placeholder-slate-500
                    focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500
                    focus:bg-white dark:focus:bg-slate-900
                    transition-all duration-300 text-sm font-medium shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
                disabled={isSearching}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearching ? (
                    <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                ) : value ? (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        aria-label="Clear product search"
                        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        <IconX size={18} />
                    </button>
                ) : (
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/30">
                        <IconShoppingBag size={18} className="text-white" />
                    </div>
                )}
            </div>
        </div>
    );
}

// Main ProductGrid Component - Unique Layout Design
export default function ProductGrid({
    products = [],
    categories = [],
    selectedCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    onSearch,
    isSearching,
    onAddToCart,
    addingProductId,
    searchInputRef,
}) {
    const [sortBy, setSortBy] = React.useState("recommended");
    const [visibleCount, setVisibleCount] = React.useState(48);
    const deferredSearchQuery = React.useDeferredValue(searchQuery);
    const normalizedSelectedCategory =
        selectedCategory === null ? null : Number(selectedCategory);

    const filteredProducts = React.useMemo(() => {
        const normalizedSearch = deferredSearchQuery.trim().toLowerCase();
        const filtered = products.filter((product) => {
            const matchesCategory =
                normalizedSelectedCategory === null ||
                Number(product.category_id) === normalizedSelectedCategory;
            const matchesSearch =
                !normalizedSearch ||
                product.title.toLowerCase().includes(normalizedSearch) ||
                product.barcode?.toLowerCase().includes(normalizedSearch);
            return matchesCategory && matchesSearch;
        });

        if (sortBy === "name") {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === "price-low") {
            filtered.sort(
                (a, b) => Number(a.sell_price || 0) - Number(b.sell_price || 0)
            );
        } else if (sortBy === "price-high") {
            filtered.sort(
                (a, b) => Number(b.sell_price || 0) - Number(a.sell_price || 0)
            );
        } else if (sortBy === "stock") {
            filtered.sort(
                (a, b) => Number(b.stock || 0) - Number(a.stock || 0)
            );
        }

        return filtered;
    }, [products, normalizedSelectedCategory, deferredSearchQuery, sortBy]);

    React.useEffect(() => {
        setVisibleCount(48);
    }, [normalizedSelectedCategory, deferredSearchQuery, sortBy]);

    const visibleProducts = filteredProducts.slice(0, visibleCount);

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Search Bar - Glassmorphism Header */}
            <div
                data-tour="pos-search"
                className="relative p-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-accent-500/5" />
                <div className="relative">
                    <SearchInput
                        value={searchQuery}
                        onChange={onSearchChange}
                        onSearch={onSearch}
                        isSearching={isSearching}
                        placeholder="Search products or scan barcode... (press / to focus)"
                        inputRef={searchInputRef}
                    />
                </div>
            </div>

            {/* Category Tabs - Floating Pill Design */}
            <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                    <CategoryTab
                        category={{ id: null, name: "All" }}
                        isActive={normalizedSelectedCategory === null}
                        onClick={() => onCategoryChange(null)}
                    />
                    {categories.map((category) => (
                        <CategoryTab
                            key={category.id}
                            category={category}
                            isActive={
                                normalizedSelectedCategory ===
                                Number(category.id)
                            }
                            onClick={() => onCategoryChange(Number(category.id))}
                        />
                    ))}
                </div>
            </div>

            {/* Products Grid - Modern Masonry-style Layout */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400" aria-live="polite">
                        {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
                        {filteredProducts.length !== products.length && ` found from ${products.length}`}
                    </p>
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <IconArrowsSort size={16} aria-hidden="true" />
                        <span className="sr-only">Sort products</span>
                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value)}
                            aria-label="Sort products"
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="recommended">Recommended</option>
                            <option value="name">Name: A to Z</option>
                            <option value="price-low">Price: Low to high</option>
                            <option value="price-high">Price: High to low</option>
                            <option value="stock">Stock: High to low</option>
                        </select>
                    </label>
                </div>
                {filteredProducts.length > 0 ? (
                    <div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {visibleProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    isAdding={addingProductId === product.id}
                                />
                            ))}
                        </div>
                        {visibleCount < filteredProducts.length && (
                            <div className="flex justify-center py-5">
                                <button
                                    type="button"
                                    onClick={() => setVisibleCount((count) => count + 48)}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Show more products ({filteredProducts.length - visibleCount} remaining)
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full blur-2xl" />
                            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                <IconShoppingBag
                                    size={40}
                                    strokeWidth={1.5}
                                    className="text-slate-400 dark:text-slate-600"
                                />
                            </div>
                        </div>
                        <p className="mt-4 text-sm font-medium">
                            {searchQuery
                                ? "No products found"
                                : "No products available"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Try adjusting your search or filters
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Export sub-components
ProductGrid.Card = ProductCard;
ProductGrid.CategoryTab = CategoryTab;
ProductGrid.SearchInput = SearchInput;