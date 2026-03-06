<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('email')->unique();
            $table->enum('status', ['pending', 'employed', 'terminated', 'resigned', 'rehire_pending', 'rehired_employee', 'termination_pending', 'resignation_pending'])->default('pending');
            $table->string('position')->nullable();
            $table->string('department')->nullable();
            $table->date('onboarding_date')->nullable();
            $table->string('access_level')->nullable();
            $table->text('equipment_issued')->nullable();
            $table->boolean('training_completed')->default(false);
            $table->text('onboarding_notes')->nullable();
            $table->date('date_hired')->nullable();
            $table->string('last_name')->nullable();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('suffix')->nullable();
            $table->date('birthday')->nullable();
            $table->string('birthplace')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('gender')->nullable();
            $table->string('sss_number')->nullable();
            $table->string('philhealth_number')->nullable();
            $table->string('pagibig_number')->nullable();
            $table->string('tin_number')->nullable();
            $table->string('mlast_name')->nullable();
            $table->string('mfirst_name')->nullable();
            $table->string('mmiddle_name')->nullable();
            $table->string('msuffix')->nullable();
            $table->string('flast_name')->nullable();
            $table->string('ffirst_name')->nullable();
            $table->string('fmiddle_name')->nullable();
            $table->string('fsuffix')->nullable();
            $table->string('mobile_number')->nullable();
            $table->string('house_number')->nullable();
            $table->string('street')->nullable();
            $table->string('village')->nullable();
            $table->string('subdivision')->nullable();
            $table->string('barangay')->nullable();
            $table->string('region')->nullable();
            $table->string('province')->nullable();
            $table->string('city_municipality')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('perm_house_number')->nullable();
            $table->string('perm_street')->nullable();
            $table->string('perm_village')->nullable();
            $table->string('perm_subdivision')->nullable();
            $table->string('perm_barangay')->nullable();
            $table->string('perm_city_municipality')->nullable();
            $table->string('perm_province')->nullable();
            $table->string('perm_region')->nullable();
            $table->string('perm_zip_code')->nullable();
            $table->string('email_address')->nullable();
            $table->text('height_1')->nullable();
            $table->text('feedback')->nullable();
            $table->text('heigh')->nullable();
            $table->text('height')->nullable();
            $table->date('date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
