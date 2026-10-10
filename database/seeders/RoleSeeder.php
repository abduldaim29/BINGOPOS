<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    // Refactor the RoleSeeder to improve readability and avoid repetitive code
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->normalizeLegacyPermissionRole();

        $this->createRoleWithPermissions('users-access', '%users%');
        $this->createRoleWithPermissions('roles-access', '%roles%');
        $this->createRoleWithPermissions('permissions-access', '%permissions%');
        $this->createRoleWithPermissions('categories-access', '%categories%');
        $this->createRoleWithPermissions('products-access', '%products%');
        $this->createRoleWithPermissions('pricing-rules-access', '%pricing-rules%');
        $this->createRoleWithPermissions('customers-access', '%customers%');
        $this->createRoleWithPermissions('customer-vouchers-access', '%customer-vouchers%');
        $this->createRoleWithPermissions('customer-segments-access', '%customer-segments%');
        $this->createRoleWithPermissions('crm-campaigns-access', '%crm-campaigns%');
        $this->createRoleWithPermissions('crm-reminders-access', '%crm-reminders%');
        $this->createRoleWithPermissions('transactions-access', '%transactions%');
        $this->createRoleWithPermissions('transactions-confirm-payment', 'transactions-confirm-payment');
        $this->createRoleWithPermissions('receivables-access', '%receivables%');
        $this->createRoleWithPermissions('payables-access', '%payables%');
        $this->createRoleWithPermissions('suppliers-access', '%suppliers%');
        $this->createRoleWithPermissions('reports-access', '%reports%');
        $this->createRoleWithPermissions('profits-access', '%profits%');
        $this->createRoleWithPermissions('payment-settings-access', '%payment-settings%');
        $this->createRoleWithPermissions('payment-settings-update', 'payment-settings-update');
        $this->createRoleWithPermissions('stock-opnames-access', '%stock-opnames%');
        $this->createRoleWithPermissions('stock-mutations-access', '%stock-mutations%');
        $this->createRoleWithPermissions('sales-returns-access', '%sales-returns%');
        $this->createRoleWithPermissions('cashier-shifts-access', '%cashier-shifts%');
        $this->createRoleWithPermissions('audit-logs-access', '%audit-logs%');
        $this->createRoleWithPermissions('purchase-orders-access', '%purchase-orders%');
        $this->createRoleWithPermissions('goods-receivings-access', '%goods-receivings%');
        $this->createRoleWithPermissions('supplier-returns-access', '%supplier-returns%');
        $this->createRoleWithPermissions('stock-transfers-access', '%stock-transfers%');
        $this->createRoleWithPermissions('products-import', '%products-import%');
        $this->createRoleWithPermissions('products-export', '%products-export%');
        $this->createRoleWithPermissions('customers-import', '%customers-import%');
        $this->createRoleWithPermissions('customers-export', '%customers-export%');
        $this->createRoleWithPermissions('discounts-approve', 'discounts-approve');
        $this->createRoleWithPermissions('price-lists-access', '%price-lists%');
        $this->createRoleWithPermissions('warehouses-access', '%warehouses%');
        $this->createRoleWithPermissions('units-access', '%units%');

        $this->createRoleWithPermissions('dine-tables-access', '%dine-tables%');
        $this->createRoleWithPermissions('dine-orders-access', '%dine-orders%');

        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdminRole->syncPermissions(Permission::all());

        // Create cashier role with basic permissions for public registration
        $cashierRole = Role::firstOrCreate(['name' => 'cashier']);
        $cashierPermissions = Permission::whereIn('name', [
            'dashboard-access',
            'transactions-access',
            'cashier-shifts-access',
            'cashier-shifts-open',
            'cashier-shifts-close',
            'customers-access',
            'customers-create',
            'receivables-access',
            'receivables-pay',
            'payables-access',
            'payables-pay',
            'suppliers-access',
            'dine-orders-access',
            'dine-orders-process',
        ])->get();
        $cashierRole->syncPermissions($cashierPermissions);

        // Create administrator/manager role with management permissions
        $adminRole = Role::firstOrCreate(['name' => 'administrator']);
        $adminPermissions = Permission::whereIn('name', [
            'dashboard-access',
            'users-access',
            'roles-access',
            'permissions-access',
            'categories-access',
            'products-access',
            'pricing-rules-access',
            'customers-access',
            'customer-vouchers-access',
            'customer-segments-access',
            'crm-campaigns-access',
            'crm-reminders-access',
            'transactions-access',
            'transactions-confirm-payment',
            'receivables-access',
            'payables-access',
            'suppliers-access',
            'reports-access',
            'profits-access',
            'payment-settings-access',
            'stock-opnames-access',
            'stock-mutations-access',
            'sales-returns-access',
            'cashier-shifts-access',
            'audit-logs-access',
            'purchase-orders-access',
            'goods-receivings-access',
            'supplier-returns-access',
            'stock-transfers-access',
            'discounts-approve',
            'price-lists-access',
            'warehouses-access',
            'units-access',
            'dine-tables-access',
            'dine-orders-access',
        ])->get();
        $adminRole->syncPermissions($adminPermissions);

        // Create inventory manager role with inventory-specific permissions
        $inventoryManagerRole = Role::firstOrCreate(['name' => 'inventory-manager']);
        $inventoryPermissions = Permission::whereIn('name', [
            'dashboard-access',
            'categories-access',
            'products-access',
            'products-import',
            'products-export',
            'customers-access',
            'customers-import',
            'customers-export',
            'suppliers-access',
            'reports-access',
            'stock-opnames-access',
            'stock-mutations-access',
            'sales-returns-access',
            'audit-logs-access',
            'purchase-orders-access',
            'goods-receivings-access',
            'supplier-returns-access',
            'stock-transfers-access',
            'price-lists-access',
            'warehouses-access',
            'units-access',
        ])->get();
        $inventoryManagerRole->syncPermissions($inventoryPermissions);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function normalizeLegacyPermissionRole(): void
    {
        $legacyRole = Role::where('name', 'permission-access')->first();

        if (! $legacyRole) {
            return;
        }

        $finalRole = Role::firstOrCreate([
            'name' => 'permissions-access',
            'guard_name' => $legacyRole->guard_name,
        ]);

        if (DB::getSchemaBuilder()->hasTable('model_has_roles')) {
            DB::table('model_has_roles')
                ->where('role_id', $legacyRole->id)
                ->update(['role_id' => $finalRole->id]);
        }

        if (DB::getSchemaBuilder()->hasTable('role_has_permissions')) {
            DB::table('role_has_permissions')
                ->where('role_id', $legacyRole->id)
                ->update(['role_id' => $finalRole->id]);
        }

        $legacyRole->delete();
    }

    private function createRoleWithPermissions($roleName, $permissionNamePattern)
    {
        $permissions = Permission::where('name', 'like', $permissionNamePattern)->get();
        $role = Role::firstOrCreate(['name' => $roleName]);
        $role->syncPermissions($permissions);
    }
}
