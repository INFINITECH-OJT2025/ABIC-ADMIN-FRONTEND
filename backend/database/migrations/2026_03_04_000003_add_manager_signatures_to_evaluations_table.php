<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->string('rated_by')->nullable()->after('signature_1');
            $table->string('reviewed_by')->nullable()->after('rated_by');
            $table->string('approved_by')->nullable()->after('reviewed_by');
            
            $table->string('rated_by_2')->nullable()->after('signature_2');
            $table->string('reviewed_by_2')->nullable()->after('rated_by_2');
            $table->string('approved_by_2')->nullable()->after('reviewed_by_2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn([
                'rated_by',
                'reviewed_by',
                'approved_by',
                'rated_by_2',
                'reviewed_by_2',
                'approved_by_2'
            ]);
        });
    }
};
