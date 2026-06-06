<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin
        $admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'IGA',
            'email' => 'admin@iga.ma',
            'password' => Hash::make('password'),
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);
        $admin->profile()->create(['institution' => 'IGA Casablanca']);

        // Students
        $yasmine = User::create([
            'first_name' => 'Yasmine',
            'last_name' => 'Benali',
            'email' => 'yasmine@student.ma',
            'password' => Hash::make('password'),
            'role' => 'STUDENT',
            'status' => 'ACTIVE',
        ]);
        $yasmine->profile()->create(['institution' => 'IGA Rabat']);

        $karim = User::create([
            'first_name' => 'Karim',
            'last_name' => 'Alaoui',
            'email' => 'karim@student.ma',
            'password' => Hash::make('password'),
            'role' => 'STUDENT',
            'status' => 'ACTIVE',
        ]);
        $karim->profile()->create(['institution' => 'IGA Casablanca']);

        // Teacher
        $omar = User::create([
            'first_name' => 'Pr. Omar',
            'last_name' => 'Fassi',
            'email' => 'omar@teacher.ma',
            'password' => Hash::make('password'),
            'role' => 'TEACHER',
            'status' => 'ACTIVE',
        ]);
        $omar->profile()->create([
            'institution' => 'IGA Marrakech',
            'biography' => 'Professeur passionné par le développement web et le cloud computing.',
        ]);

        // Researcher
        $layla = User::create([
            'first_name' => 'Dr. Layla',
            'last_name' => 'Mansouri',
            'email' => 'layla@researcher.ma',
            'password' => Hash::make('password'),
            'role' => 'RESEARCHER',
            'status' => 'ACTIVE',
        ]);
        $laylaProfile = $layla->profile()->create([
            'institution' => 'CNRST / IGA',
            'biography' => 'Chercheuse en Intelligence Artificielle et Systèmes Distribués.',
        ]);

        $laylaProfile->skills()->create(['name' => 'Python', 'level' => 'EXPERT']);
        $laylaProfile->skills()->create(['name' => 'Machine Learning', 'level' => 'ADVANCED']);
        
        $laylaProfile->experiences()->create([
            'title' => 'Lead Researcher',
            'organization' => 'CNRST',
            'start_date' => '2020-01-01',
            'type' => 'RESEARCH',
            'description' => 'Working on AI for social good.'
        ]);
    }
}
