import React, { useState, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import {
    IconCrown,
    IconUser,
    IconSearch,
    IconCheck,
    IconChevronDown,
    IconUserPlus,
    IconClock,
    IconStar,
    IconSparkles,
    IconAlertTriangle,
} from "@tabler/icons-react";
import { CustomerHistoryButton } from "./CustomerHistoryPanel";
import AddCustomerModal from "./AddCustomerModal";

export default function CustomerSelect({
    customers = [],
    selected,
    onSelect,
    placeholder = "Select customer...",
    error,
    label,
    onCustomerAdded,
    tierOptions = [],
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showInlineAdd, setShowInlineAdd] = useState(false);
    const [recentCustomers, setRecentCustomers] = useState([]);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Find Walk-In Customer
    const walkInCustomer = customers.find(c => c.is_walkin);

    // Default to Walk-In Customer if no customer is selected
    useEffect(() => {
        if (!selected && walkInCustomer) {
            onSelect(walkInCustomer);
        }
    }, []);

    // Load recent customers from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('recentCustomers');
        if (stored) {
            try {
                setRecentCustomers(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse recent customers:', e);
            }
        }
    }, []);

    // Save to recent customers when a customer is selected
    const handleSelect = (customer) => {
        onSelect(customer);
        setIsOpen(false);
        setSearch("");

        // Add to recent customers
        const updatedRecent = [
            customer,
            ...recentCustomers.filter(c => c.id !== customer.id).slice(0, 4)
        ];
        setRecentCustomers(updatedRecent);
        localStorage.setItem('recentCustomers', JSON.stringify(updatedRecent));
    };

    // Filter customers by search (always include walk-in customer at top)
    const filteredCustomers = [
        // Always include Walk-In Customer at the top
        ...(walkInCustomer ? [walkInCustomer] : []),
        // Then add other customers (excluding walk-in from search results)
        ...customers.filter(
            (customer) =>
                !customer.is_walkin && (
                    String(customer.name ?? "")
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                String(customer.no_telp ?? "")
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
            String(customer.member_code ?? "")
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
        ),
    ];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setShowInlineAdd(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleAddCustomerSuccess = (newCustomer) => {
        setShowAddModal(false);
        setShowInlineAdd(false);
        // Reload page data to get updated customer list
        router.reload({ only: ["customers"] });
        onCustomerAdded?.(newCustomer);
        onSelect?.(newCustomer);
    };

    const handleUpgradeMember = async () => {
        if (!selected || selected.is_loyalty_member) {
            return;
        }

        try {
            const response = await axios.post(
                route("customers.upgrade-member", selected.id),
                {
                    loyalty_tier: tierOptions[0]?.value || "regular",
                }
            );

            if (response.data.success) {
                onSelect?.(response.data.customer);
                router.reload({ only: ["customers"] });
            }
        } catch (error) {
            console.error("Upgrade member error:", error);
        }
    };

    // Helper to get avatar initials
    const getAvatarInitials = (name) => {
        return name
            .split(' ')
            .map(n => n.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    };

    // Helper to get avatar gradient based on name
    const getAvatarGradient = (name) => {
        const gradients = [
            'from-pink-500 to-rose-500',
            'from-purple-500 to-indigo-500',
            'from-blue-500 to-cyan-500',
            'from-emerald-500 to-teal-500',
            'from-amber-500 to-orange-500',
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    return (
        <>
            <div ref={containerRef} className="relative w-full min-w-0">
                {/* Label */}
                {label && (
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {label}
                    </label>
                )}

                {/* Customer selection with enhanced UI */}
                <div className="space-y-2">
                    {/* Main selector button with glassmorphism */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`
                            w-full min-w-0 min-h-12 h-auto px-4 py-3 rounded-2xl text-left
                            flex items-center gap-3
                            border-2 transition-all duration-300
                            ${
                                isOpen
                                    ? "border-primary-500 ring-4 ring-primary-500/20 shadow-lg shadow-primary-500/20"
                                    : error
                                    ? "border-danger-500 ring-4 ring-danger-500/20"
                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }
                            bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800
                            shadow-sm hover:shadow-md
                        `}
                    >
                        {/* Avatar with gradient */}
                        <div
                            className={`
                            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md
                            bg-gradient-to-br ${selected ? getAvatarGradient(selected.name) : 'from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'}
                            ${selected ? 'ring-2 ring-offset-2 ring-primary-500/30' : ''}
                        `}
                        >
                            {selected ? (
                                <span className="text-white text-sm font-bold">
                                    {getAvatarInitials(selected.name)}
                                </span>
                            ) : (
                                <IconUser
                                    size={18}
                                    className="text-slate-400 dark:text-slate-600"
                                />
                            )}
                        </div>

                        {/* Customer info */}
                        <div className="min-w-0 flex-1 overflow-hidden">
                            {selected ? (
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                            {selected.name}
                                        </p>
                                        {selected.is_loyalty_member && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-950/30">
                                                <IconStar size={10} className="text-amber-600 dark:text-amber-400" />
                                                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                                    {selected.loyalty_tier}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    {selected.no_telp && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                            <IconClock size={12} />
                                            {selected.no_telp}
                                        </p>
                                    )}
                                    {selected.is_loyalty_member && (
                                        <p className="text-xs font-medium bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300">
                                            {selected.loyalty_points || 0} points
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500">
                                    {placeholder}
                                </p>
                            )}
                        </div>

                        {/* Chevron */}
                        <IconChevronDown
                            size={18}
                            className={`text-slate-400 transition-transform duration-300 ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {/* Recent Customers Quick Select */}
                    {!selected && recentCustomers.length > 0 && !isOpen && (
                        <div className="flex gap-2 overflow-x pb-1">
                            {recentCustomers.slice(0, 4).map((customer) => (
                                <button
                                    key={customer.id}
                                    onClick={() => handleSelect(customer)}
                                    className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group"
                                    title={customer.name}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${getAvatarGradient(customer.name)}`}
                                    >
                                        {getAvatarInitials(customer.name)}
                                    </div>
                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[60px]">
                                        {customer.name.split(' ')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex min-w-0 flex-wrap gap-2">
                        {/* History Button */}
                        {selected && (
                            <CustomerHistoryButton
                                customerId={selected.id}
                                customerName={selected.name}
                                className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                            />
                        )}

                        {/* Upgrade Member Button */}
                        {selected && !selected.is_loyalty_member && (
                            <button
                                type="button"
                                onClick={handleUpgradeMember}
                                className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-2 border-dashed border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-3 text-amber-600 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/40 dark:hover:to-orange-900/40 transition-all"
                                title="Upgrade customer to member"
                            >
                                <IconCrown size={16} className="shrink-0" />
                                <span className="truncate text-sm font-semibold">
                                    Upgrade
                                </span>
                            </button>
                        )}

                        {/* Add Customer Button */}
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex h-10 min-w-10 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-950/30 dark:to-indigo-950/30 px-3 text-primary-600 hover:from-primary-100 hover:to-indigo-100 dark:hover:from-primary-900/40 dark:hover:to-indigo-900/40 transition-all shadow-sm"
                            title="Add new customer"
                        >
                            <IconUserPlus size={18} className="shrink-0" />
                            <span className="truncate text-sm font-semibold">
                                Add
                            </span>
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800">
                        <IconAlertTriangle size={14} className="text-danger-600 dark:text-danger-400" />
                        <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>
                    </div>
                )}

                {/* Enhanced Dropdown */}
                {isOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl animate-slide-up backdrop-blur-sm">
                        {/* Search with modern styling */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                            <div className="relative">
                                <IconSearch
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"
                                />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name/phone/member number..."
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Recent Customers Section */}
                        {!search && recentCustomers.length > 0 && (
                            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                    <IconClock size={12} />
                                    Recently Selected
                                </p>
                                <div className="flex gap-2 overflow-x pb-1">
                                    {recentCustomers.map((customer) => (
                                        <button
                                            key={customer.id}
                                            onClick={() => handleSelect(customer)}
                                            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                                        >
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px font-bold bg-gradient-to-br ${getAvatarGradient(customer.name)}`}
                                            >
                                                {getAvatarInitials(customer.name)}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                                                {customer.name.split(' ')[0]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Customer List */}
                        <div className="max-h-72 overflow-y-auto scrollbar-thin">
                            {filteredCustomers.length > 0 ? (
                                <ul className="p-2 space-y-1">
                                    {filteredCustomers.map((customer) => (
                                        <li key={customer.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSelect(customer)
                                                }
                                                className={`
                                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                                                    transition-all duration-200
                                                    ${
                                                        selected?.id ===
                                                        customer.id
                                                            ? "bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/50 ring-2 ring-primary-500/30"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    }
                                                `}
                                            >
                                                {/* Avatar */}
                                                <div
                                                    className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-md
                                                    bg-gradient-to-br ${getAvatarGradient(customer.name)}
                                                    ${
                                                        selected?.id ===
                                                        customer.id
                                                            ? "ring-2 ring-offset-2 ring-primary-500"
                                                            : ""
                                                    }
                                                `}
                                                >
                                                    {getAvatarInitials(customer.name)}
                                                </div>

                                                {/* Customer Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                            {customer.name}
                                                        </p>
                                                        {customer.is_walkin && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                                                                Walk-In
                                                            </span>
                                                        )}
                                                        {customer.is_loyalty_member && (
                                                            <IconSparkles
                                                                size={14}
                                                                className="text-amber-500 dark:text-amber-400"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                                        <IconClock size={12} />
                                                        {customer.no_telp || "-"}
                                                    </p>
                                                    {customer.member_code && (
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                            #{customer.member_code}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {customer.is_loyalty_member ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-[10px] font-medium">
                                                                <IconStar size={10} />
                                                                {customer.loyalty_tier}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                                                Non-member
                                                            </span>
                                                        )}
                                                        {customer.is_loyalty_member && customer.loyalty_points > 0 && (
                                                            <span className="text-[11px] font-medium text-primary-600 dark:text-primary-400">
                                                                {customer.loyalty_points} pts
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Checkmark for selected */}
                                                {selected?.id === customer.id && (
                                                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-md">
                                                        <IconCheck size={12} />
                                                    </div>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                        <IconUser
                                            size={24}
                                            className="text-slate-400 dark:text-slate-600"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                        No customers found
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false);
                                            setShowAddModal(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
                                    >
                                        <IconUserPlus size={16} />
                                        Add new customer
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
                <AddCustomerModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleAddCustomerSuccess}
                    tierOptions={tierOptions}
                />
            </>
        );
}