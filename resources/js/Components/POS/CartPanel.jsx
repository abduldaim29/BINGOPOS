import React, { useState, useRef, useEffect } from "react";
import {
    IconTrash,
    IconMinus,
    IconPlus,
    IconShoppingCart,
    IconSparkles,
    IconPackage,
} from "@tabler/icons-react";
import { getProductImageUrl } from "@/Utils/imageUrl";
import { formatCurrency } from "@/Utils/currency";

// Single Cart Item with Enhanced UI/UX
function CartItem({ item, onUpdateQty, onRemove, isRemoving }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const [swipeProgress, setSwipeProgress] = useState(0);
    const itemRef = useRef(null);

    // Note: item.price from backend is already the total (sell_price * qty)
    const quantity = Number(item.qty || 0);
    const itemPrice = Number(item.price || 0);
    // Use variation price if available, otherwise use product sell price
    const unitPrice = itemPrice / quantity || 0;
    const subtotal = itemPrice; // Already calculated total from backend

    // Swipe gesture handling
    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        const diff = e.touches[0].clientX - touchStartX;
        if (diff < 0) {
            setSwipeProgress(Math.min(Math.abs(diff) / 100, 1));
        }
    };

    const handleTouchEnd = () => {
        if (swipeProgress > 0.5) {
            onRemove(item.id);
        }
        setSwipeProgress(0);
        setTouchStartX(0);
    };

    return (
        <div
            ref={itemRef}
            className={`
            group relative flex gap-3 p-3 rounded-2xl
            bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900
            border border-slate-200 dark:border-slate-700
            shadow-sm hover:shadow-md
            transition-all duration-300 ease-out
            ${isRemoving ? "opacity-0 scale-95 translate-x-full" : "animate-fade-in"}
            ${swipeProgress > 0 ? "translate-x-[-10px]" : ""}
        `}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Swipe indicator */}
            {swipeProgress > 0 && (
                <div
                    className="absolute inset-y-0 left-0 w-1 bg-gradient-to-t from-danger-500 to-danger-400 rounded-l-2 transition-all"
                    style={{ opacity: swipeProgress }}
                />
            )}

            {/* Product Image with lazy loading */}
            <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden flex-shrink-0 shadow-inner">
                {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 animate-pulse">
                        <IconPackage size={20} className="text-slate-300 dark:text-slate-600" />
                    </div>
                )}
                {item.product?.image && !imageError ? (
                    <img
                        src={getProductImageUrl(item.product.image)}
                        alt={item.product.title}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            imageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <IconShoppingCart
                            size={20}
                            className="text-slate-400 dark:text-slate-600"
                        />
                    </div>
                )}
                {/* Badge for quantity > 1 */}
                {quantity > 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                        {quantity}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
                    {item.product?.title || "Product"}
                </h4>
                {/* Unit/Variation Display */}
                {(item.variation_name || item.unit_name || item.unit?.name) && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-0.5">
                        {item.variation_name || item.unit_name || item.unit?.name}
                    </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {formatCurrency(unitPrice)}
                    </span>
                    <span className="text-slate-400">×</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                        {item.qty}
                    </span>
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300">
                        {formatCurrency(subtotal)}
                    </span>
                </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex flex-col items-end justify-between gap-2">
                {/* Remove Button */}
                <button
                    onClick={() => onRemove(item.id)}
                    disabled={isRemoving}
                    className="p-2 rounded-xl text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group-hover:opacity-100 opacity-0"
                    title="Remove item"
                >
                    <IconTrash size={16} />
                </button>

                {/* Enhanced Quantity Stepper */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
                    <button
                        onClick={() =>
                            onUpdateQty(item.id, Math.max(1, item.qty - 1))
                        }
                        disabled={item.qty <= 1 || isRemoving}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-sm"
                        title="Decrease quantity"
                    >
                        <IconMinus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {item.qty}
                    </span>
                    <button
                        onClick={() => onUpdateQty(item.id, item.qty + 1)}
                        disabled={isRemoving}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-sm shadow-primary-500/30"
                        title="Increase quantity"
                    >
                        <IconPlus size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Empty Cart State with Enhanced Illustration
function EmptyCart() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="relative mb-6">
                {/* Animated background rings */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-full animate-pulse" />
                <div className="absolute inset-4 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/20 dark:to-slate-900 rounded-full" />

                {/* Main icon */}
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-xl">
                    <IconShoppingCart
                        size={40}
                        className="text-slate-400 dark:text-slate-600"
                    />
                    {/* Sparkle icons */}
                    <IconSparkles
                        size={16}
                        className="absolute -top-2 -right-2 text-primary-400 dark:text-primary-500 animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                    />
                </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Your Cart Is Empty
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                Start by selecting a product from the catalog or scanning a barcode.
            </p>

            {/* Action hint */}
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
                <IconShoppingCart size={14} />
                <span>Click a product to add it</span>
            </div>
        </div>
    );
}

// Main CartPanel Component with Glassmorphism and Modern UI
export default function CartPanel({
    items = [],
    onUpdateQty,
    onRemove,
    removingItemId,
    className = "",
}) {
    const totalItems = items.reduce(
        (sum, item) => sum + Number(item.qty || 0),
        0
    );

    // Note: item.price from backend is already sell_price * qty
    const subtotal = items.reduce(
        (sum, item) => sum + Number(item.price || 0),
        0
    );

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Glassmorphism Header */}
            <div className="relative flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <IconShoppingCart
                                size={18}
                                className="text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">
                            Cart
                        </h2>
                        {totalItems > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {totalItems} item{totalItems !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                </div>
                {totalItems > 0 && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-500/20 blur-md rounded-full" />
                        <span className="relative px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg shadow-primary-500/30">
                            {totalItems}
                        </span>
                    </div>
                )}
            </div>

            {/* Cart Items with glassmorphism background */}
            {items.length > 0 ? (
                <div
                    className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50"
                    style={{ maxHeight: "300px", minHeight: "150px" }}
                >
                    {items.map((item) => (
                        <CartItem
                            key={item.id}
                            item={item}
                            onUpdateQty={onUpdateQty}
                            onRemove={onRemove}
                            isRemoving={removingItemId === item.id}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
                    <EmptyCart />
                </div>
            )}

            {/* Enhanced Subtotal with Glassmorphism */}
            {items.length > 0 && (
                <div className="relative p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5 dark:from-primary-500/10 dark:to-accent-500/10" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Subtotal
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                ({totalItems} item{totalItems !== 1 ? "s" : ""})
                            </span>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-500/10 blur-lg rounded" />
                            <span className="relative text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300 tabular-nums">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export sub-components
CartPanel.Item = CartItem;
CartPanel.Empty = EmptyCart;