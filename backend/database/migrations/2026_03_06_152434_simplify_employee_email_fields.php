<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Copy email_address to email if email is empty (just in case)
        DB::table('employees')->whereNull('email')->orWhere('email', '')->update([
            'email' => DB::raw('email_address')
        ]);

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('email_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('email_address')->nullable();
        });
    }
};
