import React from "react";
import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    IconArrowLeft,
    IconBook2,
    IconClock,
    IconEdit,
    IconFlame,
    IconPackage,
    IconReceipt,
} from "@tabler/icons-react";

const money = (value) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const quantity = (value) =>
    Number(value || 0).toLocaleString("en-PK", {
        maximumFractionDigits: 4,
    });

const statusClass = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

function SummaryCard({ icon: Icon, label, value, helper }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                </span>
                <Icon size={18} className="text-primary-500" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {value}
            </p>
            {helper && <p className="mt-0.5 text-xs text-slate-500">{helper}</p>}
        </div>
    );
}

export default function Show({ recipe, costing }) {
    const ingredients = costing?.rows || [];
    const steps = recipe.steps || [];
    const yieldValue = Number(recipe.batch_yield || 0);
    const yieldUnit =
        recipe.yield_unit?.symbol ||
        recipe.yield_unit?.name ||
        (yieldValue === 1 ? "serving" : "servings");

    return (
        <>
            <Head title={`${recipe.name} - Recipe`} />
            <div className="space-y-6">
                <div>
                    <Link
                        href={route("recipes.index")}
                        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-primary-600"
                    >
                        <IconArrowLeft size={16} />
                        Back to Recipe Library
                    </Link>
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {recipe.name}
                                </h1>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        statusClass[recipe.status] || statusClass.draft
                                    }`}
                                >
                                    {recipe.status}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {recipe.code} <span className="mx-1">·</span>{" "}
                                {recipe.product?.title || "No finished product"}
                                {recipe.variation_name && ` · ${recipe.variation_name}`}
                            </p>
                        </div>
                        <Link
                            href={route("recipes.edit", recipe.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <IconEdit size={17} />
                            Edit Recipe
                        </Link>
                    </div>
                </div>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        icon={IconPackage}
                        label="Batch yield"
                        value={`${quantity(recipe.batch_yield)} ${yieldUnit}`}
                        helper={`${recipe.recipe_type} recipe`}
                    />
                    <SummaryCard
                        icon={IconBook2}
                        label="Ingredients"
                        value={ingredients.length}
                        helper="Items in this recipe"
                    />
                    <SummaryCard
                        icon={IconReceipt}
                        label="Total batch cost"
                        value={money(costing?.total_cost)}
                        helper={`Ingredients ${money(costing?.ingredient_cost_after_tax)}`}
                    />
                    <SummaryCard
                        icon={IconFlame}
                        label="Cost per yield"
                        value={money(costing?.cost_per_yield)}
                        helper={
                            costing?.selling_price > 0
                                ? `Selling price ${money(costing.selling_price)}`
                                : "Estimated from current ingredient costs"
                        }
                    />
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                            Ingredients and cost
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Ingredient</th>
                                    <th className="px-4 py-3">Quantity</th>
                                    <th className="px-4 py-3">Wastage</th>
                                    <th className="px-4 py-3">Unit cost</th>
                                    <th className="px-5 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {ingredients.length ? (
                                    ingredients.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                {item.ingredient_name ||
                                                    item.product?.title ||
                                                    "Ingredient"}
                                                {item.product?.sku && (
                                                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                                                        {item.product.sku}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                {quantity(item.quantity)}{" "}
                                                {item.unit?.symbol ||
                                                    item.unit?.name ||
                                                    ""}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                {quantity(item.wastage_percent)}%
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                {money(item.purchase_price)}
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                                                {money(item.total_cost)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-10 text-center text-sm text-slate-500"
                                        >
                                            No ingredients have been added to this recipe.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="border-t border-slate-200 dark:border-slate-700">
                                {[
                                    ["Ingredient cost", costing?.ingredient_cost_after_tax],
                                    ["Packaging", costing?.packaging_cost],
                                    ["Labour", costing?.labour_cost],
                                    ["Overhead", costing?.overhead_cost],
                                ].map(([label, amount]) => (
                                    <tr key={label}>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-2 text-right text-slate-500"
                                        >
                                            {label}
                                        </td>
                                        <td className="px-5 py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                                            {money(amount)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 dark:bg-slate-800/60">
                                    <td
                                        colSpan={4}
                                        className="px-5 py-3 text-right font-bold text-slate-900 dark:text-white"
                                    >
                                        Total batch cost
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-primary-600">
                                        {money(costing?.total_cost)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {costing?.purchase_tax_note && (
                        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">
                            {costing.purchase_tax_note}
                        </p>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center gap-2">
                        <IconClock size={19} className="text-primary-500" />
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                            Preparation steps
                        </h2>
                    </div>
                    {steps.length ? (
                        <ol className="space-y-3">
                            {steps.map((step, index) => (
                                <li
                                    key={step.id}
                                    className="flex gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                                        {index + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                            {step.title}
                                        </h3>
                                        <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">
                                            {step.instructions}
                                        </p>
                                        {(step.duration_minutes ||
                                            step.temperature ||
                                            step.equipment) && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                {step.duration_minutes
                                                    ? `${step.duration_minutes} min`
                                                    : ""}
                                                {step.temperature
                                                    ? ` · ${step.temperature}°${step.temperature_unit || "C"}`
                                                    : ""}
                                                {step.equipment
                                                    ? ` · ${step.equipment}`
                                                    : ""}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                            No preparation steps have been added.
                        </p>
                    )}
                </section>

                {recipe.notes && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                            Notes
                        </h2>
                        <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">
                            {recipe.notes}
                        </p>
                    </section>
                )}
            </div>
        </>
    );
}

Show.layout = (page) => <DashboardLayout children={page} />;
