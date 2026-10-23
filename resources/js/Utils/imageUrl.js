/**
 * Builds image URLs for local Laravel storage or the Supabase public bucket.
 * VITE_PUBLIC_STORAGE_URL must be the public URL prefix ending in /<bucket>.
 */
const publicStorageBase = (import.meta.env.VITE_PUBLIC_STORAGE_URL || "").replace(/\/+$/, "");

export function getImageUrl(image, folder = "products") {
    if (!image) return null;

    const value = String(image).trim();
    if (/^(https?:\/\/|blob:|data:)/i.test(value)) return value;

    // Accept both stored filenames/paths and legacy /storage/... paths.
    let objectPath = value.replace(/^\/?storage\//i, "").replace(/^\/+/, "");
    if (folder && objectPath !== folder && !objectPath.startsWith(folder + "/")) {
        objectPath = folder + "/" + objectPath;
    }

    if (publicStorageBase) return publicStorageBase + "/" + objectPath;
    return "/storage/" + objectPath;
}

export function getStorageUrl(path) {
    return getImageUrl(path, "");
}

export function getProductImageUrl(image) {
    return getImageUrl(image, "products");
}
