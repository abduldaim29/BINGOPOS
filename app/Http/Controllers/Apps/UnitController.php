<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index()
    {
        $units = Unit::withCount('products')->orderBy('code')->get();

        return Inertia::render('Dashboard/Settings/Units', [
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'unique:units,code'],
            'name' => ['required', 'string', 'max:50'],
            'symbol' => ['required', 'string', 'max:10'],
        ]);

        Unit::create($validated);

        return back()->with('success', 'Unit added successfully.');
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', Rule::unique('units', 'code')->ignore($unit->id)],
            'name' => ['required', 'string', 'max:50'],
            'symbol' => ['required', 'string', 'max:10'],
        ]);

        $unit->update($validated);

        return back()->with('success', 'Unit updated successfully.');
    }

    public function destroy(Unit $unit)
    {
        if ($unit->products()->exists()) {
            return back()->with('error', 'This unit is currently used by products. Remove it from the products first.');
        }

        $unit->delete();

        return back()->with('success', 'Unit deleted successfully.');
    }
}