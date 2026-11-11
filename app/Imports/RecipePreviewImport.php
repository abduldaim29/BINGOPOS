<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class RecipePreviewImport implements ToCollection, WithHeadingRow
{
    private ?Collection $rows = null;

    public function collection(Collection $collection): void
    {
        $this->rows = $collection;
    }

    public function rows(): Collection
    {
        return $this->rows ?? collect();
    }
}
