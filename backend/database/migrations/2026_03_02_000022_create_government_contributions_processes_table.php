<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('government_contributions_processes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->nullable()->constrained('agencies')->onDelete('set null');
            $table->string('government_contribution_type')->comment('Type: SSS, PhilHealth, Pag-IBIG, etc.');
            $table->string('process_type');
            $table->text('process');
            $table->integer('step_number');
            $table->timestamps();
            $table->index(['agency_id', 'process_type', 'step_number'], 'gcp_agency_process_step_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('government_contributions_processes');
    }
};
