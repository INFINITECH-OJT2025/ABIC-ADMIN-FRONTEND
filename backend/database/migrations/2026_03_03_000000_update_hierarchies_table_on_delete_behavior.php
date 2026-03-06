<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('hierarchies', function (Blueprint $table) {
            // Drop current foreign key
            $table->dropForeign(['parent_id']);
            
            // Re-add with 'set null'
            $table->foreign('parent_id')
                ->references('id')
                ->on('hierarchies')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('hierarchies', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->foreign('parent_id')
                ->references('id')
                ->on('hierarchies')
                ->onDelete('cascade');
        });
    }
};
