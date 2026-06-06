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
        Schema::table('posts', function (Blueprint $table) {
            if (!Schema::hasColumn('posts', 'title')) {
                $table->string('title')->nullable()->after('author_id');
            }
            if (!Schema::hasColumn('posts', 'media_type')) {
                $table->string('media_type')->nullable()->after('file_url'); // 'IMAGE', 'VIDEO', 'PDF'
            }
            if (!Schema::hasColumn('posts', 'file_urls')) {
                $table->json('file_urls')->nullable()->after('media_type');
            }
        });

        Schema::table('likes', function (Blueprint $table) {
            if (!Schema::hasColumn('likes', 'type')) {
                $table->string('type')->default('LIKE')->after('post_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['title', 'media_type', 'file_urls']);
        });

        Schema::table('likes', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
