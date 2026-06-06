<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('article_title')->nullable()->after('link_url');
            $table->string('journal')->nullable()->after('article_title');
            $table->string('doi')->nullable()->after('journal');
            $table->string('keywords')->nullable()->after('doi');
            $table->text('abstract')->nullable()->after('keywords');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['article_title', 'journal', 'doi', 'keywords', 'abstract']);
        });
    }
};
