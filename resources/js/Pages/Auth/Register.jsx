import { useEffect, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AuthBotGuardFields from "@/Components/AuthBotGuardFields";
import {
    IconShoppingCart,
    IconUser,
    IconMail,
    IconLock,
    IconEye,
    IconEyeOff,
    IconLoader2,
    IconCheck,
    IconChevronDown,
} from "@tabler/icons-react";
import { clearAllCache } from "@/Utils/offlineDb";

export default function Register({ botGuard, userRoles }) {
    const roleLabels = {
        "super-admin": "Super Administrator",
        administrator: "Administrator/Manager",
        "inventory-manager": "Inventory Manager",
        cashier: "Cashier",
    };

    const honeypotField = botGuard?.honeypot_field || "company_website";
    const tokenField = botGuard?.token_field || "bot_guard_token";

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: userRoles?.[0]?.name || "super-admin",
        [honeypotField]: "",
        [tokenField]: botGuard?.token || "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // Clear all cached data when visiting register page to ensure fresh data for new user
        clearAllCache().catch((error) => {
            console.error("Failed to clear cache:", error);
        });
        return () => reset("password", "password_confirmation");
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("register"));
    };

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
                {/* Left - Decoration */}
                <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
                    <div className="max-w-md text-center text-white">
                        <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
                            <IconShoppingCart size={48} />
                        </div>

                        <h2 className="text-3xl font-bold mb-4">
                            Join Us
                        </h2>

                        <p className="text-lg opacity-90">
                            Start managing your business with a modern, fast,
                            and easy-to-use Point of Sale system.
                        </p>

                        <div className="mt-8 space-y-3">
                            {[
                                "Free to get started",
                                "Set up in 5 minutes",
                                "Full support",
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <IconCheck
                                        size={18}
                                        className="text-white/80"
                                    />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        {/* Logo */}
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

                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Create a New Account
                            </h1>

                            <p className="mt-2 text-slate-600 dark:text-slate-400">
                                Register your business today
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-5">
                            <AuthBotGuardFields
                                botGuard={botGuard}
                                data={data}
                                setData={setData}
                            />

                            {errors.human && (
                                <div className="rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-600 dark:bg-danger-950/40 dark:text-danger-300">
                                    {errors.human}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Full Name
                                </label>

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <IconUser size={20} />
                                    </div>

                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        placeholder="Your name"
                                        className={`w-full h-12 pl-12 pr-4 rounded-xl border-2 ${
                                            errors.name
                                                ? "border-danger-500 focus:border-danger-500"
                                                : "border-slate-200 dark:border-slate-700 focus:border-primary-500"
                                        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-primary-500/20 transition-all`}
                                    />
                                </div>

                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-danger-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email
                                </label>

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <IconMail size={20} />
                                    </div>

                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        placeholder="name@email.com"
                                        className={`w-full h-12 pl-12 pr-4 rounded-xl border-2 ${
                                            errors.email
                                                ? "border-danger-500 focus:border-danger-500"
                                                : "border-slate-200 dark:border-slate-700 focus:border-primary-500"
                                        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-primary-500/20 transition-all`}
                                    />
                                </div>

                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-danger-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Role
                                </label>

                                <div className="relative">
                                    <select
                                        value={data.role}
                                        onChange={(e) =>
                                            setData("role", e.target.value)
                                        }
                                        className={`w-full h-12 pl-4 pr-12 rounded-xl border-2 appearance-none cursor-pointer ${
                                            errors.role
                                                ? "border-danger-500 focus:border-danger-500"
                                                : "border-slate-200 dark:border-slate-700 focus:border-primary-500"
                                        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/20 transition-all`}
                                        style={{
                                            WebkitAppearance: "none",
                                            MozAppearance: "none",
                                            appearance: "none",
                                            backgroundImage: "none",
                                        }}
                                    >
                                        {userRoles?.map((role) => (
                                            <option
                                                key={role.id}
                                                value={role.name}
                                            >
                                                {roleLabels[role.name] ||
                                                    role.name}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Custom Dropdown Arrow */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <IconChevronDown size={20} />
                                    </div>
                                </div>

                                {errors.role && (
                                    <p className="mt-1.5 text-sm text-danger-500">
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Password
                                </label>

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <IconLock size={20} />
                                    </div>

                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        placeholder="Minimum 8 characters"
                                        className={`w-full h-12 pl-12 pr-12 rounded-xl border-2 ${
                                            errors.password
                                                ? "border-danger-500 focus:border-danger-500"
                                                : "border-slate-200 dark:border-slate-700 focus:border-primary-500"
                                        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-primary-500/20 transition-all`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? (
                                            <IconEyeOff size={20} />
                                        ) : (
                                            <IconEye size={20} />
                                        )}
                                    </button>
                                </div>

                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-danger-500">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Confirm Password
                                </label>

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <IconLock size={20} />
                                    </div>

                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                "password_confirmation",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Re-enter your password"
                                        className={`w-full h-12 pl-12 pr-12 rounded-xl border-2 ${
                                            errors.password_confirmation
                                                ? "border-danger-500 focus:border-danger-500"
                                                : "border-slate-200 dark:border-slate-700 focus:border-primary-500"
                                        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-primary-500/20 transition-all`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? (
                                            <IconEyeOff size={20} />
                                        ) : (
                                            <IconEye size={20} />
                                        )}
                                    </button>
                                </div>

                                {errors.password_confirmation && (
                                    <p className="mt-1.5 text-sm text-danger-500">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
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
                                        Processing...
                                    </>
                                ) : (
                                    "Register Now"
                                )}
                            </button>

                            {/* Login Link */}
                            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="text-primary-500 hover:text-primary-600 font-semibold"
                                >
                                    Log in here
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}