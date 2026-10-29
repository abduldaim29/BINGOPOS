import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import Button from "@/Components/Dashboard/Button";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";
import InputSelect from "@/Components/Dashboard/InputSelect";
import toast from "react-hot-toast";
import {
    IconPackage,
    IconDeviceFloppy,
    IconArrowLeft,
    IconPhoto,
    IconBarcode,
    IconCurrencyDollar,
    IconTrash,
    IconPackages,
    IconRulerMeasure,
} from "@tabler/icons-react";
import { formatCurrency } from "@/Utils/currency";

export default function Create({
    categories,
    productTypes = [],
    products,
    units = [],
}) {
    const { errors } = usePage().props;

    const { data, setData, post, processing, transform } = useForm({
        image: "",
        barcode: "",
        sku: "",
        title: "",
        category_id: "",
        product_type_id: "",
        sub_category_id: "",
        description: "",
        buy_price: "",
        sell_price: "",
        stock: "",
        min_stock: "",
        max_stock: "",
        tax_type: "exclusive",
        tax_rate: "18",
        is_composite: false,
        components: [],
        units: [],
        variations: [],
        variation_prices: {},
    });

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedProductType, setSelectedProductType] = useState(null);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [selectedVariationTemplate, setSelectedVariationTemplate] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [hasVariations, setHasVariations] = useState(false);
    const [selectedVariations, setSelectedVariations] = useState([]);
    const [availableVariations, setAvailableVariations] = useState({});

    const variationTemplateFor = (value) => {
        const name = value?.name?.toLowerCase() || "";
        if (name.includes("pizza")) return "pizza";
        if (name.includes("soft drink") || name.includes("soft_drink")) return "soft_drinks";
        if (name.includes("hard drink") || name.includes("hard_drink")) return "hard_drinks";
        if (name.includes("hot drink") || name.includes("hot_drink")) return "hot_drinks";
        if (name.includes("nugget")) return "nuggets";
        if (name.includes("hotshot")) return "hotshots";
        if (name.includes("wing")) return "wings";
        if (name.includes("burger")) return "burgers";
        if (name.includes("fries") || name.includes("fry")) return "fries";
        return null;
    };

    const enableVariations = (template) => {
        setSelectedVariationTemplate(template);
        setSelectedVariations([]);
        setData("variation_prices", {});
        setHasVariations(Boolean(template));
        setAvailableVariations(template ? { [template]: variationOptions[template] } : {});
    };

    // Universal variation options for different product types
    const variationOptions = {
        pizza: [
            { id: 'pizza_small', name: 'Small', size: '6-7 inch', price_multiplier: 1 },
            { id: 'pizza_regular', name: 'Regular', size: '9-10 inch', price_multiplier: 1.5 },
            { id: 'pizza_large', name: 'Large', size: '12-13 inch', price_multiplier: 2 },
            { id: 'pizza_xl', name: 'XL', size: '14-15 inch', price_multiplier: 2.5 },
            { id: 'pizza_jumbo', name: 'Jumbo', size: '16-18 inch', price_multiplier: 3 },
        ],
        soft_drinks: [
            { id: 'soft_250ml', name: '250ml', size: 'Milliliter', price_multiplier: 1 },
            { id: 'soft_330ml', name: '330ml', size: 'Milliliter', price_multiplier: 1.32 },
            { id: 'soft_500ml_bottle', name: '500ml Bottle', size: 'Bottle', price_multiplier: 2 },
            { id: 'soft_1l_bottle', name: '1L Bottle', size: 'Bottle', price_multiplier: 4 },
            { id: 'soft_1.5l_bottle', name: '1.5L Bottle', size: 'Bottle', price_multiplier: 6 },
            { id: 'soft_2l_bottle', name: '2L Bottle', size: 'Bottle', price_multiplier: 8 },
            { id: 'soft_250ml_can', name: '250ml Can', size: 'Can', price_multiplier: 1 },
            { id: 'soft_330ml_can', name: '330ml Can', size: 'Can', price_multiplier: 1.32 },
            { id: 'soft_200ml_glass', name: '200ml Glass', size: 'Glass', price_multiplier: 0.8 },
            { id: 'soft_250ml_glass', name: '250ml Glass', size: 'Glass', price_multiplier: 1 },
        ],
        hard_drinks: [
            { id: 'hard_25ml', name: '25ml', size: 'Milliliter', price_multiplier: 1 },
            { id: 'hard_30ml_shot', name: '30ml Shot', size: 'Shot', price_multiplier: 1.2 },
            { id: 'hard_45ml_shot', name: '45ml Shot', size: 'Shot', price_multiplier: 1.8 },
            { id: 'hard_60ml_double', name: '60ml Double', size: 'Double Shot', price_multiplier: 2.4 },
            { id: 'hard_90ml_double', name: '90ml Double', size: 'Double Shot', price_multiplier: 3.6 },
            { id: 'hard_375ml_bottle', name: '375ml Bottle', size: 'Bottle', price_multiplier: 15 },
            { id: 'hard_500ml_bottle', name: '500ml Bottle', size: 'Bottle', price_multiplier: 20 },
            { id: 'hard_700ml_bottle', name: '700ml Bottle', size: 'Bottle', price_multiplier: 28 },
            { id: 'hard_750ml_bottle', name: '750ml Bottle', size: 'Bottle', price_multiplier: 30 },
            { id: 'hard_1l_liter', name: '1L Liter', size: 'Liter', price_multiplier: 40 },
        ],
        hot_drinks: [
            { id: 'hot_150ml_cup', name: '150ml Cup', size: 'Small Cup', price_multiplier: 1 },
            { id: 'hot_200ml_cup', name: '200ml Cup', size: 'Regular Cup', price_multiplier: 1.33 },
            { id: 'hot_250ml_cup', name: '250ml Cup', size: 'Large Cup', price_multiplier: 1.67 },
            { id: 'hot_300ml_mug', name: '300ml Mug', size: 'Small Mug', price_multiplier: 2 },
            { id: 'hot_350ml_mug', name: '350ml Mug', size: 'Large Mug', price_multiplier: 2.33 },
            { id: 'hot_30ml_espresso', name: '30ml Espresso', size: 'Espresso Cup', price_multiplier: 0.2 },
            { id: 'hot_60ml_double', name: '60ml Double', size: 'Double Espresso', price_multiplier: 0.4 },
            { id: 'hot_500ml_pot', name: '500ml Pot', size: 'Tea Pot', price_multiplier: 3.33 },
            { id: 'hot_500ml_coffee_pot', name: '500ml Pot', size: 'Coffee Pot', price_multiplier: 3.33 },
            { id: 'hot_1l_jug', name: '1L Jug', size: 'Jug', price_multiplier: 6.67 },
        ],
        nuggets: [
            { id: 'nuggets_small', name: 'Small', size: '6 pcs', price_multiplier: 1 },
            { id: 'nuggets_regular', name: 'Regular', size: '10 pcs', price_multiplier: 1.67 },
            { id: 'nuggets_large', name: 'Large', size: '20 pcs', price_multiplier: 3.33 },
            { id: 'nuggets_jumbo', name: 'Jumbo', size: '30 pcs', price_multiplier: 5 },
        ],
        hotshots: [
            { id: 'hotshots_small', name: 'Small', size: '4 pcs', price_multiplier: 1 },
            { id: 'hotshots_regular', name: 'Regular', size: '8 pcs', price_multiplier: 2 },
            { id: 'hotshots_large', name: 'Large', size: '12 pcs', price_multiplier: 3 },
            { id: 'hotshots_jumbo', name: 'Jumbo', size: '16 pcs', price_multiplier: 4 },
        ],
        wings: [
            { id: 'wings_small', name: 'Small', size: '4 pcs', price_multiplier: 1 },
            { id: 'wings_regular', name: 'Regular', size: '8 pcs', price_multiplier: 2 },
            { id: 'wings_large', name: 'Large', size: '12 pcs', price_multiplier: 3 },
            { id: 'wings_bucket', name: 'Bucket', size: '20 pcs', price_multiplier: 5 },
        ],
        burgers: [
            { id: 'burgers_single', name: 'Single', size: '1 burger', price_multiplier: 1 },
            { id: 'burgers_double', name: 'Double', size: '2 burgers', price_multiplier: 2 },
            { id: 'burgers_triple', name: 'Triple', size: '3 burgers', price_multiplier: 3 },
            { id: 'burgers_family', name: 'Family', size: '4 burgers', price_multiplier: 4 },
        ],
        fries: [
            { id: 'fries_small', name: 'Small', size: 'Regular', price_multiplier: 1 },
            { id: 'fries_regular', name: 'Regular', size: 'Large', price_multiplier: 1.5 },
            { id: 'fries_large', name: 'Large', size: 'Extra Large', price_multiplier: 2 },
            { id: 'fries_family', name: 'Family', size: 'Party Size', price_multiplier: 3 },
        ],
        general: [
            { id: 'general_small', name: 'Small', size: '1x', price_multiplier: 1 },
            { id: 'general_regular', name: 'Regular', size: '2x', price_multiplier: 2 },
            { id: 'general_large', name: 'Large', size: '3x', price_multiplier: 3 },
        ],
    };

    // Handle category selection and load its subcategories.
    const setSelectedCategoryHandler = async (value) => {
        setSelectedCategory(value);
        setData("category_id", value?.id || "");
        setData("sub_category_id", "");
        setSelectedSubCategory(null);
        setSubCategories([]);
        setSelectedVariationTemplate(null);
        setData("variation_prices", {});

        // Auto-enable variations based on category, but don't auto-select
        const categoryName = value?.name?.toLowerCase() || '';

        if (categoryName === 'pizza' || categoryName.includes('pizza')) {
            setHasVariations(true);
            setSelectedVariations([]); // Let user manually select
            setAvailableVariations({ pizza: variationOptions.pizza });
        } else if (categoryName === 'drinks' || categoryName === 'drink' || categoryName.includes('drink')) {
            setHasVariations(true);
            setSelectedVariations([]); // Let user manually select
            setAvailableVariations({ soft_drinks: variationOptions.soft_drinks, hard_drinks: variationOptions.hard_drinks, hot_drinks: variationOptions.hot_drinks });
        } else if (categoryName === 'nuggets' || categoryName.includes('nugget')) {
            setHasVariations(true);
            setSelectedVariations([]); // Let user manually select
            setAvailableVariations({ nuggets: variationOptions.nuggets });
        } else if (categoryName === 'hotshots' || categoryName.includes('hotshot')) {
            setHasVariations(true);
            setSelectedVariations([]); // Let user manually select
            setAvailableVariations({ hotshots: variationOptions.hotshots });
        } else if (categoryName === 'wings' || categoryName.includes('wing')) {
            setHasVariations(true);
            setSelectedVariations([]); // Let user manually select
            setAvailableVariations({ wings: variationOptions.wings });
        } else if (categoryName === 'burgers' || categoryName.includes('burger')) {
            setHasVariations(true);
            setSelectedVariations([]); // Let user manually select
            setAvailableVariations({ burgers: variationOptions.burgers });
        } else if (categoryName === 'fries' || categoryName.includes('fries')) {
            setHasVariations(true);
            setSelectedVariations([]); // Let user manually select
            setAvailableVariations({ fries: variationOptions.fries });
        } else {
            setHasVariations(false);
            setSelectedVariations([]);
            setAvailableVariations({});
        }

        if (value?.id) {
            try {
                const response = await fetch(
                    `/dashboard/categories/${value.id}/sub-categories`,
                    {
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to load subcategories");
                }

                const result = await response.json();
                setSubCategories(Array.isArray(result) ? result : []);
            } catch (error) {
                console.error("Failed to load subcategories:", error);
                setSubCategories([]);
                toast.error("Failed to load subcategories");
            }
        }
    };

    // Generate a barcode if the user leaves the field empty.
    const generateBarcode = () => {
        const timestamp = String(Date.now()).slice(-10);
        const randomPart = String(Math.floor(Math.random() * 10000))
            .padStart(4, "0");

        return `20${timestamp}${randomPart}`;
    };

    // Generate an SKU if the user leaves the field empty.
    const generateSku = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomPart = Math.random()
            .toString(36)
            .slice(2, 7)
            .toUpperCase();

        return `SKU-${timestamp}-${randomPart}`;
    };

    const setSelectedProductTypeHandler = (value) => {
        setSelectedProductType(value);
        setData("product_type_id", value?.id || "");
        const template = variationTemplateFor(value);
        if (template) enableVariations(template);
    };

    const toggleComposite = (checked) => {
        setData("is_composite", checked);

        if (checked) {
            setData("units", []);
        }
    };

    const addUnitRow = () => {
        const firstUnused = units.find(
            (u) => !data.units.some((row) => row.unit_id === u.id)
        );

        if (!firstUnused) return;

        setData("units", [
            ...data.units,
            {
                unit_id: firstUnused.id,
                is_base: data.units.length === 0,
                conversion_factor: data.units.length === 0 ? 1 : "",
                sell_price: "",
                barcode: "",
            },
        ]);
    };

    const updateUnitRow = (index, field, value) => {
        const rows = data.units.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        );

        if (field === "is_base" && value) {
            rows.forEach((row, i) => {
                if (i !== index) {
                    row.is_base = false;
                }
            });
        }

        setData("units", rows);
    };

    const removeUnitRow = (index) => {
        setData(
            "units",
            data.units.filter((_, i) => i !== index)
        );
    };

    const availableUnits = (selectedIndex) =>
        units.filter(
            (unit) =>
                !data.units.some(
                    (row, i) =>
                        i !== selectedIndex && row.unit_id === unit.id
                )
        );

    const addComponent = () => {
        setData("components", [
            ...data.components,
            { component_product_id: "", qty: 1 },
        ]);
    };

    const updateComponent = (index, field, value) => {
        const components = data.components.map((component, i) =>
            i === index
                ? { ...component, [field]: value }
                : component
        );

        setData("components", components);
    };

    const removeComponent = (index) => {
        setData(
            "components",
            data.components.filter((_, i) => i !== index)
        );
    };

    const availableProducts = (selectedIndex) =>
        products.filter(
            (product) =>
                !product.is_composite &&
                !data.components.some(
                    (component, i) =>
                        i !== selectedIndex &&
                        component.component_product_id === product.id
                )
        );

    const estimatedSellPrice = data.is_composite
        ? data.components.reduce((total, component) => {
              const product = products.find(
                  (item) =>
                      item.id === Number(component.component_product_id)
              );

              return product
                  ? total +
                        product.sell_price * (Number(component.qty) || 0)
                  : total;
          }, 0)
        : data.sell_price;

    // Update one variation price without losing prices entered for other variations.
    const updateVariationPrice = (variationId, value) => {
        setData("variation_prices", {
            ...(data.variation_prices || {}),
            [variationId]: value,
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            setData("image", file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Save product and prepare automatic SKU/barcode values.
    const submitCompositeAware = (e) => {
        e.preventDefault();

        if (data.is_composite) {
            setData("sell_price", 0);
            setData("stock", 0);
        }

        // Include selected variations and their prices in the form data
        if (hasVariations && selectedVariations.length > 0) {
            setData("variations", selectedVariations);
            setData("variation_prices", data.variation_prices || {});
        }

        // Normal single product creation
        transform((formData) => ({
            ...formData,

            sell_price: formData.is_composite
                ? 0
                : formData.sell_price,

            stock: formData.is_composite
                ? 0
                : formData.stock,

            // Preserve manually entered barcode; generate one if blank.
            barcode:
                String(formData.barcode || "").trim() ||
                generateBarcode(),

            // Preserve manually entered SKU; generate one if blank.
            sku:
                String(formData.sku || "").trim() ||
                generateSku(),

            // Generate barcodes for unit rows when they are left blank.
            units: (formData.units || []).map((unit) => ({
                ...unit,
                barcode:
                    String(unit.barcode || "").trim() ||
                    generateBarcode(),
            })),

            variation_prices: Object.fromEntries(
                Object.entries(formData.variation_prices || {}).map(([variationId, price]) => [
                    variationId,
                    price === "" ? 0 : Number(price),
                ])
            ),
        }));

        post(route("products.store"), {
            onSuccess: () => toast.success("Product added successfully"),
            onError: () => toast.error("Failed to save product"),
        });
    };

    return (
        <>
            <Head title="Add Product" />

            {/* Header */}
            <div className="mb-6">
                <Link
                    href={route("products.index")}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-3"
                >
                    <IconArrowLeft size={16} />
                    Back to Products
                </Link>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <IconPackage
                        size={28}
                        className="text-primary-500"
                    />
                    Add New Product
                </h1>
            </div>

            <form onSubmit={submitCompositeAware}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Image */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <IconPhoto size={18} />
                                Product Image
                            </h3>

                            <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-4">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center p-6">
                                        <IconPhoto
                                            size={48}
                                            className="mx-auto text-slate-400 mb-2"
                                        />
                                        <p className="text-sm text-slate-500">
                                            No image selected
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Input
                                type="file"
                                label="Upload Image"
                                onChange={handleImageChange}
                                errors={errors.image}
                                accept="image/*"
                            />
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <IconBarcode size={18} />
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <InputSelect
                                        label="Category"
                                        data={categories}
                                        selected={selectedCategory}
                                        setSelected={setSelectedCategoryHandler}
                                        placeholder="Select a category"
                                        errors={errors.category_id}
                                        searchable={true}
                                        displayKey="name"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <InputSelect
                                        label="Item"
                                        data={productTypes}
                                        selected={selectedProductType}
                                        setSelected={setSelectedProductTypeHandler}
                                        placeholder="Select an item (optional)"
                                        errors={errors.product_type_id}
                                        searchable={true}
                                        displayKey="name"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <InputSelect
                                        label="Subcategory"
                                        data={subCategories}
                                        selected={selectedSubCategory}
                                        setSelected={(value) => {
                                            setSelectedSubCategory(value);
                                            setData(
                                                "sub_category_id",
                                                value?.id || ""
                                            );

                                            // Auto-select variation template based on subcategory
                                            const subCategoryName = value?.name?.toLowerCase() || '';
                                            console.log('Selected subcategory:', subCategoryName); // Debug log

                                            const template = variationTemplateFor(value);
                                            if (template) {
                                                enableVariations(template);
                                            }
                                        }}
                                        placeholder="Select a subcategory (optional)"
                                        errors={errors.sub_category_id}
                                        searchable={true}
                                        displayKey="name"
                                        disabled={!selectedCategory}
                                    />
                                </div>

                                {/* Product Variations - Universal System */}
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                                        <input
                                            type="checkbox"
                                            checked={hasVariations}
                                            onChange={(e) => {
                                                setHasVariations(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedVariations([]);
                                                }
                                            }}
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            This product has variations (sizes, portions, etc.)
                                        </span>
                                    </label>

                                    {hasVariations && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Select Variations (these will be available in POS)
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {Object.entries(availableVariations).map(([category, variations]) => (
                                                    <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
                                                            {category.replace('_', ' ')}
                                                        </p>
                                                        {variations.map((variation) => (
                                                            <label
                                                                key={variation.id}
                                                                className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer mb-1"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedVariations.includes(variation.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedVariations([...selectedVariations, variation.id]);
                                                                        } else {
                                                                            setSelectedVariations(selectedVariations.filter(id => id !== variation.id));
                                                                        }
                                                                    }}
                                                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                                                                />
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                                        {variation.name}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {variation.size}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                Selected variations will be available in POS when adding this product to cart.
                                            </p>

                                            {/* Variation Pricing Section */}
                                            {selectedVariations.length > 0 && (
                                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                                        Variation Pricing
                                                    </label>
                                                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <table className="min-w-full text-sm">
                                                            <thead className="bg-white text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                                                                <tr>
                                                                    <th className="px-3 py-2">Variation</th>
                                                                    <th className="px-3 py-2">Size / Details</th>
                                                                    <th className="px-3 py-2">Price Label</th>
                                                                    <th className="px-3 py-2 text-right">Price (Rs)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                        {selectedVariations.map(variationId => {
                                                            // Find the variation details
                                                            let variation = null;
                                                            for (const [category, variations] of Object.entries(availableVariations)) {
                                                                const found = variations.find(v => v.id === variationId);
                                                                if (found) {
                                                                    variation = { ...found, category };
                                                                    break;
                                                                }
                                                            }
                                                            if (!variation) return null;

                                                            return (
                                                                <tr key={variationId}>
                                                                    <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">
                                                                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                                            {variation.name} ({variation.category.replace('_', ' ')})
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{variation.size}</td>
                                                                    <td className="px-3 py-3 text-xs font-medium text-primary-600 dark:text-primary-400">
                                                                        {selectedVariations[0] === variationId ? "Base Price" : "Variation Price"}
                                                                    </td>
                                                                    <td className="px-3 py-3 text-right">
                                                                    <input
                                                                        type="text"
                                                                        placeholder={selectedVariations[0] === variationId ? "Base price" : "Enter price"}
                                                                        className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                                                                        value={String(data.variation_prices?.[variationId] ?? "")}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*(\.\d{0,2})?$/.test(value)) {
                                                                                updateVariationPrice(variationId, value);
                                                                            }
                                                                        }}
                                                                        inputMode="decimal"
                                                                        autoComplete="off"
                                                                    />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Input
                                    type="text"
                                    label="Barcode (optional)"
                                    value={data.barcode}
                                    onChange={(e) =>
                                        setData("barcode", e.target.value)
                                    }
                                    errors={errors.barcode}
                                    placeholder="Leave blank to auto-generate on save"
                                />

                                <p className="text-xs text-slate-500 md:col-span-2 -mt-2">
                                    Barcode is optional. If left blank, one
                                    will be generated when you save the
                                    product.
                                </p>

                                <Input
                                    type="text"
                                    label="SKU (optional)"
                                    value={data.sku}
                                    onChange={(e) =>
                                        setData("sku", e.target.value)
                                    }
                                    errors={errors.sku}
                                    placeholder="Leave blank to auto-generate on save"
                                />

                                <p className="text-xs text-slate-500 md:col-span-2 -mt-2">
                                    SKU is optional. If left blank, one will
                                    be generated when you save the product.
                                </p>

                                <Input
                                    type="text"
                                    label="Product Name"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    errors={errors.title}
                                    placeholder="Enter product name"
                                />

                                <div className="md:col-span-2">
                                    <Textarea
                                        label="Description"
                                        placeholder="Product description (optional)"
                                        errors={errors.description}
                                        onChange={(e) =>
                                            setData(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        value={data.description}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Stock */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <IconCurrencyDollar size={18} />
                                Pricing & Stock
                            </h3>

                            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_composite}
                                    onChange={(e) =>
                                        toggleComposite(e.target.checked)
                                    }
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <IconPackages size={16} />
                                    Composite Product (bundle / package)
                                </span>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    type="number"
                                    label="Purchase Price"
                                    value={data.buy_price}
                                    onChange={(e) =>
                                        setData("buy_price", e.target.value)
                                    }
                                    errors={errors.buy_price}
                                    placeholder="0"
                                />

                                <Input
                                    type="number"
                                    label="Selling Price"
                                    value={
                                        data.is_composite
                                            ? ""
                                            : data.sell_price
                                    }
                                    disabled={data.is_composite}
                                    onChange={(e) =>
                                        setData("sell_price", e.target.value)
                                    }
                                    errors={errors.sell_price}
                                    placeholder={
                                        data.is_composite
                                            ? "Calculated from components"
                                            : "0"
                                    }
                                />

                                <Input
                                    type="number"
                                    label="Stock"
                                    value={
                                        data.is_composite ? "" : data.stock
                                    }
                                    disabled={data.is_composite}
                                    onChange={(e) =>
                                        setData("stock", e.target.value)
                                    }
                                    errors={errors.stock}
                                    placeholder={
                                        data.is_composite
                                            ? "Based on component stock"
                                            : "0"
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <Input
                                    type="number"
                                    label="Minimum Stock"
                                    value={data.min_stock}
                                    onChange={(e) =>
                                        setData("min_stock", e.target.value)
                                    }
                                    errors={errors.min_stock}
                                    placeholder="0"
                                />

                                <Input
                                    type="number"
                                    label="Maximum Stock"
                                    value={data.max_stock}
                                    onChange={(e) =>
                                        setData("max_stock", e.target.value)
                                    }
                                    errors={errors.max_stock}
                                    placeholder="0"
                                />

                                <p className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">
                                    Used for the reorder point: when stock
                                    reaches the minimum level, the system
                                    automatically creates a draft purchase
                                    order (daily reorder:generate command).
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tax Type
                                    </label>

                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="radio"
                                                name="tax_type"
                                                value="exclusive"
                                                checked={
                                                    data.tax_type ===
                                                    "exclusive"
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "tax_type",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            Exclusive
                                        </label>

                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="radio"
                                                name="tax_type"
                                                value="inclusive"
                                                checked={
                                                    data.tax_type ===
                                                    "inclusive"
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "tax_type",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            Inclusive
                                        </label>
                                    </div>

                                    {errors.tax_type && (
                                        <p className="text-xs text-danger-500 mt-1">
                                            {errors.tax_type}
                                        </p>
                                    )}
                                </div>

                                <Input
                                    type="number"
                                    label="Tax Rate (%)"
                                    value={data.tax_rate}
                                    onChange={(e) =>
                                        setData("tax_rate", e.target.value)
                                    }
                                    errors={errors.tax_rate}
                                    placeholder="11"
                                />
                            </div>

                            {/* Profit Estimation */}
                            {data.buy_price > 0 && data.sell_price > 0 && (
                                <div className="mt-4 p-4 rounded-xl bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-900">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-success-700 dark:text-success-400 font-medium">
                                                Estimated Profit per Item
                                            </p>
                                            <p className="text-2xl font-bold text-success-600 dark:text-success-500 mt-1">
                                                + Rs{" "}
                                                {(
                                                    data.sell_price -
                                                    data.buy_price
                                                ).toLocaleString("en-PK")}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-success-700 dark:text-success-400 font-medium">
                                                Margin
                                            </p>
                                            <p className="text-xl font-bold text-success-600 dark:text-success-500 mt-1">
                                                {(
                                                    ((data.sell_price -
                                                        data.buy_price) /
                                                        data.buy_price) *
                                                    100
                                                ).toFixed(1)}
                                                %
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Units */}
                        {!data.is_composite && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <IconRulerMeasure size={18} />
                                        Units
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={addUnitRow}
                                        disabled={
                                            data.units.length >= units.length
                                        }
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-40"
                                    >
                                        + Add Unit
                                    </button>
                                </div>

                                {errors.units && (
                                    <p className="text-sm text-danger-600 mb-2">
                                        {errors.units}
                                    </p>
                                )}

                                {data.units.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        A base unit will be created
                                        automatically if none is added. Add
                                        units (box, kg, etc.) to support
                                        multi-unit sales.
                                    </p>
                                )}

                                <div className="space-y-3">
                                    {data.units.map((row, index) => (
                                        <div
                                            key={index}
                                            className="flex items-end gap-3"
                                        >
                                            <div className="flex-1">
                                                <InputSelect
                                                    data={availableUnits(index)}
                                                    selected={
                                                        units.find(
                                                            (unit) =>
                                                                unit.id ===
                                                                row.unit_id
                                                        ) || null
                                                    }
                                                    setSelected={(value) =>
                                                        updateUnitRow(
                                                            index,
                                                            "unit_id",
                                                            value?.id ?? ""
                                                        )
                                                    }
                                                    placeholder="Select a unit"
                                                    errors={
                                                        errors[
                                                            `units.${index}.unit_id`
                                                        ]
                                                    }
                                                    searchable={true}
                                                    displayKey="code"
                                                />
                                            </div>

                                            <div className="w-36">
                                                <Input
                                                    type="number"
                                                    min="0.0001"
                                                    step="0.0001"
                                                    value={
                                                        row.conversion_factor
                                                    }
                                                    onChange={(e) =>
                                                        updateUnitRow(
                                                            index,
                                                            "conversion_factor",
                                                            e.target.value
                                                        )
                                                    }
                                                    errors={
                                                        errors[
                                                            `units.${index}.conversion_factor`
                                                        ]
                                                    }
                                                    placeholder="Conversion factor"
                                                    disabled={row.is_base}
                                                />
                                            </div>

                                            <div className="w-40">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={row.sell_price}
                                                    onChange={(e) =>
                                                        updateUnitRow(
                                                            index,
                                                            "sell_price",
                                                            e.target.value
                                                        )
                                                    }
                                                    errors={
                                                        errors[
                                                            `units.${index}.sell_price`
                                                        ]
                                                    }
                                                    placeholder="Selling price"
                                                />
                                            </div>

                                            <div className="w-44">
                                                <Input
                                                    type="text"
                                                    value={row.barcode}
                                                    onChange={(e) =>
                                                        updateUnitRow(
                                                            index,
                                                            "barcode",
                                                            e.target.value
                                                        )
                                                    }
                                                    errors={
                                                        errors[
                                                            `units.${index}.barcode`
                                                        ]
                                                    }
                                                    placeholder="Barcode (optional)"
                                                />
                                            </div>

                                            <label className="flex items-center gap-1 pb-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={row.is_base}
                                                    onChange={(e) =>
                                                        updateUnitRow(
                                                            index,
                                                            "is_base",
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                Base
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeUnitRow(index)
                                                }
                                                className="p-2.5 rounded-xl text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors"
                                            >
                                                <IconTrash size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Composite Components */}
                        {data.is_composite && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <IconPackages size={18} />
                                        Bundle Components
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={addComponent}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        + Add Component
                                    </button>
                                </div>

                                {errors.components && (
                                    <p className="text-sm text-danger-600 mb-2">
                                        {errors.components}
                                    </p>
                                )}

                                {data.components.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        No components added yet. Stock and
                                        selling price are calculated
                                        automatically from the components.
                                    </p>
                                )}

                                <div className="space-y-3">
                                    {data.components.map((component, index) => (
                                        <div
                                            key={index}
                                            className="flex items-end gap-3"
                                        >
                                            <div className="flex-1">
                                                <InputSelect
                                                    data={availableProducts(index)}
                                                    selected={
                                                        products.find(
                                                            (product) =>
                                                                product.id ===
                                                                Number(
                                                                    component.component_product_id
                                                                )
                                                        ) || null
                                                    }
                                                    setSelected={(value) =>
                                                        updateComponent(
                                                            index,
                                                            "component_product_id",
                                                            value?.id ?? ""
                                                        )
                                                    }
                                                    placeholder="Select a component product"
                                                    errors={
                                                        errors[
                                                            `components.${index}.component_product_id`
                                                        ]
                                                    }
                                                    searchable={true}
                                                    displayKey="title"
                                                />
                                            </div>

                                            <div className="w-28">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={component.qty}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            index,
                                                            "qty",
                                                            e.target.value
                                                        )
                                                    }
                                                    errors={
                                                        errors[
                                                            `components.${index}.qty`
                                                        ]
                                                    }
                                                    placeholder="Quantity"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeComponent(index)
                                                }
                                                className="p-2.5 rounded-xl text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors"
                                            >
                                                <IconTrash size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {data.is_composite &&
                                    estimatedSellPrice > 0 && (
                                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                            Estimated selling price from
                                            components:{" "}
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                Rs{" "}
                                                {estimatedSellPrice.toLocaleString(
                                                    "en-PK"
                                                )}
                                            </span>
                                        </p>
                                    )}
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex justify-end gap-3">
                            <Link
                                href={route("products.index")}
                                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                <IconDeviceFloppy size={18} />
                                {processing ? "Saving..." : "Save Product"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;