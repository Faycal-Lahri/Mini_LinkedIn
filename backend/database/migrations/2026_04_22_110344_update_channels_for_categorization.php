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
        Schema::table('channels', function (Blueprint $table) {
            // Type of channel: GLOBAL, PRIVATE, PROJECT, ARTICLE
            $table->string('type')->default('GLOBAL')->after('slug');
            
            // For Private Chats (1-on-1)
            $table->unsignedBigInteger('user1_id')->nullable()->after('type');
            $table->foreign('user1_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->unsignedBigInteger('user2_id')->nullable()->after('user1_id');
            $table->foreign('user2_id')->references('id')->on('users')->onDelete('cascade');
            
            // For Project Chats
            $table->unsignedBigInteger('project_id')->nullable()->after('user2_id');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
            
            // For Article Chats
            $table->unsignedBigInteger('post_id')->nullable()->after('project_id');
            $table->foreign('post_id')->references('id')->on('posts')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->dropForeign(['user1_id']);
            $table->dropForeign(['user2_id']);
            $table->dropForeign(['project_id']);
            $table->dropForeign(['post_id']);
            
            $table->dropColumn(['type', 'user1_id', 'user2_id', 'project_id', 'post_id']);
        });
    }
};
