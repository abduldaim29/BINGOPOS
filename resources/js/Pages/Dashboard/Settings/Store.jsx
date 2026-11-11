import { getImageUrl } from "@/Utils/imageUrl";

import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import {
    IconBuildingStore,
    IconDeviceFloppy,
    IconPhone,
    IconMapPin,
    IconWorld,
    IconMail,
    IconPhoto,
    IconFileCertificate,
    IconReceiptTax,
} from "@tabler/icons-react";

export default function Store({ settings }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        store_name: settings.store_name || "",
        store_logo: null,
        store_address: settings.store_address || "",
        store_phone: settings.store_phone || "",
        store_mobile: settings.store_mobile || "",
        store_email: settings.store_email || "",
        store_website: settings.store_website || "",
        store_city: settings.store_city || "",
        brand_ntn: settings.brand_ntn || "",
        brand_strn: settings.brand_strn || "",
        tax_default_rate: settings.tax_default_rate || "18.00",
        tax_cash_rate: settings.tax_cash_rate || "16.00",
        tax_card_rate: settings.tax_card_rate || "6.00",
    });

    const [logoPreview, setLogoPreview] = useState(
        settings.store_logo || null
    );

    useEffect(() => {
        return () => {
            if (logoPreview && logoPreview.startsWith("blob:")) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    const submit = (e) => {
        e.preventDefault();

        post(route("settings.store.update"), {
            preserveScroll: true,
            onSuccess: (page) => {
                toast.success("Brand profile saved successfully");
                reset("store_logo");

                if (page.props.settings.store_logo) {
                    const logoPath = page.props.settings.store_logo;

                    setLogoPreview(getImageUrl(logoPath, ""));
                }
            },
            onError: () => {
                toast.error("Failed to save store profile");
            },
        });
    };

    return (
        <>
            <Head title="Brand Profile" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Brand Settings
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage the brand information displayed on receipts and reports.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6"
                >
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Brand Logo */}
                        <div className="lg:w-1/3">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <IconPhoto size={18} />
                                Brand Logo
                            </label>

                            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden mb-3">
                                {logoPreview ? (
                                    <img
                                        src={getImageUrl(logoPreview, "")}
                                        alt="Brand Logo"
                                        className="w-full h-full object-cover"
                                        decoding="async"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <IconBuildingStore
                                        size={36}
                                        className="text-slate-300"
                                    />
                                )}
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];

                                    if (file) {
                                        setData("store_logo", file);
                                        setLogoPreview(
                                            URL.createObjectURL(file)
                                        );
                                    }
                                }}
                            />

                            {errors.store_logo && (
                                <p className="text-xs text-danger-500 mt-1">
                                    {errors.store_logo}
                                </p>
                            )}
                        </div>

                        {/* Store Information */}
                        <div className="lg:flex-1 space-y-4">
                            <Input
                                label="Brand Name"
                                value={data.store_name}
                                errors={errors.store_name}
                                onChange={(e) =>
                                    setData("store_name", e.target.value)
                                }
                                placeholder="Enter brand name"
                            />

                            <Textarea
                                label="Full Address"
                                value={data.store_address}
                                errors={errors.store_address}
                                onChange={(e) =>
                                    setData("store_address", e.target.value)
                                }
                                rows={3}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="City"
                                    value={data.store_city}
                                    errors={errors.store_city}
                                    onChange={(e) =>
                                        setData("store_city", e.target.value)
                                    }
                                    placeholder="e.g., Lahore"
                                    icon={<IconMapPin size={16} />}
                                />

                                <Input
                                    label="Phone Number (Landline)"
                                    value={data.store_phone}
                                    errors={errors.store_phone}
                                    onChange={(e) =>
                                        setData("store_phone", e.target.value)
                                    }
                                    placeholder="042-12345678"
                                    icon={<IconPhone size={16} />}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Mobile Number"
                                    type="tel"
                                    value={data.store_mobile}
                                    errors={errors.store_mobile}
                                    onChange={(e) =>
                                        setData("store_mobile", e.target.value)
                                    }
                                    placeholder="0300-1234567"
                                    icon={<IconPhone size={16} />}
                                />

                                <Input
                                    label="Email"
                                    type="email"
                                    value={data.store_email}
                                    errors={errors.store_email}
                                    onChange={(e) =>
                                        setData("store_email", e.target.value)
                                    }
                                    placeholder="example@store.com"
                                    icon={<IconMail size={16} />}
                                />
                            </div>

                            <Input
                                label="Website / Social Media"
                                value={data.store_website}
                                errors={errors.store_website}
                                onChange={(e) =>
                                    setData("store_website", e.target.value)
                                }
                                placeholder="https://example.com"
                                icon={<IconWorld size={16} />}
                            />
                        </div>
                    </div>

                    {/* Tax & Legal Information */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <IconReceiptTax
                                size={20}
                                className="text-primary-500"
                            />
                            Tax & Legal Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="NTN (National Tax Number / CNIC for individuals)"
                                value={data.brand_ntn}
                                errors={errors.brand_ntn}
                                onChange={(e) =>
                                    setData("brand_ntn", e.target.value)
                                }
                                placeholder="Enter NTN or CNIC"
                                icon={<IconFileCertificate size={16} />}
                            />

                            <Input
                                label="STRN (Sales Tax Registration Number)"
                                value={data.brand_strn}
                                errors={errors.brand_strn}
                                onChange={(e) =>
                                    setData("brand_strn", e.target.value)
                                }
                                placeholder="Enter STRN (if registered)"
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="VAT default rate (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={data.tax_default_rate}
                                errors={errors.tax_default_rate}
                                onChange={(e) => setData("tax_default_rate", e.target.value)}
                                placeholder="18"
                            />
                            <Input
                                label="Cash payment VAT (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={data.tax_cash_rate}
                                errors={errors.tax_cash_rate}
                                onChange={(e) => setData("tax_cash_rate", e.target.value)}
                                placeholder="16"
                            />
                            <Input
                                label="Card payment VAT (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={data.tax_card_rate}
                                errors={errors.tax_card_rate}
                                onChange={(e) => setData("tax_card_rate", e.target.value)}
                                placeholder="6"
                            />
                        </div>
                    </div>

                    {/* Save Settings */}
                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50"
                        >
                            <IconDeviceFloppy size={18} />
                            {processing ? "Saving..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Store.layout = (page) => <DashboardLayout children={page} />;
