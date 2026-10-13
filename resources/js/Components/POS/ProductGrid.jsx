import React from "react";
import {
    IconShoppingBag,
    IconPhoto,
    IconMinus,
    IconPlus,
    IconSparkles,
    IconTag,
} from "@tabler/icons-react";
import { getProductImageUrl } from "@/Utils/imageUrl";
import { formatCurrency } from "@/Utils/currency";

// Single Product Card - Unique Modern Design
function ProductCard({ product, onAddToCart, isAdding }) {
    const hasStock = product.stock > 0;
    const lowStock = product.stock > 0 && product.stock <= 5;
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
    const displayPrice = selectedUnit
        ? selectedUnit.sell_price
        : showPromo
          ? promoPrice
          : product.sell_price;

    return (
        <div
            className={`
                group relative flex flex-col
                bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950
                rounded-3xl border-2 border-slate-200/50 dark:border-slate-700/50
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
                onClick={() => hasStock && onAddToCart(product, selectedUnit)}
                disabled={!hasStock || isAdding}
                className={`relative block text-left overflow-hidden ${
                    hasStock ? "cursor-pointer" : "cursor-not-allowed"
                }`}
            >
                {/* Image */}
                <div className="relative aspect-[4/5] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                    {product.image ? (
                        <img
                            src={getProductImageUrl(product.image)}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
                            loading="lazy"
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

                    {/* Quick Add Button - Appears on Hover */}
                    {hasStock && (
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold rounded-2xl shadow-xl shadow-primary-500/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <IconPlus size={16} />
                                <span>Add to Cart</span>
                            </div>
                        </div>
                    )}
                </div>
            </button>

            {/* Product Info */}
            <div className="relative p-4 flex flex-col gap-2.5">
                {/* Decorative Line */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

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
                    {hasStock && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
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
            </div>
        </div>
    );
}

// Category Tab Button - Modern Pill Design
function CategoryTab({ category, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                relative px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap
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
                className="relative w-full h-14 pl-5 pr-14 rounded-2xl border-2 border-slate-200/70 dark:border-slate-700/70
                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
                    text-slate-800 dark:text-slate-200
                    placeholder-slate-400 dark:placeholder-slate-500
                    focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500
                    focus:bg-white dark:focus:bg-slate-900
                    transition-all duration-300 text-base font-medium shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
                disabled={isSearching}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isSearching ? (
                    <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
    const normalizedSelectedCategory =
        selectedCategory === null ? null : Number(selectedCategory);

    // Filter products by category and search
    const filteredProducts = products.filter((product) => {
        const matchesCategory =
            normalizedSelectedCategory === null ||
            Number(product.category_id) === normalizedSelectedCategory;
        const matchesSearch =
            !searchQuery ||
            product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Search Bar - Glassmorphism Header */}
            <div
                data-tour="pos-search"
                className="relative p-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl"
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
            <div className="px-5 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md overflow-x-auto scrollbar-hide">
                <div className="flex gap-3">
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
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={onAddToCart}
                                isAdding={addingProductId === product.id}
                            />
                        ))}
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