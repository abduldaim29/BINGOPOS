import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import { IconDeviceFloppy, IconGift, IconMedal } from "@tabler/icons-react";
import toast from "react-hot-toast";

const formatNumber = (value) => String(value ?? 0);

export default function Loyalty({ settings }) {
    const { data, setData, post, processing, errors } = useForm({
        enable_earn: Boolean(settings.enable_earn),
        enable_redeem: Boolean(settings.enable_redeem),
        earn_rate_amount: formatNumber(settings.earn_rate_amount),
        redeem_point_value: formatNumber(settings.redeem_point_value),
        tiers: settings.tiers.reduce((accumulator, tier) => {
            accumulator[tier.key] = formatNumber(tier.minimum_total_spent);
            return accumulator;
        }, {}),
    });

    const submit = (event) => {
        event.preventDefault();
        post(route("settings.loyalty.update"), {
            preserveScroll: true,
            onSuccess: () => toast.success("Loyalty settings saved successfully."),
            onError: () => toast.error("Failed to save loyalty settings."),
        });
    };

    return (
        <>
            <Head title="Loyalty Settings" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Loyalty Settings
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Configure the earn rate, redemption value, and member tier thresholds.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
                                    <IconGift size={22} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Earn & Redeem
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Control how points are earned and redeemed.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                        Enable Points Earning
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={data.enable_earn}
                                        onChange={(event) =>
                                            setData("enable_earn", event.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-primary-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                        Enable Points Redemption
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={data.enable_redeem}
                                        onChange={(event) =>
                                            setData(
                                                "enable_redeem",
                                                event.target.checked
                                            )
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-primary-500"
                                    />
                                </label>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Spending Amount Required to Earn 1 Point
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.earn_rate_amount}
                                        onChange={(event) =>
                                            setData(
                                                "earn_rate_amount",
                                                event.target.value
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    />
                                    {errors.earn_rate_amount && (
                                        <p className="mt-1 text-xs text-rose-500">
                                            {errors.earn_rate_amount}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Currency Value per Redeemed Point
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.redeem_point_value}
                                        onChange={(event) =>
                                            setData(
                                                "redeem_point_value",
                                                event.target.value
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    />
                                    {errors.redeem_point_value && (
                                        <p className="mt-1 text-xs text-rose-500">
                                            {errors.redeem_point_value}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                                    <IconMedal size={22} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Tier Thresholds
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        These thresholds determine when members upgrade or downgrade their tiers.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {settings.tiers.map((tier) => (
                                    <div key={tier.key}>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {tier.label}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.tiers[tier.key] || ""}
                                            onChange={(event) =>
                                                setData("tiers", {
                                                    ...data.tiers,
                                                    [tier.key]: event.target.value,
                                                })
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                ))}
                            </div>
                            {errors.tiers && (
                                <p className="mt-3 text-xs text-rose-500">
                                    {errors.tiers}
                                </p>
                            )}
                        </section>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                        >
                            <IconDeviceFloppy size={18} />
                            {processing ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Loyalty.layout = (page) => <DashboardLayout children={page} />;