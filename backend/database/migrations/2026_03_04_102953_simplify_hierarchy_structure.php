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
        // 1. Add columns to hierarchies
        Schema::table('hierarchies', function (Blueprint $table) {
            $table->string('name')->after('id')->nullable();
            $table->boolean('is_custom')->default(false)->after('name');
        });

        // 2. Transfer data
        $positions = DB::table('positions')->get();
        foreach ($positions as $pos) {
            DB::table('hierarchies')
                ->where('position_id', $pos->id)
                ->update([
                    'name' => $pos->name,
                    'is_custom' => $pos->is_custom
                ]);
        }

        // 3. Handle hierarchies without positions (just in case)
        DB::table('hierarchies')->whereNull('name')->update(['name' => 'Unknown Position']);

        // 4. Drop the foreign key and column
        Schema::table('hierarchies', function (Blueprint $table) {
            $table->dropForeign(['position_id']);
            $table->dropColumn('position_id');
        });

        // 5. Drop the positions table
        Schema::dropIfExists('positions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_custom')->default(false);
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::table('hierarchies', function (Blueprint $table) {
            $table->unsignedBigInteger('position_id')->nullable()->after('id');
        });

        // Transfer back
        $hierarchies = DB::table('hierarchies')->get();
        foreach ($hierarchies as $h) {
            $posId = DB::table('positions')->insertGetId([
                'name' => $h->name,
                'is_custom' => $h->is_custom,
                'department_id' => $h->department_id,
                'created_at' => $h->created_at,
                'updated_at' => $h->updated_at
            ]);
            DB::table('hierarchies')->where('id', $h->id)->update(['position_id' => $posId]);
        }

        Schema::table('hierarchies', function (Blueprint $table) {
            $table->foreign('position_id')->references('id')->on('positions')->onDelete('cascade');
            $table->dropColumn(['name', 'is_custom']);
        });
    }
};
