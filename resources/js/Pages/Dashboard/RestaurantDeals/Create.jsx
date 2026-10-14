import React from "react";
import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Button from "@/Components/Dashboard/Button";
import Form from "./Form";

export default function Create({ outlets, products, activeOutlet }) {
    return (
        <>
            <Head title="Buat Restaurant Deal" />

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
                            Buat Restaurant Deal
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Buat paket atau promo baru untuk restoran.
                        </p>
                    </div>
                </div>

                <Form
                    deal={null}
                    outlets={outlets}
                    products={products}
                    activeOutlet={activeOutlet}
                />
            </div>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
