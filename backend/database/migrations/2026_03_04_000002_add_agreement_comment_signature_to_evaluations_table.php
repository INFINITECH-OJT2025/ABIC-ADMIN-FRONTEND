<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->string('agreement_1')->nullable()->after('score_1_breakdown');
            $table->text('comment_1')->nullable()->after('agreement_1');
            $table->longText('signature_1')->nullable()->after('comment_1');
            $table->string('agreement_2')->nullable()->after('score_2_breakdown');
            $table->text('comment_2')->nullable()->after('agreement_2');
            $table->longText('signature_2')->nullable()->after('comment_2');
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn([
                'agreement_1',
                'comment_1',
                'signature_1',
                'agreement_2',
                'comment_2',
                'signature_2',
            ]);
        });
    }
};
