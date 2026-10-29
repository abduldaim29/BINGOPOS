import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import Pagination from "@/Components/Dashboard/Pagination";
import Table from "@/Components/Dashboard/Table";
import { IconBook2, IconCopy, IconEdit, IconFlame, IconPlus, IconPower } from "@tabler/icons-react";

const money = (value) => `Rs ${Number(value || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Index({ recipes, filters }) {
    const filter = (key, value) => router.get(route("recipes.index"), { ...filters, [key]: value }, { preserveState: true, replace: true });
    const status = (recipe) => recipe.status === "active" ? "bg-emerald-100 text-emerald-700" : recipe.status === "inactive" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700";
    const totalRecipes = recipes.total || recipes.data.length;
    const activeRecipes = recipes.data.filter((recipe) => recipe.status === "active").length;
    const ingredientCount = recipes.data.reduce((sum, recipe) => sum + Number(recipe.ingredients_count || 0), 0);

    return (
        <>
            <Head title="Recipe Management" />
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recipe Management</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage product ingredients, purchase costs, preparation steps, and recipe profitability.</p></div>
                <Link href={route("recipes.create")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"><IconPlus size={18} /> Create Recipe</Link>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[[IconBook2, "Recipes", totalRecipes, "All saved recipes"], [IconFlame, "Active on page", activeRecipes, "Active recipes"], [IconPlus, "Ingredient links", ingredientCount, "Rows on this page"]].map(([Icon, label, value, helper]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span><Icon size={18} className="text-primary-500" /></div><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p><p className="text-xs text-slate-500">{helper}</p></div>)}
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[minmax(0,1fr)_180px]">
                <input className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" placeholder="Search recipe, code, or product" value={filters.search || ""} onChange={(e) => filter("search", e.target.value)} />
                <select className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" value={filters.status || ""} onChange={(e) => filter("status", e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
            </div>
            <Table.Card title="Recipe library">
                <Table><Table.Thead><tr><Table.Th>Recipe</Table.Th><Table.Th>Finished Product</Table.Th><Table.Th>Yield</Table.Th><Table.Th>Ingredients</Table.Th><Table.Th>Total Cost</Table.Th><Table.Th>Per Yield</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></tr></Table.Thead><Table.Tbody>
                    {recipes.data.length ? recipes.data.map((recipe) => <tr key={recipe.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><Table.Td><p className="font-medium text-slate-800 dark:text-slate-200">{recipe.name}</p><p className="text-xs text-slate-500">{recipe.code}</p></Table.Td><Table.Td>{recipe.product?.title || "-"}</Table.Td><Table.Td>{recipe.batch_yield} {recipe.yield_unit?.symbol || "servings"}</Table.Td><Table.Td>{recipe.ingredients_count}</Table.Td><Table.Td>{money(recipe.costing?.total_cost)}</Table.Td><Table.Td>{money(recipe.costing?.cost_per_yield)}</Table.Td><Table.Td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status(recipe)}`}>{recipe.status}</span></Table.Td><Table.Td><div className="flex items-center gap-2"><Link title="Edit" href={route("recipes.edit", recipe.id)} className="text-primary-600"><IconEdit size={17} /></Link><button title="Duplicate" type="button" className="text-slate-500" onClick={() => router.post(route("recipes.duplicate", recipe.id))}><IconCopy size={17} /></button><button title={recipe.status === "active" ? "Deactivate" : "Activate"} type="button" className="text-slate-500" onClick={() => router.patch(route("recipes.status", recipe.id), { status: recipe.status === "active" ? "inactive" : "active" })}><IconPower size={17} /></button></div></Table.Td></tr>) : <Table.Empty colSpan={8} message="No recipes found. Create your first recipe to start costing products." />}
                </Table.Tbody></Table>
            </Table.Card>
            {recipes.last_page > 1 && <Pagination links={recipes.links} />}
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
