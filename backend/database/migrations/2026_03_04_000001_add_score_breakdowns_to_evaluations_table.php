<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->json('score_1_breakdown')->nullable()->after('score_1');
            $table->json('score_2_breakdown')->nullable()->after('score_2');
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn(['score_1_breakdown', 'score_2_breakdown']);
        });
    }
};
