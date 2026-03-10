<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('office_supply_monthly_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('office_supply_items')->onDelete('cascade');
            $table->date('month_start')->comment('First day of month (YYYY-MM-01).');
            $table->unsignedInteger('opening_balance')->default(0)->comment('Balance (Auto): starting quantity for the month.');
            $table->unsignedInteger('closing_balance')->default(0);
            $table->timestamps();

            $table->unique(['item_id', 'month_start'], 'office_supply_monthly_balances_item_month_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_supply_monthly_balances');
    }
};
