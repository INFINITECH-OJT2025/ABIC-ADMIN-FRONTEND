<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('office_supply_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('office_supply_items')->onDelete('cascade');
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->unsignedInteger('beginning_balance')->default(0);
            $table->unsignedInteger('quantity_in')->default(0);
            $table->unsignedInteger('quantity_out')->default(0);
            $table->unsignedInteger('current_balance')->default(0);
            $table->unsignedInteger('balance_auto')->default(0)->comment('Monthly opening balance snapshot at transaction time.');
            $table->text('issued_log')->nullable()->comment('Purpose / note for inventory movement.');
            $table->string('requested_by_employee_id');
            $table->foreign('requested_by_employee_id', 'office_supply_transactions_requested_by_fk')
                ->references('id')
                ->on('employees')
                ->onDelete('restrict')
                ->onUpdate('cascade');
            $table->timestamp('transaction_at')->useCurrent();
            $table->timestamps();

            $table->index(['item_id', 'transaction_at'], 'office_supply_transactions_item_date_idx');
            $table->index(['department_id', 'transaction_at'], 'office_supply_transactions_department_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_supply_transactions');
    }
};
