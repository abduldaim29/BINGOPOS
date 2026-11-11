<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class RecipeTemplateExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
            'record_type',
            'recipe_name',
            'finished_product',
            'variation_id',
            'variation_name',
            'recipe_type',
            'batch_yield',
            'yield_unit',
            'packaging_cost',
            'labour_cost',
            'overhead_cost',
            'notes',
            'status',
            'ingredient_name',
            'ingredient_quantity',
            'ingredient_unit',
            'wastage_percent',
            'purchase_price',
            'step_title',
            'instructions',
            'duration_minutes',
            'temperature',
            'temperature_unit',
            'equipment',
        ];
    }

    public function array(): array
    {
        return [];
    }
}
