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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_id');
            $table->foreign('owner_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->string('title');
            $table->text('description');
            $table->text('objectives')->nullable();
            $table->string('type')->default('ACADEMIC'); // e.g., RESEARCH, UNIVERSITY, PERSONAL
            $table->string('status')->default('OPEN'); // OPEN, CLOSED, COMPLETED
            $table->integer('max_members')->default(5);
            $table->text('required_skills')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
