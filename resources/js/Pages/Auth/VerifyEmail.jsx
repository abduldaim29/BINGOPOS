import { Head, Link, useForm } from "@inertiajs/react";
import AuthBotGuardFields from "@/Components/AuthBotGuardFields";
import {
    IconShoppingCart,
    IconMailCheck,
    IconLoader2,
    IconLogout,
    IconRefresh,
} from "@tabler/icons-react";

export default function VerifyEmail({ status, botGuard }) {
    const honeypotField = botGuard?.honeypot_field || "company_website";
    const tokenField = botGuard?.token_field || "bot_guard_token";
    const { data, setData, post, processing, errors } = useForm({
        [honeypotField]: "",
        [tokenField]: botGuard?.token || "",
    });

    const submit = (event) => {
        event.preventDefault();
        post(route("verification.send"));
    };

    return (
        <>
            <Head title="Verify Email" />

            <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-3 mb-6"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                    <IconShoppingCart
                                        size={24}
                                        className="text-white"
                                    />
                                </div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Cashier Application
                                </span>
                            </Link>

                            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center mb-5">
                                <IconMailCheck
                                    size={28}
                                    className="text-primary-600 dark:text-primary-400"
                                />
                            </div>

                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Verify Your Email
                            </h1>
                            <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                                Before accessing the dashboard, click the
                                verification link we sent to your email. If you
                                haven't received the email, you can resend it
                                from this page.
                            </p>
                        </div>

                        {status === "verification-link-sent" && (
                            <div className="mb-6 p-4 rounded-xl bg-success-50 dark:bg-success-950/50 text-success-700 dark:text-success-400 text-sm">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="mb-5 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-4 text-sm text-slate-600 dark:text-slate-300">
                                Also check your spam or promotions folder if
                                the email isn't visible in your inbox.
                            </div>

                            {errors.human && (
                                <div className="mb-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-600 dark:bg-danger-950/40 dark:text-danger-300">
                                    {errors.human}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-3">
                                <AuthBotGuardFields
                                    botGuard={botGuard}
                                    data={data}
                                    setData={setData}
                                />

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <IconLoader2
                                                size={20}
                                                className="animate-spin"
                                            />
                                            Resending...
                                        </>
                                    ) : (
                                        <>
                                            <IconRefresh size={18} />
                                            Resend Verification Email
                                        </>
                                    )}
                                </button>

                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <IconLogout size={18} />
                                    Log Out
                                </Link>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
                    <div className="max-w-md text-center text-white">
                        <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
                            <IconMailCheck size={48} />
                        </div>

                        <h2 className="text-3xl font-bold mb-4">
                            Safer Account Activation
                        </h2>

                        <p className="text-lg opacity-90">
                            Email verification helps ensure that only valid
                            accounts can access the dashboard and your store's
                            operational data.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            {[
                                "Verified Access",
                                "Account Protection",
                                "Secure Dashboard",
                            ].map((item, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}