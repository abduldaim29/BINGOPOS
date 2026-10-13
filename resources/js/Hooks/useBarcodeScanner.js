import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useBarcodeScanner - Hook for handling barcode scanner input
 *
 * Barcode scanners typically type characters rapidly followed by Enter.
 * This hook detects that pattern and triggers a callback.
 *
 * @param {function} onScan - Callback when barcode is scanned
 * @param {object} options - Configuration options
 * @param {number} options.minLength - Minimum barcode length (default: 3)
 * @param {number} options.maxDelay - Maximum delay between keystrokes in ms (default: 50)
 * @param {boolean} options.enabled - Enable or disable scanner (default: true)
 * @param {string[]} options.ignoreInputs - Input types to ignore
 *
 * @returns {object} { lastBarcode, isScanning, reset }
 */
export default function useBarcodeScanner(onScan, options = {}) {
    const {
        minLength = 3,
        maxDelay = 50,
        enabled = true,
        ignoreInputs = ["text", "number", "search", "password"],
    } = options;

    const [lastBarcode, setLastBarcode] = useState("");
    const [isScanning, setIsScanning] = useState(false);

    const bufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);
    const timeoutRef = useRef(null);

    const reset = useCallback(() => {
        bufferRef.current = "";
        setIsScanning(false);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleKeyDown = useCallback(
        (e) => {
            if (!enabled) return;

            // Ignore input fields where the user is typing
            const activeElement = document.activeElement;

            if (activeElement) {
                const tagName = activeElement.tagName.toLowerCase();
                const inputType = activeElement
                    .getAttribute("type")
                    ?.toLowerCase();

                if (tagName === "textarea") return;

                if (
                    tagName === "input" &&
                    ignoreInputs.includes(inputType || "text")
                ) {
                    return;
                }

                if (activeElement.isContentEditable) return;
            }

            const now = Date.now();
            const timeSinceLastKey = now - lastKeyTimeRef.current;

            // Reset the buffer if too much time has passed
            if (
                timeSinceLastKey > maxDelay &&
                bufferRef.current.length > 0
            ) {
                bufferRef.current = "";
                setIsScanning(false);
            }

            lastKeyTimeRef.current = now;

            // Enter marks the end of a barcode scan
            if (e.key === "Enter") {
                if (bufferRef.current.length >= minLength) {
                    const barcode = bufferRef.current;

                    setLastBarcode(barcode);
                    setIsScanning(false);
                    onScan?.(barcode);
                }

                bufferRef.current = "";

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }

                return;
            }

            // Accept alphanumeric characters and common barcode characters
            if (
                e.key.length === 1 &&
                /^[a-zA-Z0-9\-_.]$/.test(e.key)
            ) {
                bufferRef.current += e.key;
                setIsScanning(true);

                // Restart the timeout after every character
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    bufferRef.current = "";
                    setIsScanning(false);
                    timeoutRef.current = null;
                }, maxDelay * 3);
            }
        },
        [enabled, minLength, maxDelay, ignoreInputs, onScan]
    );

    useEffect(() => {
        if (!enabled) {
            bufferRef.current = "";
            setIsScanning(false);
            return;
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [enabled, handleKeyDown]);

    return {
        lastBarcode,
        isScanning,
        reset,
    };
}

/**
 * Usage example:
 *
 * function MyComponent() {
 *     const { lastBarcode, isScanning } = useBarcodeScanner((barcode) => {
 *         console.log("Scanned:", barcode);
 *         // Find product by barcode and add it to the cart
 *     });
 *
 *     return (
 *         <div>
 *             {isScanning && <span>Scanning...</span>}
 *             {lastBarcode && <span>Last: {lastBarcode}</span>}
 *         </div>
 *     );
 * }
 */