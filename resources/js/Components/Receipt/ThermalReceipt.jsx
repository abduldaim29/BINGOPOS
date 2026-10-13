
import React from "react";
import { formatWithSymbol } from "@/Utils/currency";

/* -------------------------------------------------------
   Shared helpers
------------------------------------------------------- */

const receiptFormatPrice = (price = 0) => formatWithSymbol(price);

const receiptFormatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const receiptFormatTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const receiptPaymentLabels = {
    cash: "CASH",
    bank_transfer: "BANK TRANSFER",
    midtrans: "MIDTRANS",
    xendit: "XENDIT",
    safepay: "SAFEPAY",
    qris: "QRIS",
    pay_later: "PAY LATER",
    split: "SPLIT PAYMENT",
};

const receiptGetPaymentLabel = (method) => {
    const key = String(method || "cash").toLowerCase();

    return (
        receiptPaymentLabels[key] ||
        String(method || "CASH").toUpperCase()
    );
};

/*
 * Supports common settings key names.
 * Explicit props take priority over transaction settings.
 */
const getStoreAddress = (storeAddress, transaction) => {
    const candidates = [
        storeAddress,
        transaction?.store_address,
        transaction?.store?.address,
        transaction?.outlet?.address,
        transaction?.warehouse?.address,
        transaction?.company?.address,
        transaction?.settings?.store_address,
        transaction?.settings?.address,
    ];

    const address = candidates.find(
        (value) => typeof value === "string" && value.trim() !== ""
    );

    return address ? address.trim() : "";
};

const getStorePhone = (storePhone, transaction) => {
    const candidates = [
        storePhone,
        transaction?.store_phone,
        transaction?.store?.phone,
        transaction?.outlet?.phone,
        transaction?.company?.phone,
        transaction?.settings?.store_phone,
    ];

    const phone = candidates.find(
        (value) => typeof value === "string" && value.trim() !== ""
    );

    return phone ? phone.trim() : "";
};

const ReceiptDivider = ({ className = "" }) => (
    <div
        aria-hidden="true"
        className={`receipt-dotted-divider ${className}`}
    />
);

const ReceiptLogo = ({ storeLogo, storeName, size = "80mm" }) => {
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
        setFailed(false);
    }, [storeLogo]);

    if (!storeLogo || failed) return null;

    return (
        <div className="receipt-logo-wrap">
            <img
                src={storeLogo}
                alt={`${storeName} logo`}
                className={
                    size === "58mm"
                        ? "receipt-logo receipt-logo-58"
                        : "receipt-logo receipt-logo-80"
                }
                onError={() => setFailed(true)}
            />
        </div>
    );
};

/* Decorative only; not a scanner-compatible barcode. */
const ReceiptBarcode = ({ value, size = "80mm" }) => {
    const text = String(value || "");
    const maxBars = size === "58mm" ? 100 : 150;

    const bars = text
        .split("")
        .flatMap((char, index) => {
            const seed = char.charCodeAt(0) + index * 17;

            return [
                { width: 1 + (seed % 2), gap: false },
                { width: 1, gap: true },
                { width: 1 + ((seed >> 2) % 3), gap: false },
                { width: 1, gap: true },
            ];
        })
        .slice(0, maxBars);

    return (
        <div className="receipt-barcode">
            <div className="receipt-barcode-bars">
                {bars.map((bar, index) => (
                    <span
                        key={index}
                        className={bar.gap ? "receipt-barcode-gap" : ""}
                        style={{ width: `${bar.width}px` }}
                    />
                ))}
            </div>
            <p className="receipt-barcode-text">{text}</p>
        </div>
    );
};

const ReceiptDetailRow = ({
    label,
    children,
    compact = false,
}) => (
    <div
        className={`receipt-detail-row ${
            compact ? "receipt-detail-row-58" : ""
        }`}
    >
        <span className="receipt-detail-label">{label}</span>
        <span className="receipt-detail-colon">:</span>
        <span className="receipt-detail-value">{children ?? "-"}</span>
    </div>
);

/*
 * Store address has its own block and is not placed in a grid.
 * This prevents the address from being squeezed out on 58mm paper.
 */
const ReceiptStoreHeader = ({
    storeName,
    storeLogo,
    storeAddress,
    storePhone,
    size = "80mm",
}) => (
    <header
        className={`receipt-header ${
            size === "58mm" ? "receipt-header-58" : "receipt-header-80"
        }`}
    >
        <ReceiptLogo
            storeLogo={storeLogo}
            storeName={storeName}
            size={size}
        />

        <h1
            className={`receipt-store-name ${
                size === "58mm"
                    ? "receipt-store-name-58"
                    : "receipt-store-name-80"
            }`}
        >
            {storeName}
        </h1>

        {storeAddress && (
            <div
                className={`receipt-store-address ${
                    size === "58mm"
                        ? "receipt-store-address-58"
                        : "receipt-store-address-80"
                }`}
            >
                {storeAddress}
            </div>
        )}

        {storePhone && (
            <div className="receipt-store-phone">
                Phone: {storePhone}
            </div>
        )}
    </header>
);

const ReceiptTotals = ({ transaction, items, compact = false }) => {
    const loyaltyDiscount = Number(
        transaction?.loyalty_discount_total || 0
    );
    const voucherDiscount = Number(
        transaction?.customer_voucher_discount || 0
    );
    const discount = Number(transaction?.discount || 0);
    const shipping = Number(transaction?.shipping_cost || 0);
    const tax = Number(transaction?.tax_total || 0);
    const total = Number(transaction?.grand_total || 0);

    const promoDiscount = items.reduce(
        (sum, item) => sum + Number(item.discount_total || 0),
        0
    );

    const subtotal =
        total +
        discount +
        promoDiscount +
        loyaltyDiscount +
        voucherDiscount -
        shipping -
        tax;

    return (
        <section className="receipt-totals">
            <div className="receipt-money-row">
                <span>Subtotal</span>
                <span>{receiptFormatPrice(subtotal)}</span>
            </div>

            {promoDiscount > 0 && (
                <div className="receipt-money-row">
                    <span>Promotion</span>
                    <span>-{receiptFormatPrice(promoDiscount)}</span>
                </div>
            )}

            {discount > 0 && (
                <div className="receipt-money-row">
                    <span>Discount</span>
                    <span>-{receiptFormatPrice(discount)}</span>
                </div>
            )}

            {voucherDiscount > 0 && (
                <div className="receipt-money-row">
                    <span>Voucher</span>
                    <span>-{receiptFormatPrice(voucherDiscount)}</span>
                </div>
            )}

            {loyaltyDiscount > 0 && (
                <div className="receipt-money-row">
                    <span>Redeemed Points</span>
                    <span>-{receiptFormatPrice(loyaltyDiscount)}</span>
                </div>
            )}

            {shipping > 0 && (
                <div className="receipt-money-row">
                    <span>Shipping</span>
                    <span>{receiptFormatPrice(shipping)}</span>
                </div>
            )}

            {tax > 0 && (
                <div className="receipt-money-row">
                    <span>Sales Tax</span>
                    <span>{receiptFormatPrice(tax)}</span>
                </div>
            )}

            <div
                className={`receipt-grand-total ${
                    compact ? "receipt-grand-total-58" : ""
                }`}
            >
                <span>Grand Total</span>
                <span>{receiptFormatPrice(total)}</span>
            </div>
        </section>
    );
};

const ReceiptPaymentDetails = ({ transaction, compact = false }) => {
    const cash = Number(transaction?.cash || 0);
    const change = Number(transaction?.change || 0);
    const tenders = transaction?.tenders ?? [];

    return (
        <section className="receipt-payment">
            <h3>Payment Details</h3>

            {tenders.length > 0 ? (
                tenders.map((tender, index) => (
                    <div
                        key={tender.id || index}
                        className="receipt-money-row"
                    >
                        <span className="receipt-payment-method">
                            {receiptGetPaymentLabel(tender.method)}
                        </span>
                        <span>{receiptFormatPrice(tender.amount)}</span>
                    </div>
                ))
            ) : (
                <>
                    <ReceiptDetailRow
                        compact={compact}
                        label="Payment Method"
                    >
                        {receiptGetPaymentLabel(transaction?.payment_method)}
                    </ReceiptDetailRow>

                    <div className="receipt-money-row">
                        <span>Amount Paid</span>
                        <span>{receiptFormatPrice(cash)}</span>
                    </div>
                </>
            )}

            {change > 0 && (
                <div className="receipt-money-row receipt-change">
                    <span>Change</span>
                    <span>{receiptFormatPrice(change)}</span>
                </div>
            )}
        </section>
    );
};

const ReceiptStyles = () => (
    <style>{`
        .thermal-receipt,
        .thermal-receipt-58 {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            box-sizing: border-box;
            background: #fff;
            color: #000;
            font-family: "Courier New", Courier, monospace;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .thermal-receipt *,
        .thermal-receipt-58 * {
            box-sizing: border-box;
        }

        .thermal-receipt {
            width: 80mm;
            padding: 4mm;
            font-size: 12px;
        }

        .thermal-receipt-58 {
            width: 58mm;
            padding: 2.5mm;
            font-size: 9px;
        }

        .receipt-content {
            position: relative;
            z-index: 2;
            width: 100%;
            min-width: 0;
        }

        .receipt-watermark {
            position: absolute;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            left: 0;
        }

        .receipt-watermark-80 {
            top: 43%;
            transform: translateY(-50%);
        }

        .receipt-watermark-58 {
            top: 68%;
            transform: translateY(-50%);
        }

        .receipt-watermark span {
            display: block;
            white-space: nowrap;
            text-transform: uppercase;
            font-family: Arial, sans-serif;
            font-weight: 800;
            color: #000;
            opacity: 0.045;
            transform: rotate(-35deg);
            letter-spacing: 2px;
            line-height: 1;
        }

        .receipt-watermark-80 span {
            font-size: 30px;
        }

        .receipt-watermark-58 span {
            font-size: 18px;
            letter-spacing: 1px;
        }

        .receipt-header {
            display: block;
            width: 100%;
            min-width: 0;
            margin-bottom: 10px;
            text-align: center;
            overflow: visible;
        }

        .receipt-header-58 {
            padding: 0 0.5mm;
        }

        .receipt-logo-wrap {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 7px;
        }

        .receipt-logo {
            display: block !important;
            object-fit: contain;
            object-position: center;
            height: auto;
            flex: 0 0 auto;
        }

        .receipt-logo-80 {
            max-width: 22mm;
            max-height: 12mm;
        }

        .receipt-logo-58 {
            max-width: 18mm;
            max-height: 9mm;
        }

        .receipt-store-name {
            margin: 0;
            font-weight: 800;
            overflow-wrap: anywhere;
            line-height: 1.2;
        }

        .receipt-store-name-80 {
            font-size: 19px;
        }

        .receipt-store-name-58 {
            font-size: 14px;
        }

        .receipt-store-address {
            display: block;
            width: 100%;
            min-width: 0;
            margin: 5px auto 0;
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: normal;
            text-align: center;
            line-height: 1.5;
        }

        .receipt-store-address-58 {
            max-width: 100%;
            padding: 0;
            font-size: 8px;
            line-height: 1.6;
        }

        .receipt-store-address-80 {
            font-size: 12px;
        }

        .receipt-store-phone {
            display: block;
            margin-top: 3px;
            white-space: normal;
            overflow-wrap: anywhere;
            text-align: center;
        }

        .receipt-dotted-divider {
            display: block;
            width: 100%;
            height: 0;
            border: 0;
            border-top: 1px dotted #000;
            margin: 9px 0;
            padding: 0;
        }

        .receipt-title {
            margin: 9px 0;
            text-align: center;
            font-weight: 800;
            line-height: 1.25;
        }

        .receipt-title-80 {
            font-size: 20px;
        }

        .receipt-title-58 {
            font-size: 14px;
        }

        .receipt-detail-row {
            display: grid;
            grid-template-columns: 100px 7px minmax(0, 1fr);
            gap: 3px;
            align-items: start;
            margin: 2px 0;
            width: 100%;
        }

        .receipt-detail-row-58 {
            grid-template-columns: minmax(0, 1fr) 5px minmax(0, 1.2fr);
            gap: 2px;
        }

        .receipt-detail-label,
        .receipt-detail-value {
            min-width: 0;
            overflow-wrap: anywhere;
        }

        .receipt-detail-colon {
            text-align: center;
        }

        .receipt-section-heading {
            margin: 8px 0 4px;
            font-size: 13px;
            font-weight: 800;
        }

        .receipt-customer {
            margin: 8px 0;
            overflow-wrap: anywhere;
        }

        .receipt-customer-name {
            font-weight: 700;
            overflow-wrap: anywhere;
        }

        .receipt-items {
            width: 100%;
            min-width: 0;
            margin: 8px 0;
        }

        .receipt-items-header,
        .receipt-item-row {
            display: grid;
            grid-template-columns: 18px minmax(0, 1fr) 28px 66px;
            gap: 4px;
            align-items: start;
            width: 100%;
        }

        .receipt-items-header {
            font-weight: 800;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 2px;
        }

        .receipt-item-row {
            padding: 5px 0;
            border-bottom: 1px dotted #aaa;
        }

        .receipt-items-58 .receipt-items-header,
        .receipt-items-58 .receipt-item-row {
            grid-template-columns: minmax(0, 1fr) 18px 53px;
            gap: 3px;
        }

        .receipt-item-name {
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: normal;
        }

        .receipt-item-small {
            font-size: 10px;
            margin-top: 2px;
            overflow-wrap: anywhere;
        }

        .receipt-item-amount {
            text-align: right;
            min-width: 0;
            overflow-wrap: anywhere;
        }

        .receipt-item-qty {
            text-align: right;
            overflow-wrap: anywhere;
        }

        .receipt-totals {
            margin: 8px 0;
        }

        .receipt-money-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 7px;
            margin: 3px 0;
            width: 100%;
        }

        .receipt-money-row > span:first-child {
            min-width: 0;
            overflow-wrap: anywhere;
        }

        .receipt-money-row > span:last-child {
            flex: 0 0 auto;
            text-align: right;
            overflow-wrap: anywhere;
            max-width: 60%;
        }

        .receipt-grand-total {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 6px;
            border-top: 1px solid #000;
            padding-top: 8px;
            margin-top: 8px;
            font-size: 17px;
            font-weight: 800;
        }

        .receipt-grand-total > span:first-child {
            min-width: 0;
            overflow-wrap: anywhere;
        }

        .receipt-grand-total > span:last-child {
            text-align: right;
            overflow-wrap: anywhere;
        }

        .receipt-grand-total-58 {
            font-size: 11px;
        }

        .receipt-payment {
            margin: 8px 0;
            min-width: 0;
        }

        .receipt-payment h3 {
            margin: 0 0 5px;
            font-size: 13px;
            font-weight: 800;
        }

        .receipt-payment-method {
            min-width: 0;
            overflow-wrap: anywhere;
        }

        .receipt-change {
            margin-top: 5px;
            padding-top: 4px;
            border-top: 1px dotted #000;
            font-weight: 800;
        }

        .receipt-footer {
            margin-top: 10px;
            text-align: center;
            overflow-wrap: anywhere;
        }

        .receipt-thank-you {
            font-size: 14px;
            font-weight: 800;
        }

        .receipt-barcode {
            width: 100%;
            margin: 10px auto 5px;
            text-align: center;
            overflow: hidden;
        }

        .receipt-barcode-bars {
            display: flex;
            justify-content: center;
            align-items: stretch;
            height: 32px;
            width: 100%;
            overflow: hidden;
        }

        .receipt-barcode-bars span {
            display: block;
            flex: 0 0 auto;
            height: 100%;
            background: #000;
        }

        .receipt-barcode-bars .receipt-barcode-gap {
            background: transparent;
        }

        .receipt-barcode-text {
            margin-top: 4px;
            font-size: 9px;
            letter-spacing: 1px;
            overflow-wrap: anywhere;
        }

        @media print {
            .thermal-receipt {
                width: 80mm !important;
                margin: 0 !important;
                padding: 3mm !important;
                overflow: hidden !important;
            }

            .thermal-receipt-58 {
                width: 58mm !important;
                margin: 0 !important;
                padding: 2mm !important;
                overflow: hidden !important;
                font-size: 8px !important;
            }

            .receipt-logo {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }

            @page {
                margin: 0;
            }

            @page receipt80 {
                size: 80mm auto;
                margin: 0;
            }

            @page receipt58 {
                size: 58mm auto;
                margin: 0;
            }

            .thermal-receipt {
                page: receipt80;
            }

            .thermal-receipt-58 {
                page: receipt58;
            }
        `}</style>
);

/**
 * 80mm Thermal Receipt
 */
export default function ThermalReceipt({
    transaction,
    storeName = "YOUR STORE",
    storeLogo = "",
    storeAddress = "",
    storePhone = "",
}) {
    const items = transaction?.details ?? [];
    const address = getStoreAddress(storeAddress, transaction);
    const phone = getStorePhone(storePhone, transaction);

    return (
        <div className="thermal-receipt">
            <div
                className="receipt-watermark receipt-watermark-80"
                aria-hidden="true"
            >
                <span>{storeName}</span>
            </div>

            <div className="receipt-content">
                <ReceiptStoreHeader
                    storeName={storeName}
                    storeLogo={storeLogo}
                    storeAddress={address}
                    storePhone={phone}
                    size="80mm"
                />

                <ReceiptDivider />

                <h2 className="receipt-title receipt-title-80">
                    SALES INVOICE
                </h2>

                <section>
                    <ReceiptDetailRow label="Invoice No">
                        {transaction?.invoice || "-"}
                    </ReceiptDetailRow>
                    <ReceiptDetailRow label="Date">
                        {receiptFormatDate(transaction?.created_at)}
                    </ReceiptDetailRow>
                    <ReceiptDetailRow label="Time">
                        {receiptFormatTime(transaction?.created_at)}
                    </ReceiptDetailRow>
                    <ReceiptDetailRow label="Cashier">
                        {transaction?.cashier?.name || "-"}
                    </ReceiptDetailRow>
                </section>

                <ReceiptDivider />

                <section className="receipt-customer">
                    <h3 className="receipt-section-heading">Bill To:</h3>
                    <p className="receipt-customer-name">
                        {transaction?.customer?.name || "Walk-in Customer"}
                    </p>
                    {transaction?.customer?.address && (
                        <p>{transaction.customer.address}</p>
                    )}
                    {transaction?.customer?.phone && (
                        <p>Phone: {transaction.customer.phone}</p>
                    )}
                </section>

                <ReceiptDivider />

                <section className="receipt-items">
                    <div className="receipt-items-header">
                        <span>#</span>
                        <span>Item Name</span>
                        <span className="receipt-item-qty">Qty</span>
                        <span className="receipt-item-amount">Total</span>
                    </div>

                    {items.map((item, index) => {
                        const qty = Number(item.qty) || 1;
                        const itemTotal = Number(item.price) || 0;
                        const unitPrice =
                            Number(item.unit_price || 0) || itemTotal / qty;
                        const baseUnitPrice =
                            Number(item.base_unit_price || 0) || unitPrice;

                        return (
                            <div
                                key={item.id || index}
                                className="receipt-item-row"
                            >
                                <span>{index + 1}</span>
                                <div className="receipt-item-name">
                                    <p>{item.product?.title || "-"}</p>
                                    <p className="receipt-item-small">
                                        {receiptFormatPrice(unitPrice)} each
                                    </p>
                                    {Number(item.discount_total || 0) > 0 &&
                                        baseUnitPrice > unitPrice && (
                                            <p className="receipt-item-small">
                                                Promotion
                                            </p>
                                        )}
                                </div>
                                <span className="receipt-item-qty">{qty}</span>
                                <span className="receipt-item-amount">
                                    {receiptFormatPrice(itemTotal)}
                                </span>
                            </div>
                        );
                    })}
                </section>

                <ReceiptDivider />
                <ReceiptTotals transaction={transaction} items={items} />
                <ReceiptDivider />
                <ReceiptPaymentDetails transaction={transaction} />
                <ReceiptDivider />

                <footer className="receipt-footer">
                    <p className="receipt-thank-you">
                        Thank You for Your Purchase!
                    </p>
                    <ReceiptBarcode value={transaction?.invoice} />
                    <ReceiptDivider />
                    <p>{storeName}</p>
                    <p>Your Satisfaction is Our Priority</p>
                </footer>
            </div>

            <ReceiptStyles />
        </div>
    );
}

/**
 * 58mm Thermal Receipt
 */
export function ThermalReceipt58mm({
    transaction,
    storeName = "YOUR STORE",
    storeLogo = "",
    storeAddress = "",
    storePhone = "",
}) {
    const items = transaction?.details ?? [];
    const address = getStoreAddress(storeAddress, transaction);
    const phone = getStorePhone(storePhone, transaction);

    return (
        <div className="thermal-receipt-58">
            <div
                className="receipt-watermark receipt-watermark-58"
                aria-hidden="true"
            >
                <span>{storeName}</span>
            </div>

            <div className="receipt-content">
                <ReceiptStoreHeader
                    storeName={storeName}
                    storeLogo={storeLogo}
                    storeAddress={address}
                    storePhone={phone}
                    size="58mm"
                />

                <ReceiptDivider />

                <h2 className="receipt-title receipt-title-58">
                    SALES INVOICE
                </h2>

                <section>
                    <ReceiptDetailRow compact label="Invoice No">
                        {transaction?.invoice || "-"}
                    </ReceiptDetailRow>
                    <ReceiptDetailRow compact label="Date">
                        {receiptFormatDate(transaction?.created_at)}
                    </ReceiptDetailRow>
                    <ReceiptDetailRow compact label="Time">
                        {receiptFormatTime(transaction?.created_at)}
                    </ReceiptDetailRow>
                    <ReceiptDetailRow compact label="Cashier">
                        {transaction?.cashier?.name || "-"}
                    </ReceiptDetailRow>
                </section>

                <ReceiptDivider />

                <section className="receipt-customer">
                    <h3 className="receipt-section-heading">Bill To:</h3>
                    <p className="receipt-customer-name">
                        {transaction?.customer?.name || "Walk-in Customer"}
                    </p>
                    {transaction?.customer?.address && (
                        <p>{transaction.customer.address}</p>
                    )}
                    {transaction?.customer?.phone && (
                        <p>Phone: {transaction.customer.phone}</p>
                    )}
                </section>

                <ReceiptDivider />

                <section className="receipt-items receipt-items-58">
                    <div className="receipt-items-header">
                        <span>Item</span>
                        <span className="receipt-item-qty">Qty</span>
                        <span className="receipt-item-amount">Total</span>
                    </div>

                    {items.map((item, index) => {
                        const qty = Number(item.qty) || 1;
                        const itemTotal = Number(item.price) || 0;
                        const unitPrice =
                            Number(item.unit_price || 0) || itemTotal / qty;

                        return (
                            <div
                                key={item.id || index}
                                className="receipt-item-row"
                            >
                                <div className="receipt-item-name">
                                    <p>{item.product?.title || "-"}</p>
                                    <p className="receipt-item-small">
                                        {receiptFormatPrice(unitPrice)} each
                                    </p>
                                </div>
                                <span className="receipt-item-qty">{qty}</span>
                                <span className="receipt-item-amount">
                                    {receiptFormatPrice(itemTotal)}
                                </span>
                            </div>
                        );
                    })}
                </section>

                <ReceiptDivider />
                <ReceiptTotals
                    transaction={transaction}
                    items={items}
                    compact
                />
                <ReceiptDivider />
                <ReceiptPaymentDetails transaction={transaction} compact />
                <ReceiptDivider />

                <footer className="receipt-footer">
                    <p className="receipt-thank-you">
                        Thank You for Your Purchase!
                    </p>
                    <ReceiptBarcode
                        value={transaction?.invoice}
                        size="58mm"
                    />
                    <ReceiptDivider />
                    <p>{storeName}</p>
                    <p>Your Satisfaction is Our Priority</p>
                </footer>
            </div>

            <ReceiptStyles />
        </div>
    );
}
