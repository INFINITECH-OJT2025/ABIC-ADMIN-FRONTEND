<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('office_supply_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('code_sequence')->unique()->comment('Numeric sequence used to build item codes like OS-001.');
            $table->string('item_code', 20)->unique()->comment('Display code, e.g. OS-001.');
            $table->string('item_name', 150);
            $table->string('category', 100);
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->unsignedInteger('current_balance')->default(0);
            $table->timestamps();

            $table->index(['department_id', 'category'], 'office_supply_items_department_category_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_supply_items');
    }
};
