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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', [
                'CONNECTION_REQUEST', 'CONNECTION_ACCEPTED', 'POST_LIKED', 'POST_COMMENTED', 
                'PROJECT_INVITATION', 'PROJECT_JOIN_REQUEST', 'PROJECT_JOIN_ACCEPTED', 
                'PROJECT_JOIN_REJECTED', 'PROJECT_NEW_MESSAGE', 'DIRECT_MESSAGE_RECEIVED', 
                'ACCOUNT_VALIDATED', 'ACCOUNT_REJECTED'
            ]);
            $table->string('message')->nullable();
            $table->bigInteger('reference_id')->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->json('data')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
