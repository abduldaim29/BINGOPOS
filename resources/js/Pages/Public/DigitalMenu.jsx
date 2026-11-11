import React, { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { IconArrowLeft, IconMail, IconMapPin, IconPhone, IconSearch, IconWorld } from "@tabler/icons-react";
import { getProductImageUrl } from "@/Utils/imageUrl";

const formatPrice = (value) =>
    Number(value || 0).toLocaleString("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

export default function DigitalMenu({ categories = [], products = [], storeProfile }) {
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch] = useState("");

    const visibleProducts = useMemo(() => {
        const query = search.trim().toLowerCase();

        return products.filter((product) => {
            const matchesCategory =
                activeCategory === "all" ||
                String(product.category_id) === String(activeCategory);
            const matchesSearch =
                !query ||
                [product.title, product.description, product.category_name, product.sub_category_name]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(query));

            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, products, search]);

    const productsByCategory = categories.map((category) => ({
        ...category,
        products: visibleProducts.filter((product) => product.category_id === category.id),
    }));
    const getVariationLabel = (variation) => {
        if (typeof variation !== "string") {
            return variation.name || variation.title || variation.label || "Option";
        }

        return variation.replace(/^[a-z]+_/, "").replace(/_/g, " ");
    };

    return (
        <>
            <Head title={`Menu - ${storeProfile.name}`} />
            <div className="min-h-screen bg-slate-50 text-slate-800">
                <header className="relative overflow-hidden bg-slate-950 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.35),transparent_45%)]" />
                    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <Link
                            href={route("dashboard")}
                            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            <IconArrowLeft size={17} />
                            Back to Dashboard
                        </Link>
                        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                            {storeProfile.logo ? (
                                <img src={storeProfile.logo} alt={storeProfile.name} className="h-24 w-24 rounded-3xl object-cover shadow-2xl ring-4 ring-white/10" />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-500 text-3xl font-bold shadow-2xl">
                                    {storeProfile.name?.charAt(0) || "M"}
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-300">Digital Menu</p>
                                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{storeProfile.name}</h1>
                                <p className="mt-3 max-w-2xl text-sm text-slate-300">{storeProfile.address || storeProfile.city || "Freshly prepared, made for you."}</p>
                                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-300 sm:justify-start">
                                    {storeProfile.phone && <span className="inline-flex items-center gap-1.5"><IconPhone size={15} />{storeProfile.phone}</span>}
                                    {storeProfile.email && <span className="inline-flex items-center gap-1.5"><IconMail size={15} />{storeProfile.email}</span>}
                                    {storeProfile.website && <span className="inline-flex items-center gap-1.5"><IconWorld size={15} />{storeProfile.website}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="sticky top-3 z-10 mb-10 rounded-2xl border border-primary-100 bg-white/95 p-3 shadow-lg shadow-primary-900/5 backdrop-blur">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="relative flex-1">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu items..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                <button onClick={() => setActiveCategory("all")} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeCategory === "all" ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" : "bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700"}`}>All</button>
                                {categories.map((category) => (
                                    <button key={category.id} onClick={() => setActiveCategory(String(category.id))} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${String(activeCategory) === String(category.id) ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" : "bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700"}`}>
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {productsByCategory.map((category) => category.products.length > 0 && (
                        <section key={category.id} className="mb-12 scroll-mt-24">
                            <div className="mb-5 flex items-end justify-between border-b border-primary-100 pb-3">
                                <div>
                                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-primary-500">Fresh picks</p>
                                    <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">{category.name}</h2>
                                    {category.description && <p className="mt-1 text-sm text-slate-500">{category.description}</p>}
                                </div>
                                <span className="text-sm font-medium text-slate-400">{category.products.length} items</span>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {category.products.map((product) => (
                                    (() => {
                                        return (
                                            <article
                                                key={product.id}
                                                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-slate-900/10"
                                            >
                                                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-100 via-orange-50 to-amber-100">
                                                    {product.image ? (
                                                        <img
                                                            src={getProductImageUrl(product.image)}
                                                            alt={product.title}
                                                            loading="lazy"
                                                            decoding="async"
                                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-6xl font-black text-primary-300">
                                                            {product.title?.charAt(0) || "?"}
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/60 to-transparent" />
                                                    <span className="absolute bottom-3 left-4 rounded-full border border-white/30 bg-slate-950/35 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                                                        {product.sub_category_name || category.name}
                                                    </span>
                                                </div>

                                                <div className="flex flex-1 flex-col p-4 sm:p-5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-lg">
                                                            {product.title}
                                                        </h3>
                                                        <span className="shrink-0 rounded-xl bg-primary-50 px-3 py-1.5 text-sm font-extrabold tabular-nums text-primary-700">
                                                            {formatPrice(product.sell_price)}
                                                        </span>
                                                    </div>

                                                    {product.description && (
                                                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
                                                            {product.description}
                                                        </p>
                                                    )}

                                                    {product.variations?.length > 0 && (
                                                        <div className="mt-4">
                                                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                                Available options
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {product.variations.map((variation, index) => {
                                                                    const variationId =
                                                                        typeof variation === "string"
                                                                            ? variation
                                                                            : String(variation.id ?? variation.key ?? variation.value ?? "");
                                                                    const price = Number(
                                                                        product.variation_prices?.[variationId] ??
                                                                            variation.price ??
                                                                            product.sell_price
                                                                    );

                                                                    return (
                                                                        <div
                                                                            key={`${product.id}-${variationId || index}`}
                                                                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                                                                        >
                                                                            <span>{getVariationLabel(variation)}</span>
                                                                            <span className="tabular-nums text-primary-700">
                                                                                {formatPrice(price)}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })()
                                ))}
                            </div>
                        </section>
                    ))}

                    {visibleProducts.length === 0 && <div className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-20 text-center"><IconMapPin className="mx-auto mb-4 text-primary-300" size={40} /><h2 className="text-xl font-bold text-slate-800">No menu items found</h2><p className="mt-2 text-sm text-slate-500">Try another search or category.</p></div>}
                </main>
                <footer className="border-t border-primary-100 bg-white py-8 text-center text-sm text-slate-400">Menu updated automatically from BINGOPOS</footer>
            </div>
        </>
    );
}
