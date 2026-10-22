
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import {
    IconBrandWhatsapp,
    IconPlugConnected,
    IconPlugConnectedX,
} from "@tabler/icons-react";

export default function Whatsapp({ settings, waStatus }) {
    const { data, setData, post, processing } = useForm({
        wa_service_url: settings.wa_service_url || "",
        wa_enabled: settings.wa_enabled || false,
        wa_auto_reminder: settings.wa_auto_reminder || false,
        wa_auto_invoice: settings.wa_auto_invoice || false,
    });

    const [status, setStatus] = useState(
        waStatus || {
            connected: false,
            phone: null,
            qr: null,
            starting: false,
        }
    );

    const [polling, setPolling] = useState(false);
    const [testNumber, setTestNumber] = useState("");
    const [connectionError, setConnectionError] = useState("");

    useEffect(() => {
        let interval;

        if (polling || status.starting) {
            interval = setInterval(() => {
                fetchStatus();
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [polling, status.starting]);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(
                route("settings.whatsapp.status"),
                { timeout: 10000 }
            );

            setStatus(res.data);
            setConnectionError("");

            if (res.data.connected) {
                setPolling(false);
                setConnectionError("");
            }
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to retrieve WhatsApp connection status.";

            setConnectionError(message);
        }
    };

    const handleConnect = async () => {
        setConnectionError("");

        try {
            setStatus((current) => ({
                ...current,
                starting: true,
            }));

            await axios.post(
                route("settings.whatsapp.start"),
                {},
                { timeout: 15000 }
            );

            setPolling(true);
            await fetchStatus();

            toast.success(
                "Connection request sent. Waiting for WhatsApp..."
            );
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to start the WhatsApp connection.";

            setStatus((current) => ({
                ...current,
                starting: false,
            }));

            setPolling(false);
            setConnectionError(message);
            toast.error(message);
        }
    };

    const handleDisconnect = async () => {
        setConnectionError("");

        try {
            await axios.post(
                route("settings.whatsapp.disconnect"),
                {},
                { timeout: 15000 }
            );

            setStatus({
                connected: false,
                phone: null,
                qr: null,
                starting: false,
            });

            setPolling(false);
            toast.success("WhatsApp disconnected successfully.");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to disconnect WhatsApp.";

            setConnectionError(message);
            toast.error(message);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();

        post(route("settings.whatsapp.update"), {
            preserveScroll: true,
            onSuccess: () =>
                toast.success("WhatsApp settings saved successfully."),
            onError: () =>
                toast.error("Failed to save WhatsApp settings."),
        });
    };

    const handleTest = async () => {
        const number = testNumber.trim();

        if (!number) {
            return toast.error("Enter a destination WhatsApp number.");
        }

        try {
            await axios.post(
                route("settings.whatsapp.test"),
                { target: number },
                { timeout: 20000 }
            );

            toast.success("Test message sent successfully.");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Failed to send the test message.";

            toast.error(message);
        }
    };

    return (
        <>
            <Head title="WhatsApp Settings" />

            <div className="space-y-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
                        <IconBrandWhatsapp
                            size={28}
                            className="text-emerald-500"
                        />
                        WhatsApp Integration
                    </h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Connect your WhatsApp account to send automated
                        CRM campaign messages, payment reminders, and
                        transaction invoices.
                    </p>
                </div>

                {/* Connection Status */}
                <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center gap-3">
                        <div
                            className={`h-3 w-3 rounded-full ${
                                status.connected
                                    ? "bg-emerald-500"
                                    : status.starting
                                      ? "animate-pulse bg-amber-400"
                                      : "bg-slate-300"
                            }`}
                        />

                        <span className="font-medium text-slate-800 dark:text-white">
                            {status.connected
                                ? `Connected (${status.phone || "WhatsApp"})`
                                : status.starting
                                  ? "Connecting to WhatsApp..."
                                  : "Not Connected"}
                        </span>
                    </div>

                    {connectionError && (
                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                            <p className="font-semibold">
                                Connection Error
                            </p>
                            <p className="mt-1 break-words">
                                {connectionError}
                            </p>
                        </div>
                    )}

                    {status.qr && !status.connected && (
                        <div className="mb-4 text-center">
                            <img
                                src={status.qr}
                                alt="WhatsApp connection QR code"
                                className="mx-auto h-48 w-48"
                            />

                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Open WhatsApp on your phone, go to
                                Linked Devices, select Link a Device,
                                and scan this QR code.
                            </p>
                        </div>
                    )}

                    {!status.connected && (
                        <button
                            type="button"
                            onClick={handleConnect}
                            disabled={processing || status.starting}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <IconPlugConnected size={18} />
                            {status.starting
                                ? "Connecting..."
                                : "Connect WhatsApp"}
                        </button>
                    )}

                    {status.connected && (
                        <button
                            type="button"
                            onClick={handleDisconnect}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                        >
                            <IconPlugConnectedX size={18} />
                            Disconnect WhatsApp
                        </button>
                    )}
                </div>

                {/* WhatsApp Configuration */}
                <form
                    onSubmit={handleSave}
                    className="max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            WhatsApp Service URL
                        </label>

                        <input
                            type="url"
                            value={data.wa_service_url}
                            onChange={(e) =>
                                setData("wa_service_url", e.target.value)
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="http://localhost:3001"
                        />

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Enter the URL of your running Node.js
                            WhatsApp service.
                        </p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={Boolean(data.wa_enabled)}
                            onChange={(e) =>
                                setData("wa_enabled", e.target.checked)
                            }
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        Enable WhatsApp Integration
                    </label>

                    <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Automated Messages
                        </h3>

                        <label className="mb-3 flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={Boolean(data.wa_auto_reminder)}
                                onChange={(e) =>
                                    setData(
                                        "wa_auto_reminder",
                                        e.target.checked
                                    )
                                }
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            Automatically send payment reminders
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={Boolean(data.wa_auto_invoice)}
                                onChange={(e) =>
                                    setData(
                                        "wa_auto_invoice",
                                        e.target.checked
                                    )
                                }
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            Automatically send invoices after transactions
                        </label>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </form>

                {/* Test WhatsApp Message */}
                {status.connected && (
                    <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Send a Test Message
                        </h3>

                        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                            Enter the recipient's number with the country
                            code, without the plus sign or spaces.
                        </p>

                        <div className="flex gap-2">
                            <input
                                type="tel"
                                value={testNumber}
                                onChange={(e) =>
                                    setTestNumber(e.target.value)
                                }
                                placeholder="923001234567"
                                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />

                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={processing}
                                className="rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Send Test
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Whatsapp.layout = (page) => <DashboardLayout children={page} />;
