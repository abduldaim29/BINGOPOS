// ponytail: raw ESC/POS byte generator — no heavy library, supports 58mm/80mm paper, cutter, and cash drawer kick
// Upgrade path: image/logo support and code page mapping for stores that use many non-ASCII characters.

const ESC = 0x1b;
const GS = 0x1d;

function textBytes(text) {
    return Array.from(new TextEncoder().encode(text));
}

function buildReceiptBytes(data, paperSize = "80mm") {
    const width = paperSize === "58mm" ? 32 : 48;
    const bytes = [];

    // Initialize: ESC @, code page off, no upside-down printing
    bytes.push(ESC, 0x40);

    const center = (text) => {
        const pad = Math.max(0, Math.floor((width - text.length) / 2));
        bytes.push(...textBytes(" ".repeat(pad) + text + "\n"));
    };

    const leftRight = (l, r) => {
        const space = Math.max(1, width - l.length - r.length);
        bytes.push(...textBytes(l + " ".repeat(space) + r + "\n"));
    };

    const line = () => {
        bytes.push(...textBytes("-".repeat(width) + "\n"));
    };

    const emphasize = (on) => {
        bytes.push(ESC, 0x45, on ? 0x01 : 0x00);
    };

    emphasize(true);
    center(data.store_name || "STORE");
    emphasize(false);

    if (data.store_address) center(data.store_address.slice(0, width));
    if (data.store_phone) center(`Phone: ${data.store_phone}`);

    line();
    leftRight(`#${data.invoice}`, data.created_at || "");

    if (data.cashier) leftRight("Cashier", data.cashier);
    if (data.customer_name) leftRight("Customer", data.customer_name);
    if (data.order_type_label) leftRight("Type", data.order_type_label);

    line();

    for (const item of data.items || []) {
        const name = `${item.qty}x ${item.name}`.slice(0, width);
        bytes.push(...textBytes(name + "\n"));
        const quantity = Number(item.qty || 1);
        const extrasTotal = (item.extras || []).reduce(
            (sum, extra) =>
                sum + Number(extra.price || 0) * Number(extra.qty || 1),
            0,
        );
        const baseLineTotal = Math.max(
            0,
            Number(item.price || 0) - extrasTotal * quantity,
        );
        leftRight("", data.money(baseLineTotal));
        for (const extra of item.extras || []) {
            const extraName = `  + ${extra.name} x${extra.qty}`;
            bytes.push(...textBytes(extraName.slice(0, width) + "\n"));
            leftRight("", data.money(Number(extra.price || 0) * Number(extra.qty || 1)));
        }
    }

    line();
    leftRight("Subtotal", data.money(data.subtotal));

    if (data.discount_total > 0) {
        leftRight("Discount", `-${data.money(data.discount_total)}`);
    }

    if (data.tax_total > 0) {
        leftRight("Tax", data.money(data.tax_total));
    }

    if (data.shipping_cost > 0) {
        leftRight("Shipping", data.money(data.shipping_cost));
    }

    emphasize(true);
    leftRight("TOTAL", data.money(data.grand_total));
    emphasize(false);

    line();

    if (data.payment_method_label) {
        leftRight("Payment", data.payment_method_label);
    }

    if (data.cash_received != null) {
        leftRight("Cash Received", data.money(data.cash_received));
    }

    if (data.change > 0) {
        leftRight("Change", data.money(data.change));
    }

    if (data.note) {
        bytes.push(...textBytes(`Note: ${data.note.slice(0, width * 2)}\n`));
    }

    line();
    center(data.footer || "Thank you for your purchase!");
    bytes.push(...textBytes("\n\n"));

    // Cut: GS V 66 0
    bytes.push(GS, 0x56, 0x42, 0x00);

    return new Uint8Array(bytes);
}

function drawerKickBytes(pin = 2) {
    // ESC p m t1 t2 — activate cash drawer pin 2 with an approximately 50ms pulse
    return new Uint8Array([ESC, 0x70, pin === 5 ? 0x01 : 0x00, 0x19, 0xfa]);
}

export async function requestPrinter() {
    if (!navigator.usb) {
        throw new Error("WebUSB is not supported in this browser. Use Chrome or Edge.");
    }

    const device = await navigator.usb.requestDevice({
        filters: [],
    });

    await device.open();

    if (device.configuration === null) {
        await device.selectConfiguration(1);
    }

    // Find the first printer-class interface and its OUT endpoint
    let interfaceNumber = null;
    let endpointNumber = null;

    for (const config of device.configurations) {
        for (const iface of config.interfaces) {
            for (const alt of iface.alternates) {
                if (alt.interfaceClass === 7) {
                    // USB printer class
                    interfaceNumber = iface.interfaceNumber;
                    endpointNumber =
                        alt.endpoints.find((e) => e.direction === "out")
                            ?.endpointNumber ?? null;
                }
            }
        }
    }

    if (interfaceNumber === null) {
        // Some clones do not expose USB printer class 7; use the first interface with an OUT endpoint
        for (const config of device.configurations) {
            for (const iface of config.interfaces) {
                for (const alt of iface.alternates) {
                    const out = alt.endpoints.find(
                        (e) => e.direction === "out",
                    );

                    if (out && interfaceNumber === null) {
                        interfaceNumber = iface.interfaceNumber;
                        endpointNumber = out.endpointNumber;
                    }
                }
            }
        }
    }

    if (interfaceNumber === null) {
        await device.close();
        throw new Error("No printer interface was found on this device.");
    }

    await device.claimInterface(interfaceNumber);

    device._endpoint = endpointNumber;
    getPrinter.cached = device;

    return device;
}

async function getPrinter() {
    if (getPrinter.cached && getPrinter.cached.opened) {
        return getPrinter.cached;
    }

    // Reconnect to a previously authorized device
    if (!navigator.usb) {
        throw new Error("WebUSB is not supported in this browser.");
    }

    const devices = await navigator.usb.getDevices();

    if (devices.length === 0) return null;

    const device = devices[0];

    await device.open();

    if (device.configuration === null) {
        await device.selectConfiguration(1);
    }

    let interfaceNumber = null;
    let endpointNumber = null;

    for (const iface of device.configuration.interfaces) {
        for (const alt of iface.alternates) {
            const out = alt.endpoints.find((e) => e.direction === "out");

            if (out) {
                interfaceNumber = iface.interfaceNumber;
                endpointNumber = out.endpointNumber;
                break;
            }
        }

        if (interfaceNumber !== null) break;
    }

    if (interfaceNumber === null) {
        await device.close();
        throw new Error("No printer interface was found.");
    }

    await device.claimInterface(interfaceNumber);

    device._endpoint = endpointNumber;
    getPrinter.cached = device;

    return device;
}

export async function printBytes(bytes) {
    const device = await getPrinter();

    if (!device) {
        throw new Error("No printer is connected.");
    }

    await device.transferOut(device._endpoint ?? 1, bytes);
}

export async function printReceipt(data, paperSize) {
    await printBytes(buildReceiptBytes(data, paperSize));
}

export async function kickDrawer() {
    await printBytes(drawerKickBytes());
}

export async function disconnectPrinter() {
    if (getPrinter.cached) {
        try {
            await getPrinter.cached.close();
        } finally {
            getPrinter.cached = undefined;
        }
    }
}

export function hasCachedPrinter() {
    return Boolean(getPrinter.cached?.opened);
}

export { buildReceiptBytes, drawerKickBytes };