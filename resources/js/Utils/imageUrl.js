/**
 * Builds image URLs for local Laravel storage or the Supabase public bucket.
 * VITE_PUBLIC_STORAGE_URL must be the public URL prefix ending in /<bucket>.
 */
const publicStorageBase = (import.meta.env.VITE_PUBLIC_STORAGE_URL || "").replace(/\/+$/, "");

export function getImageUrl(image, folder = "products") {
    if (!image) return null;

    let value = String(image).trim();
    let query = "";

    if (/^(https?:\/\/|blob:|data:)/i.test(value)) {
        try {
            const parsed = new URL(value);
            const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(
                parsed.hostname.toLowerCase()
            );

            if (
                !isLocalHost ||
                !/^\/(?:public\/)?storage\/(products|category|store)\//i.test(
                    parsed.pathname
                )
            ) {
                return value;
            }

            value = parsed.pathname;
            query = parsed.search;
        } catch {
            return value;
        }
    }

    // Accept both stored filenames/paths and legacy /storage/... paths.
    let objectPath = value
        .replace(/\\/g, "/")
        .replace(/^\/?(?:public\/)?storage\//i, "")
        .replace(/^\/+/, "");
    if (folder && objectPath !== folder && !objectPath.startsWith(folder + "/")) {
        objectPath = folder + "/" + objectPath;
    }

    if (publicStorageBase) return publicStorageBase + "/" + objectPath + query;
    return "/storage/" + objectPath + query;
}

export function getStorageUrl(path) {
    return getImageUrl(path, "");
}

export function getProductImageUrl(image, { thumbnail = false } = {}) {
    const url = getImageUrl(image, "products");
    if (!thumbnail || !url || !url.startsWith("/storage/products/")) {
        return url;
    }

    return `${url}${url.includes("?") ? "&" : "?"}size=pos`;
}
