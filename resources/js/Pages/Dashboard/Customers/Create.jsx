import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";
import toast from "react-hot-toast";
import {
    IconUsers,
    IconDeviceFloppy,
    IconArrowLeft,
} from "@tabler/icons-react";

export default function Create() {
    const { errors, tierOptions = [] } = usePage().props;

    const { data, setData, post, processing } = useForm({
        name: "",
        no_telp: "",
        email: "",
        address: "",
        is_loyalty_member: false,
        loyalty_tier: "regular",
        province_id: "",
        province_name: "",
        regency_id: "",
        regency_name: "",
        district_id: "",
        district_name: "",
        village_id: "",
        village_name: "",
        tax_id: "",
        tax_name: "",
        cnic: "",
        ntn: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("customers.store"), {
            onSuccess: () => toast.success("Customer added successfully"),
            onError: () => toast.error("Failed to save customer"),
        });
    };

    return (
        <>
            <Head title="Add Customer" />

            <div className="mb-6">
                <Link
                    href={route("customers.index")}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-3"
                >
                    <IconArrowLeft size={16} />
                    Back to Customers
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <IconUsers size={28} className="text-primary-500" />
                    Add New Customer
                </h1>
            </div>

            <form onSubmit={submit}>
                <div className="max-w-3xl">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                type="text"
                                label="Customer Name"
                                placeholder="Enter full name"
                                errors={errors.name}
                                onChange={(e) => setData("name", e.target.value)}
                                value={data.name}
                            />
                            <Input
                                type="text"
                                label="Mobile Phone Number"
                                placeholder="03xxxxxxxxxx"
                                errors={errors.no_telp}
                                onChange={(e) =>
                                    setData("no_telp", e.target.value)
                                }
                                value={data.no_telp}
                            />
                        </div>

                        <div>
                            <Input
                                type="email"
                                label="Email"
                                placeholder="customer@example.com"
                                errors={errors.email}
                                onChange={(e) => setData("email", e.target.value)}
                                value={data.email}
                            />
                        </div>

                        <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Loyalty Member Activation
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Members get points, vouchers, and special prices.
                                    </p>
                                </div>
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={data.is_loyalty_member}
                                        onChange={(e) =>
                                            setData(
                                                "is_loyalty_member",
                                                e.target.checked
                                            )
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-primary-500"
                                    />
                                    Member
                                </label>
                            </div>

                            {data.is_loyalty_member && (
                                <div className="mt-4">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Initial Tier
                                    </label>
                                    <select
                                        value={data.loyalty_tier}
                                        onChange={(e) =>
                                            setData(
                                                "loyalty_tier",
                                                e.target.value
                                            )
                                        }
                                        className="mt-2 w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                                    >
                                        {tierOptions.map((tier) => (
                                            <option
                                                key={tier.value}
                                                value={tier.value}
                                            >
                                                {tier.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Tax Information Section */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                                Tax Information (Pakistan)
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    type="text"
                                    label="CNIC (National Identity Card)"
                                    placeholder="xxxxx-xxxxxxx-x"
                                    errors={errors.cnic}
                                    onChange={(e) => setData("cnic", e.target.value)}
                                    value={data.cnic}
                                />
                                <Input
                                    type="text"
                                    label="NTN (National Tax Number)"
                                    placeholder="Tax registration number"
                                    errors={errors.ntn}
                                    onChange={(e) => setData("ntn", e.target.value)}
                                    value={data.ntn}
                                />
                                <Input
                                    type="text"
                                    label="Tax ID"
                                    placeholder="Additional tax ID"
                                    errors={errors.tax_id}
                                    onChange={(e) => setData("tax_id", e.target.value)}
                                    value={data.tax_id}
                                />
                                <Input
                                    type="text"
                                    label="Tax Name"
                                    placeholder="Name on tax documents"
                                    errors={errors.tax_name}
                                    onChange={(e) => setData("tax_name", e.target.value)}
                                    value={data.tax_name}
                                />
                            </div>
                        </div>

                        {/* Regional Information (Pakistan) */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                                Regional Information (Pakistan)
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    type="text"
                                    label="Province"
                                    placeholder="e.g., Punjab, Sindh, KPK, Balochistan"
                                    errors={errors.province_name}
                                    onChange={(e) => setData("province_name", e.target.value)}
                                    value={data.province_name}
                                />
                                <Input
                                    type="text"
                                    label="City/District"
                                    placeholder="e.g., Lahore, Karachi, Islamabad"
                                    errors={errors.regency_name}
                                    onChange={(e) => setData("regency_name", e.target.value)}
                                    value={data.regency_name}
                                />
                                <Input
                                    type="text"
                                    label="Tehsil/Subdistrict"
                                    placeholder="Tehsil name"
                                    errors={errors.district_name}
                                    onChange={(e) => setData("district_name", e.target.value)}
                                    value={data.district_name}
                                />
                                <Input
                                    type="text"
                                    label="Union Council/Ward"
                                    placeholder="Union council or ward name"
                                    errors={errors.village_name}
                                    onChange={(e) => setData("village_name", e.target.value)}
                                    value={data.village_name}
                                />
                            </div>
                        </div>

                        <Textarea
                            label="Detailed Address"
                            placeholder="Complete customer address"
                            errors={errors.address}
                            onChange={(e) => setData("address", e.target.value)}
                            value={data.address}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Link
                            href={route("customers.index")}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50"
                        >
                            <IconDeviceFloppy size={18} />
                            {processing ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
