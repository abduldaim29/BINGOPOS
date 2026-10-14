import React from "react";
import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Button from "@/Components/Dashboard/Button";
import Form from "./Form";

export default function Edit({ deal, outlets, products, activeOutlet }) {
    return (
        <>
            <Head title={`Edit ${deal.name}`} />

            <div className="w-full">
                <div className="mb-6 flex items-center gap-4">
                    <Button
                        type="link"
                        href={route("restaurant-deals.index")}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        label="Kembali"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Edit {deal.name}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ubah konfigurasi deal ini.
                        </p>
                    </div>
                </div>

                <Form
                    deal={deal}
                    outlets={outlets}
                    products={products}
                    activeOutlet={activeOutlet}
                />
            </div>
        </>
    );
}

Edit.layout = (page) => <DashboardLayout children={page} />;
