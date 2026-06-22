<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Profile;
use App\Models\Skill;
use App\Models\Experience;
use App\Models\Education;
use App\Models\Certification;
use App\Models\Publication;
use App\Models\Post;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Connection;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\ProjectTask;
use App\Models\Channel;
use App\Models\ChatMessage;
use Carbon\Carbon;

class MegaSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Démarrage du MegaSeeder...');

        // ================================================================
        // ÉTAPE 1 : NETTOYAGE — Supprimer tout sauf admin et yasmine
        // ================================================================
        $this->command->info('🗑️  Étape 1 : Nettoyage de la base de données...');

        $keepEmails = ['admin@iga.ma', 'yasmine@student.ma'];
        $usersToDelete = User::whereNotIn('email', $keepEmails)->get();

        foreach ($usersToDelete as $user) {
            $user->delete(); // Le boot() du modèle gère toutes les cascades
        }

        // Nettoyer aussi les posts des utilisateurs conservés pour éviter les doublons
        Post::whereIn('author_id', User::whereIn('email', $keepEmails)->pluck('id'))->get()->each(function($post) {
            $post->delete();
        });

        // Nettoyer aussi les channels GLOBAL orphelins
        Channel::where('type', 'GLOBAL')->delete();

        $this->command->info('✅ Nettoyage terminé. ' . $usersToDelete->count() . ' utilisateur(s) supprimé(s).');

        // ================================================================
        // ÉTAPE 2 : COMPLÉTER LE PROFIL DE YASMINE
        // ================================================================
        $this->command->info('👩 Étape 2 : Complétion du profil Yasmine...');

        $yasmine = User::where('email', 'yasmine@student.ma')->first();
        if ($yasmine) {
            $yasmine->update([
                'first_name' => 'Yasmine',
                'last_name'  => 'El Mansouri',
                'status'     => 'ACTIVE',
                'email_verified' => true,
            ]);

            $profileYasmine = Profile::updateOrCreate(
                ['user_id' => $yasmine->id],
                [
                    'institution' => 'IGA Casablanca',
                    'field'       => 'Génie Informatique',
                    'study_level' => 'Licence 3',
                    'location'    => 'Casablanca, Maroc',
                    'phone'       => '+212 6 61 23 45 67',
                    'languages'   => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                    ],
                    'linkedin_url'=> 'https://linkedin.com/in/yasmine-elmansouri',
                    'github_url'  => 'https://github.com/yasmine-dev',
                    'biography'   => "Yasmine El Mansouri\nÉtudiante passionnée en Génie Informatique à l'IGA Casablanca\n\nJe suis étudiante en troisième année de Licence en Génie Informatique à l'IGA Casablanca. Passionnée par l'intelligence artificielle et le développement logiciel, j'ai développé de solides compétences techniques en Python, Machine Learning, React et SQL.\n\nAu cours de mon cursus, j'ai eu l'opportunité d'effectuer un stage enrichissant chez OCP Group où j'ai contribué au développement d'une solution de visualisation de données pour optimiser les processus industriels. Cette expérience m'a permis de transformer mes connaissances académiques en compétences professionnelles concrètes.\n\nCertifiée Google Data Analytics, je suis constamment en quête de nouveaux défis intellectuels et techniques. Mon objectif est de contribuer à des projets innovants alliant intelligence artificielle et impact social positif.",
                ]
            );

            // Skills Yasmine
            Skill::where('profile_id', $profileYasmine->id)->delete();
            $yasmineSkills = [
                ['name' => 'Python', 'level' => 'Expert'],
                ['name' => 'Machine Learning', 'level' => 'Intermediate'],
                ['name' => 'React.js', 'level' => 'Intermediate'],
                ['name' => 'SQL / MySQL', 'level' => 'Expert'],
                ['name' => 'TensorFlow', 'level' => 'Beginner'],
                ['name' => 'Git & GitHub', 'level' => 'Expert'],
            ];
            foreach ($yasmineSkills as $skill) {
                Skill::create(['profile_id' => $profileYasmine->id] + $skill);
            }

            // Education Yasmine
            Education::where('profile_id', $profileYasmine->id)->delete();
            Education::create([
                'profile_id'     => $profileYasmine->id,
                'school'         => 'IGA Casablanca',
                'degree'         => 'Licence',
                'field_of_study' => 'Génie Informatique',
                'city'           => 'Casablanca',
                'start_date'     => '2022-09-01',
                'end_date'       => null,
                'description'    => 'Formation en génie informatique couvrant la programmation, les réseaux, les bases de données et l\'intelligence artificielle.',
            ]);

            // Certifications Yasmine
            Certification::where('profile_id', $profileYasmine->id)->delete();
            Certification::create([
                'profile_id'          => $profileYasmine->id,
                'title'               => 'Google Data Analytics Certificate',
                'issuing_organization' => 'Google / Coursera',
                'issue_date'          => '2023-06-15',
                'credential_url'      => 'https://coursera.org/verify/GDA123',
                'description'         => 'Certification couvrant l\'analyse de données, la visualisation avec Tableau et la programmation en R.',
            ]);
            Certification::create([
                'profile_id'          => $profileYasmine->id,
                'title'               => 'AWS Cloud Practitioner Essentials',
                'issuing_organization' => 'Amazon Web Services',
                'issue_date'          => '2023-11-20',
                'credential_url'      => 'https://aws.amazon.com/training',
                'description'         => 'Fondamentaux du cloud computing AWS : services, sécurité et architecture.',
            ]);

            // Experience Yasmine
            Experience::where('profile_id', $profileYasmine->id)->delete();
            Experience::create([
                'profile_id'   => $profileYasmine->id,
                'title'        => 'Stagiaire Développeur Data',
                'organization' => 'OCP Group',
                'location'     => 'Casablanca, Maroc',
                'start_date'   => '2024-07-01',
                'end_date'     => '2024-08-31',
                'is_current'   => false,
                'type'         => 'INTERNSHIP',
                'duration'     => '2 mois',
                'description'  => 'Développement d\'un dashboard interactif de visualisation des données de production pour optimiser les processus industriels. Utilisation de Python, Pandas et Plotly.',
            ]);
        }
        $this->command->info('✅ Profil Yasmine complété.');

        // ================================================================
        // ÉTAPE 3 : CRÉATION DES 5 ÉTUDIANTS
        // ================================================================
        $this->command->info('🎓 Étape 3 : Création des 5 étudiants...');

        $students = [
            [
                'user' => [
                    'first_name' => 'Karim', 'last_name' => 'Benali',
                    'email' => 'karim@student.ma', 'role' => 'STUDENT',
                ],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'field' => 'Génie Logiciel',
                    'study_level' => 'Master 1', 'location' => 'Casablanca, Maroc',
                    'phone' => '+212 6 62 11 22 33',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                    ],
                    'github_url' => 'https://github.com/karim-benali',
                    'linkedin_url' => 'https://linkedin.com/in/karim-benali',
                    'biography' => "Karim Benali\nÉtudiant en Master Génie Logiciel à IGA Casablanca\n\nJe suis étudiant en première année de Master Génie Logiciel à l'IGA Casablanca. Passionné par le développement full-stack et l'architecture logicielle, j'ai acquis une solide expérience dans la conception et le déploiement d'applications web modernes.\n\nJ'ai participé à plusieurs projets académiques d'envergure, notamment le développement d'une plateforme de e-learning et d'un système de gestion de bibliothèque numérique. Ces expériences m'ont permis de maîtriser des technologies comme Laravel, React.js, Docker et les bases de données relationnelles.\n\nActuellement, je travaille sur un projet de recherche portant sur la détection automatique du plagiat dans les travaux universitaires grâce aux techniques de NLP. Mon ambition est de devenir architecte logiciel spécialisé dans les systèmes distribués à grande échelle.",
                ],
                'skills' => [
                    ['name' => 'Laravel / PHP', 'level' => 'Expert'],
                    ['name' => 'React.js', 'level' => 'Expert'],
                    ['name' => 'Docker', 'level' => 'Intermediate'],
                    ['name' => 'PostgreSQL', 'level' => 'Intermediate'],
                    ['name' => 'TypeScript', 'level' => 'Intermediate'],
                ],
                'education' => [
                    'school' => 'IGA Casablanca', 'degree' => 'Master',
                    'field_of_study' => 'Génie Logiciel', 'city' => 'Casablanca',
                    'start_date' => '2024-09-01',
                ],
                'certifications' => [
                    ['title' => 'Meta Back-End Developer', 'issuing_organization' => 'Meta / Coursera', 'issue_date' => '2024-03-10'],
                ],
                'experience' => [
                    'title' => 'Développeur Full-Stack Junior', 'organization' => 'Webtech Maroc',
                    'location' => 'Casablanca', 'start_date' => '2023-07-01',
                    'end_date' => '2023-09-30', 'type' => 'INTERNSHIP', 'duration' => '3 mois',
                    'description' => 'Développement de fonctionnalités e-commerce avec Laravel et Vue.js.',
                ],
            ],
            [
                'user' => [
                    'first_name' => 'Salma', 'last_name' => 'Ouali',
                    'email' => 'salma@student.ma', 'role' => 'STUDENT',
                ],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'field' => 'Intelligence Artificielle',
                    'study_level' => 'Licence 3', 'location' => 'Rabat, Maroc',
                    'phone' => '+212 6 63 44 55 66',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                        ['language' => 'Espagnol', 'level' => 'Avancé'],
                    ],
                    'linkedin_url' => 'https://linkedin.com/in/salma-ouali',
                    'biography' => "Salma Ouali\nÉtudiante en Licence Intelligence Artificielle à IGA Casablanca\n\nPassionnée par les mathématiques et les algorithmes, je suis étudiante en troisième année de Licence en Intelligence Artificielle à l'IGA Casablanca. Mon parcours m'a permis de développer une expertise dans le machine learning, le deep learning et le traitement du langage naturel.\n\nJ'ai réalisé plusieurs projets pratiques, dont un système de reconnaissance faciale et un chatbot académique intelligent. Ces réalisations m'ont conféré une expérience concrète avec des frameworks comme TensorFlow, PyTorch et scikit-learn.\n\nJe suis également active dans la communauté tech marocaine, participant régulièrement à des hackathons et des conférences sur l'IA. Mon objectif est de contribuer à l'essor de l'IA responsable en Afrique.",
                ],
                'skills' => [
                    ['name' => 'Python', 'level' => 'Expert'],
                    ['name' => 'TensorFlow', 'level' => 'Intermediate'],
                    ['name' => 'PyTorch', 'level' => 'Intermediate'],
                    ['name' => 'NLP', 'level' => 'Beginner'],
                    ['name' => 'Scikit-learn', 'level' => 'Expert'],
                ],
                'education' => [
                    'school' => 'IGA Casablanca', 'degree' => 'Licence',
                    'field_of_study' => 'Intelligence Artificielle', 'city' => 'Casablanca',
                    'start_date' => '2022-09-01',
                ],
                'certifications' => [
                    ['title' => 'DeepLearning.AI TensorFlow Developer', 'issuing_organization' => 'Coursera', 'issue_date' => '2024-01-20'],
                ],
                'experience' => [
                    'title' => 'Stagiaire Data Scientist', 'organization' => 'Bank of Africa',
                    'location' => 'Rabat', 'start_date' => '2024-06-15',
                    'end_date' => '2024-08-15', 'type' => 'INTERNSHIP', 'duration' => '2 mois',
                    'description' => 'Développement de modèles prédictifs pour la détection de fraudes bancaires.',
                ],
            ],
            [
                'user' => [
                    'first_name' => 'Mehdi', 'last_name' => 'Chaoui',
                    'email' => 'mehdi@student.ma', 'role' => 'STUDENT',
                ],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'field' => 'Réseaux & Télécommunications',
                    'study_level' => 'Master 2', 'location' => 'Casablanca, Maroc',
                    'phone' => '+212 6 64 77 88 99',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                    ],
                    'linkedin_url' => 'https://linkedin.com/in/mehdi-chaoui',
                    'biography' => "Mehdi Chaoui\nÉtudiant en Master Réseaux & Télécommunications à IGA Casablanca\n\nEn deuxième année de Master Réseaux et Télécommunications à l'IGA Casablanca, je me spécialise dans la sécurité des réseaux et les infrastructures cloud. J'ai développé une expertise technique dans la configuration de réseaux complexes, la virtualisation et la cybersécurité.\n\nPendant mon stage de fin d'études chez Maroc Telecom, j'ai contribué à l'optimisation du réseau 5G dans la région de Casablanca. Cette expérience m'a permis de comprendre les enjeux réels des infrastructures télécoms modernes et d'appliquer des solutions innovantes.\n\nCertifié Cisco CCNA, je prépare actuellement ma certification CCNP. Mon ambition est de devenir ingénieur réseau senior spécialisé dans les infrastructures 5G et les réseaux définis par logiciel (SDN).",
                ],
                'skills' => [
                    ['name' => 'Cisco Networking', 'level' => 'Expert'],
                    ['name' => 'Sécurité Réseau', 'level' => 'Intermediate'],
                    ['name' => 'Linux / Unix', 'level' => 'Expert'],
                    ['name' => 'Virtualisation (VMware)', 'level' => 'Intermediate'],
                    ['name' => 'Python Scripting', 'level' => 'Intermediate'],
                ],
                'education' => [
                    'school' => 'IGA Casablanca', 'degree' => 'Master',
                    'field_of_study' => 'Réseaux & Télécommunications', 'city' => 'Casablanca',
                    'start_date' => '2023-09-01',
                ],
                'certifications' => [
                    ['title' => 'Cisco CCNA', 'issuing_organization' => 'Cisco', 'issue_date' => '2023-09-05'],
                ],
                'experience' => [
                    'title' => 'Ingénieur Réseau Stagiaire', 'organization' => 'Maroc Telecom',
                    'location' => 'Casablanca', 'start_date' => '2024-04-01',
                    'end_date' => null, 'is_current' => true, 'type' => 'INTERNSHIP', 'duration' => 'En cours',
                    'description' => 'Optimisation et monitoring du réseau 5G. Configuration de routeurs et switches Cisco. Analyse des performances réseau.',
                ],
            ],
            [
                'user' => [
                    'first_name' => 'Nadia', 'last_name' => 'Alaoui',
                    'email' => 'nadia@student.ma', 'role' => 'STUDENT',
                ],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'field' => 'Data Science',
                    'study_level' => 'Licence 2', 'location' => 'Marrakech, Maroc',
                    'phone' => '+212 6 65 00 11 22',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                    ],
                    'linkedin_url' => 'https://linkedin.com/in/nadia-alaoui',
                    'biography' => "Nadia Alaoui\nÉtudiante en Licence Data Science à IGA Casablanca\n\nJe suis étudiante en deuxième année de Licence Data Science à l'IGA Casablanca. Curieuse et déterminée, je me passionne pour l'analyse de données et la statistique appliquée aux problématiques sociales et économiques du Maroc.\n\nAu cours de ma formation, j'ai réalisé plusieurs projets d'analyse de données portant sur la démographie marocaine, les indicateurs économiques régionaux et les tendances du marché de l'emploi. J'utilise quotidiennement Python, R et les outils de visualisation comme Tableau et Power BI.\n\nJe suis convaincue que la data science peut jouer un rôle clé dans le développement durable du Maroc. Mon objectif à court terme est d'obtenir un stage dans une institution internationale pour acquérir une expérience sur des projets à grande échelle.",
                ],
                'skills' => [
                    ['name' => 'Python', 'level' => 'Intermediate'],
                    ['name' => 'R', 'level' => 'Beginner'],
                    ['name' => 'Power BI', 'level' => 'Intermediate'],
                    ['name' => 'SQL', 'level' => 'Expert'],
                    ['name' => 'Statistiques', 'level' => 'Intermediate'],
                ],
                'education' => [
                    'school' => 'IGA Casablanca', 'degree' => 'Licence',
                    'field_of_study' => 'Data Science', 'city' => 'Casablanca',
                    'start_date' => '2023-09-01',
                ],
                'certifications' => [
                    ['title' => 'IBM Data Science Professional', 'issuing_organization' => 'IBM / Coursera', 'issue_date' => '2024-05-30'],
                ],
                'experience' => [
                    'title' => 'Analyste de Données Junior', 'organization' => 'Attijariwafa Bank',
                    'location' => 'Casablanca', 'start_date' => '2024-07-01',
                    'end_date' => '2024-08-31', 'type' => 'INTERNSHIP', 'duration' => '2 mois',
                    'description' => 'Analyse des données clients pour segmentation marketing. Création de tableaux de bord Power BI.',
                ],
            ],
            [
                'user' => [
                    'first_name' => 'Youssef', 'last_name' => 'Radi',
                    'email' => 'youssef@student.ma', 'role' => 'STUDENT',
                ],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'field' => 'Cybersécurité',
                    'study_level' => 'Master 1', 'location' => 'Fès, Maroc',
                    'phone' => '+212 6 66 33 44 55',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                    ],
                    'github_url' => 'https://github.com/youssef-radi',
                    'biography' => "Youssef Radi\nÉtudiant en Master Cybersécurité à IGA Casablanca\n\nSpécialisé en cybersécurité et ethical hacking, je suis étudiant en première année de Master à l'IGA Casablanca. Ma passion pour la sécurité informatique m'a conduit à explorer en profondeur les vulnérabilités des systèmes, les techniques de pentesting et les stratégies de défense proactive.\n\nJ'ai obtenu la certification CompTIA Security+ et je travaille actuellement sur ma certification CEH (Certified Ethical Hacker). J'ai participé à plusieurs CTF (Capture The Flag) et competitions de cybersécurité, me classant dans le top 10% sur la plateforme HackTheBox.\n\nMon objectif professionnel est d'intégrer une équipe de sécurité offensive (Red Team) dans une grande entreprise ou une agence gouvernementale pour protéger les infrastructures critiques marocaines.",
                ],
                'skills' => [
                    ['name' => 'Ethical Hacking', 'level' => 'Intermediate'],
                    ['name' => 'Analyse Forensique', 'level' => 'Beginner'],
                    ['name' => 'Kali Linux', 'level' => 'Expert'],
                    ['name' => 'Cryptographie', 'level' => 'Intermediate'],
                    ['name' => 'Python Scripting', 'level' => 'Intermediate'],
                ],
                'education' => [
                    'school' => 'IGA Casablanca', 'degree' => 'Master',
                    'field_of_study' => 'Cybersécurité', 'city' => 'Casablanca',
                    'start_date' => '2024-09-01',
                ],
                'certifications' => [
                    ['title' => 'CompTIA Security+', 'issuing_organization' => 'CompTIA', 'issue_date' => '2024-02-14'],
                ],
                'experience' => [
                    'title' => 'Analyste Sécurité Stagiaire', 'organization' => 'Direction Générale de la Sécurité des Systèmes d\'Information (DGSSI)',
                    'location' => 'Rabat', 'start_date' => '2024-06-01',
                    'end_date' => '2024-08-31', 'type' => 'INTERNSHIP', 'duration' => '3 mois',
                    'description' => 'Audit de sécurité des systèmes informatiques. Réalisation de tests de pénétration sur des environnements contrôlés.',
                ],
            ],
        ];

        $studentUsers = [];
        foreach ($students as $data) {
            $user = User::create([
                'first_name'     => $data['user']['first_name'],
                'last_name'      => $data['user']['last_name'],
                'email'          => $data['user']['email'],
                'password'       => Hash::make('Password123!'),
                'role'           => $data['user']['role'],
                'status'         => 'ACTIVE',
                'email_verified' => true,
            ]);

            $profile = Profile::create(['user_id' => $user->id] + $data['profile']);
            foreach ($data['skills'] as $skill) {
                Skill::create(['profile_id' => $profile->id] + $skill);
            }
            Education::create([
                'profile_id' => $profile->id,
                'school'     => $data['education']['school'],
                'degree'     => $data['education']['degree'],
                'field_of_study' => $data['education']['field_of_study'],
                'city'       => $data['education']['city'],
                'start_date' => $data['education']['start_date'],
            ]);
            foreach ($data['certifications'] as $cert) {
                Certification::create(['profile_id' => $profile->id] + $cert);
            }
            Experience::create([
                'profile_id'   => $profile->id,
                'title'        => $data['experience']['title'],
                'organization' => $data['experience']['organization'],
                'location'     => $data['experience']['location'],
                'start_date'   => $data['experience']['start_date'],
                'end_date'     => $data['experience']['end_date'] ?? null,
                'is_current'   => $data['experience']['is_current'] ?? false,
                'type'         => $data['experience']['type'],
                'duration'     => $data['experience']['duration'],
                'description'  => $data['experience']['description'],
            ]);

            $studentUsers[$data['user']['email']] = $user;
        }
        $this->command->info('✅ 5 étudiants créés.');

        // ================================================================
        // ÉTAPE 4 : CRÉATION DES 4 ENSEIGNANTS
        // ================================================================
        $this->command->info('👨‍🏫 Étape 4 : Création des 4 enseignants...');

        $teachers = [
            [
                'user' => ['first_name' => 'Hassan', 'last_name' => 'Berrada', 'email' => 'h.berrada@iga.ma'],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'department' => 'Informatique',
                    'location' => 'Casablanca, Maroc', 'phone' => '+212 5 22 11 22 33',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                    ],
                    'linkedin_url' => 'https://linkedin.com/in/prof-berrada',
                    'biography' => "Prof. Hassan Berrada\nProfesseur d'Informatique — IGA Casablanca\n\nAvec plus de 15 ans d'expérience dans l'enseignement supérieur, je suis professeur au département Informatique de l'IGA Casablanca. Mes domaines d'enseignement incluent l'ingénierie logicielle, les architectures distribuées et le génie logiciel agile.\n\nTitulaire d'un Doctorat en Informatique de l'Université Mohammed V de Rabat, j'ai publié de nombreux articles dans des revues internationales sur les thèmes de la qualité logicielle et des méthodes agiles. Je suis également consultant pour plusieurs entreprises marocaines dans le secteur digital.\n\nEn dehors de mes cours, j'encadre des projets de fin d'études et supervise des mémoires de master. Je crois fermement que l'éducation est le levier le plus puissant pour le développement de notre pays.",
                ],
                'skills' => [
                    ['name' => 'Génie Logiciel', 'level' => 'Expert'],
                    ['name' => 'Java / Spring Boot', 'level' => 'Expert'],
                    ['name' => 'Méthodes Agiles', 'level' => 'Expert'],
                    ['name' => 'UML / Architecture', 'level' => 'Expert'],
                ],
            ],
            [
                'user' => ['first_name' => 'Fatima Zahra', 'last_name' => 'Idrissi', 'email' => 'f.idrissi@iga.ma'],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'department' => 'Mathématiques & Statistiques',
                    'location' => 'Casablanca, Maroc', 'phone' => '+212 5 22 44 55 66',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                    ],
                    'biography' => "Prof. Fatima Zahra Idrissi\nProfesseure de Mathématiques & Statistiques — IGA Casablanca\n\nJe suis professeure au département Mathématiques et Statistiques de l'IGA Casablanca depuis 10 ans. Titulaire d'un Doctorat en Mathématiques Appliquées, je me passionne pour l'enseignement des statistiques, de l'algèbre linéaire et des méthodes numériques appliquées à l'informatique.\n\nMes recherches portent sur l'application des méthodes statistiques avancées à l'analyse des données massives et aux modèles d'apprentissage automatique. J'ai co-encadré plus de 50 mémoires de fin d'études et publié 12 articles dans des revues académiques indexées.\n\nJe suis également membre du comité scientifique de la Conférence Nationale sur les Mathématiques Appliquées au Maroc et mentore plusieurs étudiantes dans le cadre du programme Women in Tech Maroc.",
                ],
                'skills' => [
                    ['name' => 'Statistiques Avancées', 'level' => 'Expert'],
                    ['name' => 'Algèbre Linéaire', 'level' => 'Expert'],
                    ['name' => 'MATLAB', 'level' => 'Expert'],
                    ['name' => 'R / RStudio', 'level' => 'Expert'],
                ],
            ],
            [
                'user' => ['first_name' => 'Omar', 'last_name' => 'Kettani', 'email' => 'o.kettani@iga.ma'],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'department' => 'Réseaux & Systèmes',
                    'location' => 'Casablanca, Maroc', 'phone' => '+212 5 22 77 88 99',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                    ],
                    'biography' => "Prof. Omar Kettani\nProfesseur Réseaux & Systèmes — IGA Casablanca\n\nIngénieur de formation et docteur en Réseaux Informatiques, j'enseigne à l'IGA Casablanca depuis 12 ans. Mes cours couvrent les protocoles réseau, la sécurité des systèmes d'information, la virtualisation et les technologies cloud.\n\nAnciennes expériences : j'ai travaillé 5 ans chez Maroc Telecom en tant qu'ingénieur réseau senior avant de rejoindre l'enseignement. Cette expérience terrain enrichit considérablement mes cours et permet à mes étudiants de comprendre les réalités du monde professionnel.\n\nJe supervise actuellement un projet de recherche financé par la CNRST sur la mise en place d'un campus intelligent (Smart Campus) à IGA, utilisant des technologies IoT pour optimiser la consommation énergétique.",
                ],
                'skills' => [
                    ['name' => 'Architecture Réseau', 'level' => 'Expert'],
                    ['name' => 'Sécurité des SI', 'level' => 'Expert'],
                    ['name' => 'Cloud Computing', 'level' => 'Intermediate'],
                    ['name' => 'Cisco / Juniper', 'level' => 'Expert'],
                ],
            ],
            [
                'user' => ['first_name' => 'Laila', 'last_name' => 'Mansouri', 'email' => 'l.mansouri@iga.ma'],
                'profile' => [
                    'institution' => 'IGA Casablanca', 'department' => 'Intelligence Artificielle',
                    'location' => 'Casablanca, Maroc', 'phone' => '+212 5 22 00 11 22',
                    'languages' => [
                        ['language' => 'Arabe', 'level' => 'Natif'],
                        ['language' => 'Français', 'level' => 'Bilingue'],
                        ['language' => 'Anglais', 'level' => 'Courant'],
                    ],
                    'linkedin_url' => 'https://linkedin.com/in/prof-mansouri-ia',
                    'biography' => "Prof. Laila Mansouri\nProfesseure en Intelligence Artificielle — IGA Casablanca\n\nPionnière dans l'enseignement de l'IA au Maroc, je dirige le département Intelligence Artificielle à l'IGA Casablanca. Mon doctorat obtenu à l'Université Paris-Saclay portait sur les réseaux de neurones convolutifs pour la reconnaissance d'images médicales.\n\nJe collabore activement avec des institutions internationales comme le MIT Media Lab et l'INRIA sur des projets de recherche en IA responsable. Mes travaux récents portent sur le biais algorithmique, l'explicabilité des modèles de ML et l'application de l'IA dans le secteur de la santé au Maroc.\n\nAuteure de deux ouvrages sur l'intelligence artificielle en arabe et en français, je m'engage à démocratiser l'accès à l'IA pour les étudiants marocains et africains.",
                ],
                'skills' => [
                    ['name' => 'Deep Learning', 'level' => 'Expert'],
                    ['name' => 'Computer Vision', 'level' => 'Expert'],
                    ['name' => 'Python / TensorFlow', 'level' => 'Expert'],
                    ['name' => 'IA Éthique', 'level' => 'Expert'],
                ],
            ],
        ];

        $teacherUsers = [];
        foreach ($teachers as $data) {
            $user = User::create([
                'first_name'     => $data['user']['first_name'],
                'last_name'      => $data['user']['last_name'],
                'email'          => $data['user']['email'],
                'password'       => Hash::make('Password123!'),
                'role'           => 'TEACHER',
                'status'         => 'ACTIVE',
                'email_verified' => true,
            ]);
            $profile = Profile::create(['user_id' => $user->id] + $data['profile']);
            foreach ($data['skills'] as $skill) {
                Skill::create(['profile_id' => $profile->id] + $skill);
            }
            Experience::create([
                'profile_id'   => $profile->id,
                'title'        => 'Professeur',
                'organization' => 'IGA Casablanca',
                'location'     => 'Casablanca',
                'start_date'   => '2012-09-01',
                'is_current'   => true,
                'type'         => 'TEACHING',
                'duration'     => 'En cours',
            ]);
            $teacherUsers[$data['user']['email']] = $user;
        }
        $this->command->info('✅ 4 enseignants créés.');

        // ================================================================
        // ÉTAPE 5 : CRÉATION DES 10 CHERCHEURS
        // ================================================================
        $this->command->info('🔬 Étape 5 : Création des 10 chercheurs...');

        $researchers = [
            [
                'first_name' => 'Rachid', 'last_name' => 'Moussaoui', 'email' => 'r.moussaoui@research.ma',
                'lab' => 'LRIT', 'dept' => 'Machine Learning',
                'bio' => "Dr. Rachid Moussaoui\nChercheur en Machine Learning — Laboratoire LRIT\n\nJe suis chercheur senior au Laboratoire de Recherche en Informatique et Télécommunications (LRIT) de l'Université Mohammed V de Rabat. Mes recherches portent sur les algorithmes d'apprentissage automatique appliqués aux données médicales et aux systèmes de recommandation.\n\nTitulaire d'un Doctorat en Informatique et d'un Post-Doctorat effectué à l'EPFL (École Polytechnique Fédérale de Lausanne), j'ai publié plus de 35 articles dans des revues indexées SCOPUS et Web of Science.\n\nJe dirige actuellement un projet de recherche financé par l'ANR sur l'utilisation du federated learning pour la protection de la vie privée dans les systèmes médicaux distribués.",
                'skills' => [['name' => 'Machine Learning', 'level' => 'Expert'], ['name' => 'Python', 'level' => 'Expert'], ['name' => 'R', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'Federated Learning pour la Détection Précoce du Cancer', 'publisher' => 'IEEE Transactions on Medical Imaging', 'publication_date' => '2024-01-15'],
                    ['title' => 'Systèmes de Recommandation Hybrides : Une Approche par Transfer Learning', 'publisher' => 'Journal of Artificial Intelligence Research', 'publication_date' => '2023-06-20'],
                ],
                'articles' => [
                    [
                        'article_title' => 'Federated Learning pour la Préservation de la Vie Privée dans les Diagnostics Médicaux',
                        'journal' => 'IEEE Transactions on Medical Imaging',
                        'doi' => '10.1109/TMI.2024.001234',
                        'keywords' => 'federated learning, privacy, medical imaging, deep learning',
                        'abstract' => 'Cet article présente une approche novatrice de federated learning permettant d\'entraîner des modèles de détection du cancer du sein sur des données distribuées entre plusieurs hôpitaux, sans partage des données patients. Notre méthode atteint une précision de 94.7% tout en garantissant la confidentialité différentielle.',
                    ],
                    [
                        'article_title' => 'Transfer Learning pour les Systèmes de Recommandation Cross-Domain',
                        'journal' => 'Journal of Artificial Intelligence Research',
                        'doi' => '10.1613/jair.2023.890',
                        'keywords' => 'transfer learning, recommender systems, cross-domain, collaborative filtering',
                        'abstract' => 'Nous proposons un nouveau paradigme de transfert de connaissances entre domaines pour améliorer les recommandations dans les contextes à faibles données. Les expériences sur MovieLens et Amazon Reviews démontrent une amélioration de 18% du NDCG par rapport aux méthodes de l\'état de l\'art.',
                    ],
                ],
            ],
            [
                'first_name' => 'Aicha', 'last_name' => 'Bensouda', 'email' => 'a.bensouda@research.ma',
                'lab' => 'LIM', 'dept' => 'Traitement du Signal',
                'bio' => "Dr. Aicha Bensouda\nChercheuse en Traitement du Signal — Laboratoire LIM\n\nJe suis maître de conférences et chercheuse au Laboratoire d'Informatique et Mathématiques (LIM) de l'Université Cadi Ayyad de Marrakech. Ma recherche se concentre sur le traitement du signal audio et la reconnaissance automatique de la parole en dialecte marocain (Darija).\n\nMes travaux ont contribué au développement du premier système de reconnaissance vocale spécialisé pour le Darija marocain, un projet collaboratif avec des chercheurs de l'Université de Carnegie Mellon.\n\nJ'ai reçu le Prix de la Meilleure Recherche Féminine en STEM lors de la Conférence Nationale sur les Technologies de l'Information au Maroc en 2023.",
                'skills' => [['name' => 'Traitement du Signal', 'level' => 'Expert'], ['name' => 'MATLAB', 'level' => 'Expert'], ['name' => 'Speech Recognition', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'Reconnaissance Automatique du Darija Marocain par Deep Learning', 'publisher' => 'Speech Communication Journal', 'publication_date' => '2024-03-10'],
                    ['title' => 'Filtrage Adaptatif pour les Signaux Biomédicaux', 'publisher' => 'Signal Processing', 'publication_date' => '2023-09-01'],
                ],
                'articles' => [
                    [
                        'article_title' => 'Moroccan Darija ASR : Un Modèle de Reconnaissance Vocale pour le Dialecte Marocain',
                        'journal' => 'Speech Communication',
                        'doi' => '10.1016/j.specom.2024.00321',
                        'keywords' => 'ASR, Darija, Arabic dialects, end-to-end, transformer',
                        'abstract' => 'Nous présentons le premier système de reconnaissance automatique de la parole (ASR) entièrement dédié au dialecte Darija marocain. En utilisant une architecture Transformer fine-tunée sur 1500 heures de données audio collectées, notre système atteint un taux d\'erreur de mots (WER) de 12.3%, surpassant tous les systèmes précédents de 40%.',
                    ],
                ],
            ],
            [
                'first_name' => 'Kamel', 'last_name' => 'Tahiri', 'email' => 'k.tahiri@research.ma',
                'lab' => 'LABTIC', 'dept' => 'Cybersécurité',
                'bio' => "Dr. Kamel Tahiri\nChercheur en Cybersécurité — LABTIC\n\nDirecteur du Laboratoire des Technologies de l'Information et de la Communication (LABTIC) à l'ENSA de Marrakech, je suis expert reconnu en cybersécurité et cryptographie. Mes recherches portent sur la sécurité des systèmes embarqués, la cryptographie post-quantique et la détection d'intrusions par IA.\n\nConsultant auprès du Ministère de la Transition Numérique du Maroc, j'ai contribué à l'élaboration de la Stratégie Nationale de Cybersécurité. J'ai également formé plus de 200 ingénieurs en sécurité à travers des programmes de formation continue.\n\nMembre de l'IEEE et de l'ACM, je siège au comité de programme de plusieurs conférences internationales en sécurité informatique.",
                'skills' => [['name' => 'Cryptographie', 'level' => 'Expert'], ['name' => 'Cybersécurité', 'level' => 'Expert'], ['name' => 'Systèmes Embarqués', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'Cryptographie Post-Quantique pour les Systèmes IoT', 'publisher' => 'IEEE Security & Privacy', 'publication_date' => '2024-02-01'],
                    ['title' => 'Détection d\'Intrusions par Apprentissage Profond', 'publisher' => 'Computers & Security', 'publication_date' => '2023-11-15'],
                ],
                'articles' => [
                    [
                        'article_title' => 'Post-Quantum Cryptography pour les Dispositifs IoT à Ressources Limitées',
                        'journal' => 'IEEE Security & Privacy',
                        'doi' => '10.1109/MSEC.2024.00456',
                        'keywords' => 'post-quantum, IoT, lattice cryptography, CRYSTALS-Kyber',
                        'abstract' => 'Face à la menace des ordinateurs quantiques, nous proposons une implémentation optimisée de CRYSTALS-Kyber pour microcontrôleurs ARM Cortex-M4. Notre solution réduit la consommation mémoire de 63% par rapport à l\'implémentation de référence tout en maintenant les niveaux de sécurité NIST.',
                    ],
                ],
            ],
            [
                'first_name' => 'Nour', 'last_name' => 'Hamdouch', 'email' => 'n.hamdouch@research.ma',
                'lab' => 'LRIT', 'dept' => 'NLP',
                'bio' => "Dr. Nour Hamdouch\nChercheuse en Traitement du Langage Naturel — LRIT\n\nJe suis chercheuse post-doctorante au LRIT, spécialisée dans le traitement du langage naturel pour les langues peu dotées en ressources, avec un focus particulier sur l'arabe, le tamazight et le Darija.\n\nMon doctorat, obtenu à l'Université de Grenoble, portait sur les modèles de langue multilingues pour les langues africaines. J'ai ensuite effectué un post-doctorat à Google Brain Paris où j'ai contribué au développement du modèle AraBERT.\n\nJe suis lauréate du Prix L'Oréal-UNESCO Pour les Femmes et la Science (Maroc) 2022 pour mes contributions à la démocratisation du NLP pour les langues africaines.",
                'skills' => [['name' => 'NLP', 'level' => 'Expert'], ['name' => 'PyTorch', 'level' => 'Expert'], ['name' => 'Linguistique Computationnelle', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'AraMorph : Analyseur Morphologique Neural pour l\'Arabe Dialectal', 'publisher' => 'ACL Anthology', 'publication_date' => '2024-07-01'],
                ],
                'articles' => [
                    [
                        'article_title' => 'TamazightBERT : Un Modèle de Langue Pré-Entraîné pour le Tamazight',
                        'journal' => 'Proceedings of ACL 2024',
                        'doi' => '10.18653/v1/2024.acl-main.456',
                        'keywords' => 'Tamazight, Berber language, BERT, low-resource NLP',
                        'abstract' => 'Nous présentons TamazightBERT, le premier modèle de langue pré-entraîné spécifiquement pour le Tamazight (Berbère), une langue parlée par plus de 40 millions de locuteurs mais disposant de très peu de ressources numériques. Le modèle est entraîné sur un corpus de 2.1GB construit à partir de sources diverses et atteint des performances état de l\'art sur les tâches de classification de texte, NER et analyse de sentiment.',
                    ],
                ],
            ],
            [
                'first_name' => 'Said', 'last_name' => 'Elfadili', 'email' => 's.elfadili@research.ma',
                'lab' => 'LABTIC', 'dept' => 'IoT',
                'bio' => "Dr. Said Elfadili\nChercheur en IoT & Systèmes Intelligents — LABTIC\n\nExpert en Internet des Objets (IoT) et en systèmes cyber-physiques, je suis professeur-chercheur à l'ENSAM Meknès. Mes travaux portent sur les architectures IoT pour les villes intelligentes, l'agriculture connectée et la santé connectée.\n\nJ'ai coordonné le projet Agri-IoT, un système de monitoring agricole intelligent déployé dans 50 exploitations dans la région de Meknès-Tafilalet, permettant une réduction de 35% de la consommation d'eau.\n\nJe suis consultant IoT pour plusieurs startups marocaines et membre actif du cluster Digital Maroc. Mes recherches sont soutenues par des fonds du Ministère de l'Agriculture et de la Banque Mondiale.",
                'skills' => [['name' => 'IoT', 'level' => 'Expert'], ['name' => 'MQTT / LoRaWAN', 'level' => 'Expert'], ['name' => 'Edge Computing', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'Smart Irrigation avec LoRaWAN : Déploiement à Grande Échelle', 'publisher' => 'Sensors Journal', 'publication_date' => '2024-04-15'],
                    ['title' => 'Architecture Edge-Cloud pour les Applications IoT Temps Réel', 'publisher' => 'Future Generation Computer Systems', 'publication_date' => '2023-12-01'],
                ],
                'articles' => [
                    [
                        'article_title' => 'Système d\'Irrigation Intelligent Basé sur LoRaWAN pour l\'Agriculture Durable',
                        'journal' => 'Sensors (MDPI)',
                        'doi' => '10.3390/s24041234',
                        'keywords' => 'IoT, smart agriculture, LoRaWAN, irrigation, precision farming',
                        'abstract' => 'Cet article présente le déploiement d\'un système d\'irrigation de précision basé sur LoRaWAN dans 50 exploitations agricoles de la région de Meknès. Le système collecte en temps réel les données d\'humidité du sol, de température et d\'évapotranspiration pour automatiser l\'irrigation. Les résultats sur 18 mois montrent une économie moyenne d\'eau de 35% et une augmentation de 22% des rendements agricoles.',
                    ],
                ],
            ],
            [
                'first_name' => 'Meriem', 'last_name' => 'Ouadi', 'email' => 'm.ouadi@research.ma',
                'lab' => 'LIM', 'dept' => 'Vision par Ordinateur',
                'bio' => "Dr. Meriem Ouadi\nChercheuse en Vision par Ordinateur — Laboratoire LIM\n\nSpécialisée en vision par ordinateur et reconnaissance de formes, je suis chercheuse au LIM de l'Université Cadi Ayyad. Mes recherches actuelles portent sur la détection de maladies des plantes par analyse d'images drone et le contrôle qualité automatisé dans l'industrie agroalimentaire marocaine.\n\nTitulaire d'un double doctorat en co-tutelle entre l'Université Cadi Ayyad et l'Université Paul Sabatier de Toulouse, j'ai développé des algorithmes de segmentation sémantique atteignant des performances de pointe sur des jeux de données d'imagerie agronomique.\n\nJ'ai co-fondé AgriVision, une startup deeptech qui commercialise mes solutions de vision par ordinateur auprès des coopératives agricoles marocaines.",
                'skills' => [['name' => 'Computer Vision', 'level' => 'Expert'], ['name' => 'OpenCV', 'level' => 'Expert'], ['name' => 'PyTorch', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'Détection Automatique de Maladies Foliaires par CNN', 'publisher' => 'Computers and Electronics in Agriculture', 'publication_date' => '2024-05-01'],
                ],
                'articles' => [
                    [
                        'article_title' => 'PlantNet-Morocco : Détection de Maladies Foliaires par Réseau de Neurones Convolutifs',
                        'journal' => 'Computers and Electronics in Agriculture',
                        'doi' => '10.1016/j.compag.2024.00789',
                        'keywords' => 'plant disease detection, CNN, transfer learning, drone imagery, Morocco',
                        'abstract' => 'Nous présentons PlantNet-Morocco, un modèle de deep learning pour la détection automatique de 23 maladies affectant les cultures marocaines principales (blé, olivier, agrumes). Entraîné sur un dataset de 85,000 images collectées par drone, le modèle atteint une précision de 96.2% en condition réelle et peut être déployé sur smartphone pour une utilisation directe par les agriculteurs.',
                    ],
                ],
            ],
            [
                'first_name' => 'Hicham', 'last_name' => 'Zerari', 'email' => 'h.zerari@research.ma',
                'lab' => 'LRIT', 'dept' => 'Deep Learning',
                'bio' => "Dr. Hicham Zerari\nChercheur en Deep Learning — LRIT\n\nJe suis professeur-chercheur au LRIT et directeur adjoint du Centre d'Excellence en IA du Maroc. Mes recherches portent sur les architectures de deep learning avancées, notamment les transformers, les réseaux génératifs adversariaux (GAN) et les modèles de diffusion.\n\nAnciennes affiliations : chercheur invité au Meta AI Research (FAIR) pendant 18 mois, où j'ai contribué au développement d'architectures d'attention efficientes pour les modèles de vision-langage.\n\nAuteur de 45 publications, dont 12 articles dans des conférences de tier 1 (NeurIPS, ICML, ICLR), je suis régulièrement invité comme reviewer dans les principales conférences d'IA mondiales.",
                'skills' => [['name' => 'Deep Learning', 'level' => 'Expert'], ['name' => 'PyTorch', 'level' => 'Expert'], ['name' => 'Transformers', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'Efficient Vision Transformers for High-Resolution Medical Segmentation', 'publisher' => 'NeurIPS 2023', 'publication_date' => '2023-12-10'],
                    ['title' => 'Diffusion Models for Data Augmentation in Low-Resource Settings', 'publisher' => 'ICML 2024', 'publication_date' => '2024-07-15'],
                ],
                'articles' => [
                    [
                        'article_title' => 'MedViT-Maroc : Vision Transformer Efficace pour la Segmentation d\'Images IRM',
                        'journal' => 'NeurIPS 2023',
                        'doi' => '10.5555/3666122.3669456',
                        'keywords' => 'vision transformer, medical segmentation, MRI, attention, efficiency',
                        'abstract' => 'Nous introduisons MedViT, une variante allégée du Vision Transformer spécialement conçue pour la segmentation d\'images médicales haute résolution IRM. En remplaçant l\'attention globale par une attention locale à fenêtres glissantes enrichie d\'une connexion cross-scale, MedViT réduit la complexité quadratique à quasi-linéaire. Sur le benchmark BraTS 2023, notre modèle dépasse les méthodes précédentes de 2.1% de Dice score tout en étant 3x plus rapide à l\'inférence.',
                    ],
                ],
            ],
            [
                'first_name' => 'Zineb', 'last_name' => 'Alaoui', 'email' => 'z.alaoui@research.ma',
                'lab' => 'LIM', 'dept' => 'Big Data',
                'bio' => "Dr. Zineb Alaoui\nChercheuse en Big Data & Analytics — Laboratoire LIM\n\nJe suis professeure associée et chercheuse au LIM, spécialisée dans le traitement des données massives et les architectures de data lakes pour les secteurs bancaire et télécom.\n\nMes travaux de recherche portent sur l'optimisation des pipelines de traitement de données volumineuses avec Apache Spark, Flink et les nouvelles architectures lakehouse (Delta Lake, Apache Iceberg). J'ai accompagné plusieurs banques marocaines dans leur transformation data.\n\nJe coordonne le Master Professionnel Big Data Analytics à l'Université Cadi Ayyad, formant chaque année 30 ingénieurs spécialisés en gestion des données massives.",
                'skills' => [['name' => 'Apache Spark', 'level' => 'Expert'], ['name' => 'Hadoop', 'level' => 'Expert'], ['name' => 'Data Engineering', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'Lakehouse Architecture pour l\'Analyse Temps Réel en Banque', 'publisher' => 'IEEE Big Data Conference', 'publication_date' => '2023-12-15'],
                ],
                'articles' => [
                    [
                        'article_title' => 'OptimLake : Optimisation Automatique des Requêtes dans les Architectures Lakehouse',
                        'journal' => 'IEEE Transactions on Big Data',
                        'doi' => '10.1109/TBDATA.2024.00789',
                        'keywords' => 'lakehouse, query optimization, Delta Lake, Spark, banking analytics',
                        'abstract' => 'Les architectures Lakehouse combinent la flexibilité des data lakes et les performances des data warehouses. Dans cet article, nous proposons OptimLake, un système d\'optimisation de requêtes automatique basé sur l\'apprentissage par renforcement qui apprend dynamiquement les stratégies de partitionnement, d\'indexation et de mise en cache optimales selon les patterns d\'accès observés. Évalué sur les données de 3 banques marocaines partenaires, OptimLake réduit les temps de requête analytiques de 67% en moyenne.',
                    ],
                ],
            ],
            [
                'first_name' => 'Yassine', 'last_name' => 'Bouazza', 'email' => 'y.bouazza@research.ma',
                'lab' => 'LABTIC', 'dept' => 'Blockchain',
                'bio' => "Dr. Yassine Bouazza\nChercheur en Blockchain & Systèmes Décentralisés — LABTIC\n\nPionnier de la recherche blockchain au Maroc, je suis chercheur au LABTIC et fondateur du Morocco Blockchain Lab. Mes travaux portent sur les contrats intelligents, les protocoles de consensus, la DeFi (Finance Décentralisée) et les applications de la blockchain dans la chaîne d'approvisionnement et la traçabilité.\n\nJ'ai collaboré avec Bank Al-Maghrib dans le cadre d'un projet pilote sur la monnaie numérique de banque centrale (MNBC) marocaine. J'ai également développé une solution blockchain pour la traçabilité de l'arganier marocain, permettant de certifier l'authenticité de l'huile d'argan exportée.\n\nMembre du Comité Technique ISO/TC 307 sur la Blockchain, je représente le Maroc dans les négociations sur les standards internationaux de la technologie des registres distribués.",
                'skills' => [['name' => 'Blockchain / Solidity', 'level' => 'Expert'], ['name' => 'Ethereum / Hyperledger', 'level' => 'Expert'], ['name' => 'Cryptographie', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'Traçabilité de la Chaîne d\'Approvisionnement par Blockchain', 'publisher' => 'IEEE Blockchain', 'publication_date' => '2024-06-01'],
                ],
                'articles' => [
                    [
                        'article_title' => 'ArganeChain : Solution Blockchain pour la Certification et Traçabilité de l\'Huile d\'Argan Marocaine',
                        'journal' => 'IEEE Transactions on Engineering Management',
                        'doi' => '10.1109/TEM.2024.01234',
                        'keywords' => 'blockchain, supply chain, argan oil, Morocco, traceability, certification',
                        'abstract' => 'L\'huile d\'argan marocaine, produit d\'exception dont la valeur sur le marché mondial dépasse 250M$/an, souffre de contrefaçons massives estimées à 40% des exportations. Nous présentons ArganeChain, une solution blockchain basée sur Hyperledger Fabric permettant une traçabilité bout-en-bout de la production à l\'exportation. Le système intègre des IoT tags NFC pour authentifier les lots à chaque étape et des smart contracts pour automatiser les certifications. Déployé avec 12 coopératives de femmes à Essaouira, la solution a permis d\'augmenter le prix moyen d\'exportation de 23%.',
                    ],
                ],
            ],
            [
                'first_name' => 'Rim', 'last_name' => 'Khalidi', 'email' => 'r.khalidi@research.ma',
                'lab' => 'LRIT', 'dept' => 'Robotique',
                'bio' => "Dr. Rim Khalidi\nChercheuse en Robotique & Systèmes Autonomes — LRIT\n\nDocteure en Robotique et Systèmes Autonomes, je suis chercheuse au LRIT et co-directrice du laboratoire de robotique de l'Université Mohammed V. Mes recherches couvrent la navigation autonome, la planification de mouvement, la robotique collaborative (cobots) et les drones autonomes.\n\nJ'ai dirigé le développement de MedBot, un robot d\'assistance médicale déployé dans 3 hôpitaux de Rabat pour la livraison de médicaments et de matériel stérile, réduisant les risques d\'infection croisée pendant la pandémie COVID-19.\n\nLaurée du Prix National de l'Innovation Technologique 2023 décerné par le Ministère de l'Industrie, je suis également ambassadrice du programme Technovation Challenge au Maroc, encourageant les jeunes filles à s'orienter vers les carrières en robotique et IA.",
                'skills' => [['name' => 'ROS / ROS2', 'level' => 'Expert'], ['name' => 'SLAM Navigation', 'level' => 'Expert'], ['name' => 'Computer Vision', 'level' => 'Expert']],
                'publications' => [
                    ['title' => 'MedBot : Robot Autonome pour l\'Assistance Médicale en Milieu Hospitalier', 'publisher' => 'Journal of Field Robotics', 'publication_date' => '2024-03-01'],
                    ['title' => 'Navigation Autonome en Environnements Dynamiques Intérieurs', 'publisher' => 'IEEE Robotics and Automation Letters', 'publication_date' => '2023-08-20'],
                ],
                'articles' => [
                    [
                        'article_title' => 'MedBot : Plateforme Robotique Autonome pour la Logistique Médicale Intra-Hospitalière',
                        'journal' => 'Journal of Field Robotics',
                        'doi' => '10.1002/rob.22456',
                        'keywords' => 'autonomous robot, hospital logistics, SLAM, ROS2, COVID-19',
                        'abstract' => 'Nous décrivons la conception, le déploiement et l\'évaluation de MedBot, un robot mobile autonome dédié à la logistique intra-hospitalière. MedBot utilise un algorithme SLAM 3D basé sur LiDAR et caméras RGB-D pour naviguer dans des couloirs hospitaliers dynamiques, éviter les obstacles humains et livrer des médicaments selon des tournées planifiées. Déployé dans 3 hôpitaux de Rabat pendant 14 mois, MedBot a effectué 47,832 livraisons avec un taux de succès de 98.7%, libérant 2.4 ETP d\'infirmiers pour des tâches à plus haute valeur ajoutée médicale.',
                    ],
                ],
            ],
        ];

        $researcherUsers = [];
        foreach ($researchers as $data) {
            $user = User::create([
                'first_name'     => $data['first_name'],
                'last_name'      => $data['last_name'],
                'email'          => $data['email'],
                'password'       => Hash::make('Password123!'),
                'role'           => 'RESEARCHER',
                'status'         => 'ACTIVE',
                'email_verified' => true,
            ]);

            $profile = Profile::create([
                'user_id'     => $user->id,
                'institution' => 'Université Mohammed V de Rabat',
                'laboratory'  => $data['lab'],
                'department'  => $data['dept'],
                'location'    => 'Rabat, Maroc',
                'phone'       => '+212 5 37 ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99),
                'languages'   => [
                    ['language' => 'Arabe', 'level' => 'Natif'],
                    ['language' => 'Français', 'level' => 'Bilingue'],
                    ['language' => 'Anglais', 'level' => 'Courant'],
                ],
                'biography'   => $data['bio'],
                'linkedin_url'=> 'https://linkedin.com/in/dr-' . strtolower($data['last_name']),
            ]);

            foreach ($data['skills'] as $skill) {
                Skill::create(['profile_id' => $profile->id] + $skill);
            }

            foreach ($data['publications'] as $pub) {
                Publication::create(['profile_id' => $profile->id] + $pub);
            }

            Experience::create([
                'profile_id'   => $profile->id,
                'title'        => 'Chercheur Senior',
                'organization' => 'Université Mohammed V — ' . $data['lab'],
                'location'     => 'Rabat, Maroc',
                'start_date'   => '2015-09-01',
                'is_current'   => true,
                'type'         => 'RESEARCH',
                'duration'     => 'En cours',
            ]);

            // Posts SCIENTIFIC_ARTICLE
            foreach ($data['articles'] as $article) {
                Post::create([
                    'author_id'     => $user->id,
                    'type'          => 'SCIENTIFIC_ARTICLE',
                    'content'       => $article['abstract'],
                    'article_title' => $article['article_title'],
                    'journal'       => $article['journal'],
                    'doi'           => $article['doi'],
                    'keywords'      => $article['keywords'],
                    'abstract'      => $article['abstract'],
                ]);
            }

            $researcherUsers[$data['email']] = $user;
        }
        $this->command->info('✅ 10 chercheurs créés.');

        // ================================================================
        // ÉTAPE 6 : POSTS DES ÉTUDIANTS ET ENSEIGNANTS
        // ================================================================
        $this->command->info('📝 Étape 6 : Création des posts...');

        $yasmineRefresh = User::where('email', 'yasmine@student.ma')->first();
        $karim  = $studentUsers['karim@student.ma'];
        $salma  = $studentUsers['salma@student.ma'];
        $mehdi  = $studentUsers['mehdi@student.ma'];
        $nadia  = $studentUsers['nadia@student.ma'];
        $youssef = $studentUsers['youssef@student.ma'];

        $berrada  = $teacherUsers['h.berrada@iga.ma'];
        $idrissi  = $teacherUsers['f.idrissi@iga.ma'];
        $kettani  = $teacherUsers['o.kettani@iga.ma'];
        $mansouri = $teacherUsers['l.mansouri@iga.ma'];

        $moussaoui = $researcherUsers['r.moussaoui@research.ma'];
        $elfadili  = $researcherUsers['s.elfadili@research.ma'];

        $studentPosts = [
            Post::create(['author_id' => $yasmineRefresh->id, 'type' => 'GENERAL', 'title' => 'Mon stage chez OCP !', 'content' => 'Super expérience terminée chez OCP Group ! 2 mois intenses à développer un dashboard de visualisation des données de production avec Python et Plotly. Merci à toute l\'équipe pour l\'accueil chaleureux. #Stage #DataScience #OCP #Maroc']),
            Post::create(['author_id' => $yasmineRefresh->id, 'type' => 'GENERAL', 'content' => 'Félicitations à toute la promo de L3 Génie Info de l\'IGA Casablanca ! Quelle année enrichissante ! Hâte de voir ce que la suite nous réserve. 🎓 #IGA #GénieInformatique #Promotion2024']),
            Post::create(['author_id' => $karim->id, 'type' => 'GENERAL', 'title' => 'Lancement de mon projet open-source !', 'content' => 'Fier d\'annoncer le lancement de PlagiaDetect, mon projet open-source de détection de plagiat basé sur le NLP ! Le code est disponible sur GitHub. Toutes les contributions sont les bienvenues ! 🚀 #OpenSource #NLP #Laravel #React']),
            Post::create(['author_id' => $karim->id, 'type' => 'UNIVERSITY_PROJECT', 'title' => 'Projet : Plateforme E-Learning IGA', 'content' => 'Notre équipe de Master 1 vient de finaliser notre plateforme e-learning académique développée avec Laravel, React et Socket.io. Fonctionnalités : cours en ligne, quiz interactifs, forums de discussion et vidéoconférences intégrées. #ePedagogie #FullStack #IGA']),
            Post::create(['author_id' => $salma->id, 'type' => 'GENERAL', 'content' => 'Après 3 mois de travail intensif, mon modèle de détection de fraudes bancaires atteint 99.2% de précision avec XGBoost ! La qualité des données fait toute la différence. Prochain défi : expliquer le modèle avec SHAP. 📊 #MachineLearning #BankFraud #BankOfAfrica']),
            Post::create(['author_id' => $salma->id, 'type' => 'GENERAL', 'content' => 'Conseil du jour : si vous débutez en Deep Learning, commencez par les CNNs avant les Transformers. Maîtrisez les concepts fondamentaux (convolution, pooling, backprop) avant de plonger dans l\'état de l\'art. Des ressources : fast.ai, CS231n de Stanford, le livre de François Chollet. 🧠 #DeepLearning #Conseil']),
            Post::create(['author_id' => $mehdi->id, 'type' => 'GENERAL', 'title' => 'Certification CCNA obtenue !', 'content' => '🎯 Cisco CCNA certifié ! 6 mois de préparation intense, des centaines de labs sur Packet Tracer et GNS3, et beaucoup de café ☕. Si vous préparez la CCNA, n\'hésitez pas à me contacter ! #Cisco #CCNA #Réseaux #Certification']),
            Post::create(['author_id' => $mehdi->id, 'type' => 'GENERAL', 'content' => 'En plein projet d\'optimisation du réseau 5G chez Maroc Telecom. Fascinant de voir comment les technologies Massive MIMO et Network Slicing transforment les infrastructures mobiles. La 5G, c\'est vraiment une révolution ! 📡 #5G #MarocTelecom #Réseaux']),
            Post::create(['author_id' => $nadia->id, 'type' => 'GENERAL', 'content' => 'Excellente ressource pour apprendre la Data Science en arabe : les tutoriels d\'Ara-DL sur YouTube ! Pour ceux qui préfèrent l\'anglais, Kaggle Learn est imbattable pour la pratique gratuite. 📚 #DataScience #Ressources #Apprentissage']),
            Post::create(['author_id' => $youssef->id, 'type' => 'GENERAL', 'title' => 'Mon stage à la DGSSI terminé', 'content' => 'Fin de mon stage de 3 mois à la Direction Générale de la Sécurité des Systèmes d\'Information. J\'ai réalisé des audits de sécurité et des tests d\'intrusion sur des systèmes gouvernementaux. Une expérience unique pour comprendre les enjeux de la cybersécurité nationale. 🔒 #Cybersécurité #DGSSI #Maroc']),
        ];

        // Posts des enseignants
        Post::create(['author_id' => $berrada->id, 'type' => 'GENERAL', 'title' => 'Appel à projets : Stage de fin d\'études 2025', 'content' => 'Je recherche des étudiants motivés en Master pour des projets de fin d\'études passionnants : (1) Architecture microservices avec Kubernetes, (2) Développement d\'un LMS adaptatif avec IA, (3) Optimisation d\'algorithmes de tri distribué. Contactez-moi en message privé ! #StagePFE #Master #Informatique #IGA']);
        Post::create(['author_id' => $berrada->id, 'type' => 'UNIVERSITY_PROJECT', 'title' => 'Résultats Hackathon IGA 2024', 'content' => 'Bravo aux équipes lauréates du Hackathon IGA 2024 sur le thème "Tech pour l\'Éducation" ! 🏆 1er prix : équipe InclusifEdu pour leur app d\'accessibilité pour malvoyants. 2e prix : équipe SmartCampus pour leur système de réservation de salles IA. Fiers de nos étudiants ! #HackathonIGA #EdTech']);
        Post::create(['author_id' => $mansouri->id, 'type' => 'GENERAL', 'title' => 'L\'IA Éthique : Enjeux et Perspectives pour le Maroc', 'content' => 'Après ma conférence au Forum Mondial de l\'IA à Genève, je partage quelques réflexions sur l\'IA responsable : 1/ Les données biaisées produisent des modèles discriminants. 2/ L\'explicabilité est un droit fondamental dans les systèmes automatisés. 3/ L\'Afrique doit co-construire les normes de l\'IA, pas seulement les subir. Vos thoughts ? 🤔 #IAÉthique #ResponsibleAI #Afrique']);
        Post::create(['author_id' => $kettani->id, 'type' => 'GENERAL', 'content' => 'Nouvelle publication ! Notre article sur le Smart Campus d\'IGA est accepté dans IEEE IoT Journal. Nous montrons comment les capteurs intelligents ont réduit la consommation électrique du campus de 28% en un an. Merci à toute l\'équipe ! 🌿 #SmartCampus #IoT #IGA #Énergie']);

        // ================================================================
        // ÉTAPE 7 : LIKES ET COMMENTAIRES DYNAMIQUES ET RÉALISTES
        // ================================================================
        $this->command->info('❤️  Étape 7 : Likes et commentaires...');

        $allActiveUsers = User::whereIn('email', array_merge(
            $keepEmails,
            array_keys($studentUsers),
            array_keys($teacherUsers),
            array_keys($researcherUsers)
        ))->get();

        $scArticleAcademicComments = [
            "Excellents travaux ! Cette publication apporte une réelle contribution au domaine.",
            "Très intéressant. Avez-vous comparé vos résultats avec les architectures de l'état de l'art ?",
            "Une approche très prometteuse. Félicitations pour cette publication !",
            "Félicitations pour ces recherches ! La méthodologie est très rigoureuse et les résultats probants.",
            "Sujet crucial pour la communauté. Serait-il possible de collaborer sur une extension de ce modèle ?"
        ];

        $scArticleStudentComments = [
            "Merci pour ce partage ! C'est un sujet passionnant qui m'inspire pour mon mémoire.",
            "Félicitations Docteur ! Est-ce que le code source ou le dataset est disponible en open-source ?",
            "Super intéressant ! L'application de l'IA dans ce domaine est vraiment l'avenir.",
            "Félicitations pour cette réussite ! Est-ce que vous proposez des sujets de stage de recherche autour de cette thématique ?"
        ];

        $univProjectTeacherComments = [
            "Excellent projet ! C'est exactement le genre de réalisation pratique qui valorise votre cursus.",
            "Très bon travail d'équipe. N'oubliez pas de bien documenter l'architecture et les API.",
            "Bravo pour ce projet. Pensez à le présenter lors de la journée scientifique de l'établissement.",
            "Travail de qualité. Les fonctionnalités répondent parfaitement à un besoin réel."
        ];

        $univProjectStudentComments = [
            "Wow, magnifique boulot ! L'interface utilisateur est super propre.",
            "Superbe réalisation ! Est-ce que vous recrutez d'autres membres pour continuer le développement ?",
            "Félicitations à l'équipe ! Très inspirant pour notre groupe de projet.",
            "Projet très propre, bravo ! Hâte de voir la démo finale."
        ];

        $internshipComments = [
            "Félicitations pour ce stage ! C'est une excellente référence sur ton CV.",
            "Bravo ! L'expérience acquise dans cette entreprise te sera d'une grande aide pour la suite.",
            "Félicitations ! Travailler sur des projets réels en entreprise est la meilleure école.",
            "Félicitations ! C'est un super sujet de stage. Profite bien de cette expérience."
        ];

        $certificationComments = [
            "Félicitations pour la certification ! C'est un vrai plus pour ta carrière.",
            "Bravo ! Le travail acharné a payé. Une belle réussite !",
            "Félicitations ! Cette certification est une étape importante dans ton domaine.",
            "Superbe réussite, bravo ! Quelle est la prochaine étape ?"
        ];

        $promoComments = [
            "Félicitations à tous ! Une très belle étape de franchie.",
            "Bravo la promo ! Bonne continuation et beaucoup de succès pour la suite.",
            "Félicitations ! Que du bonheur et de la réussite pour vos parcours respectifs."
        ];

        $generalTipsComments = [
            "Merci pour ces précieux conseils ! Très utile pour les débutants.",
            "Tout à fait d'accord, maîtriser les bases est primordial avant d'aller plus loin.",
            "Excellent partage, merci pour les ressources !"
        ];

        $fallbackComments = [
            "Super intéressant, merci pour le partage !",
            "Félicitations pour cette contribution !",
            "Très inspirant ! Bravo 👏",
            "Excellent travail !"
        ];

        $allPosts = Post::all();

        foreach ($allPosts as $post) {
            // 1. LIKES: Chaque post reçoit entre 5 et 12 likes de manière aléatoire
            $numLikes = rand(5, 12);
            $likers = $allActiveUsers->reject(function($u) use ($post) {
                return $u->id === $post->author_id;
            });
            
            if ($likers->count() > 0) {
                $chosenLikers = $likers->random(min($numLikes, $likers->count()));
                foreach ($chosenLikers as $liker) {
                    $reactionType = ['LIKE', 'LOVE', 'CLAP', 'INSIGHTFUL'][rand(0, 3)];
                    Like::firstOrCreate([
                        'user_id' => $liker->id,
                        'post_id' => $post->id
                    ], [
                        'type' => $reactionType
                    ]);
                }
            }

            // 2. COMMENTAIRES: Chaque post reçoit entre 1 et 3 commentaires de manière aléatoire
            $numComments = rand(1, 3);
            $commenters = $allActiveUsers->reject(function($u) use ($post) {
                return $u->id === $post->author_id;
            });

            if ($commenters->count() > 0) {
                $chosenCommenters = $commenters->random(min($numComments, $commenters->count()));
                foreach ($chosenCommenters as $commenter) {
                    $content = "";

                    // Sélectionner le type de commentaire selon le post et le rôle de l'auteur du commentaire
                    if ($post->type === 'SCIENTIFIC_ARTICLE') {
                        if ($commenter->role === 'TEACHER' || $commenter->role === 'RESEARCHER') {
                            $content = $scArticleAcademicComments[array_rand($scArticleAcademicComments)];
                        } else {
                            $content = $scArticleStudentComments[array_rand($scArticleStudentComments)];
                        }
                    } elseif ($post->type === 'UNIVERSITY_PROJECT') {
                        if ($commenter->role === 'TEACHER' || $commenter->role === 'RESEARCHER') {
                            $content = $univProjectTeacherComments[array_rand($univProjectTeacherComments)];
                        } else {
                            $content = $univProjectStudentComments[array_rand($univProjectStudentComments)];
                        }
                    } else { // GENERAL
                        $lowerContent = mb_strtolower($post->content);
                        $lowerTitle = mb_strtolower($post->title ?? '');

                        if (str_contains($lowerContent, 'stage') || str_contains($lowerContent, 'ocp') || str_contains($lowerContent, 'dgssi')) {
                            $content = $internshipComments[array_rand($internshipComments)];
                        } elseif (str_contains($lowerContent, 'certif') || str_contains($lowerContent, 'ccna') || str_contains($lowerContent, 'obtention')) {
                            $content = $certificationComments[array_rand($certificationComments)];
                        } elseif (str_contains($lowerContent, 'promo') || str_contains($lowerContent, 'diplôm') || str_contains($lowerContent, 'soutenance')) {
                            $content = $promoComments[array_rand($promoComments)];
                        } elseif (str_contains($lowerContent, 'conseil') || str_contains($lowerContent, 'débutez') || str_contains($lowerContent, 'ressource')) {
                            $content = $generalTipsComments[array_rand($generalTipsComments)];
                        } else {
                            $content = $fallbackComments[array_rand($fallbackComments)];
                        }
                    }

                    Comment::create([
                        'post_id'   => $post->id,
                        'author_id' => $commenter->id,
                        'content'   => $content
                    ]);
                }
            }
        }

        $this->command->info('✅ Likes et commentaires créés.');

        // ================================================================
        // ÉTAPE 8 : CONNEXIONS
        // ================================================================
        $this->command->info('🤝 Étape 8 : Création des connexions...');

        // Connexions ACCEPTED entre étudiants
        $studentUserList = array_values($studentUsers);
        Connection::create(['sender_id' => $yasmineRefresh->id, 'receiver_id' => $karim->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $yasmineRefresh->id, 'receiver_id' => $salma->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $mehdi->id, 'receiver_id' => $yasmineRefresh->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $nadia->id, 'receiver_id' => $yasmineRefresh->id, 'status' => 'ACCEPTED']);

        // Yasmine ↔ Enseignants (ACCEPTED)
        Connection::create(['sender_id' => $berrada->id, 'receiver_id' => $yasmineRefresh->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $yasmineRefresh->id, 'receiver_id' => $mansouri->id, 'status' => 'ACCEPTED']);

        // Yasmine ↔ Chercheur (ACCEPTED)
        Connection::create(['sender_id' => $moussaoui->id, 'receiver_id' => $yasmineRefresh->id, 'status' => 'ACCEPTED']);

        // Connexions PENDING vers Yasmine (en attente)
        Connection::create(['sender_id' => $youssef->id, 'receiver_id' => $yasmineRefresh->id, 'status' => 'PENDING']);
        Connection::create(['sender_id' => $idrissi->id, 'receiver_id' => $yasmineRefresh->id, 'status' => 'PENDING']);
        Connection::create(['sender_id' => $researcherUsers['n.hamdouch@research.ma']->id, 'receiver_id' => $yasmineRefresh->id, 'status' => 'PENDING']);

        // Connexions entre étudiants
        Connection::create(['sender_id' => $karim->id, 'receiver_id' => $salma->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $karim->id, 'receiver_id' => $mehdi->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $salma->id, 'receiver_id' => $nadia->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $youssef->id, 'receiver_id' => $mehdi->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $youssef->id, 'receiver_id' => $karim->id, 'status' => 'ACCEPTED']);

        // Connexions enseignants ↔ chercheurs
        Connection::create(['sender_id' => $berrada->id, 'receiver_id' => $moussaoui->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $kettani->id, 'receiver_id' => $elfadili->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $mansouri->id, 'receiver_id' => $researcherUsers['h.zerari@research.ma']->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $idrissi->id, 'receiver_id' => $researcherUsers['z.alaoui@research.ma']->id, 'status' => 'ACCEPTED']);

        // Connexions entre chercheurs
        Connection::create(['sender_id' => $moussaoui->id, 'receiver_id' => $researcherUsers['h.zerari@research.ma']->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $researcherUsers['n.hamdouch@research.ma']->id, 'receiver_id' => $moussaoui->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $researcherUsers['a.bensouda@research.ma']->id, 'receiver_id' => $researcherUsers['n.hamdouch@research.ma']->id, 'status' => 'ACCEPTED']);
        Connection::create(['sender_id' => $researcherUsers['k.tahiri@research.ma']->id, 'receiver_id' => $researcherUsers['y.bouazza@research.ma']->id, 'status' => 'ACCEPTED']);

        // Connexions PENDING entre chercheurs
        Connection::create(['sender_id' => $researcherUsers['m.ouadi@research.ma']->id, 'receiver_id' => $berrada->id, 'status' => 'PENDING']);
        Connection::create(['sender_id' => $researcherUsers['r.khalidi@research.ma']->id, 'receiver_id' => $kettani->id, 'status' => 'PENDING']);

        $this->command->info('✅ Connexions créées.');

        // ================================================================
        // ÉTAPE 9 : PROJETS
        // ================================================================
        $this->command->info('📁 Étape 9 : Création des projets...');

        // Projet 1
        $project1 = Project::create([
            'owner_id'       => $karim->id,
            'title'          => 'PlagiaDetect — Plateforme IA de Détection de Plagiat',
            'description'    => 'Développement d\'une plateforme académique de détection automatique du plagiat dans les travaux universitaires utilisant des techniques de NLP avancées (BERT, cosine similarity, fingerprinting).',
            'objectives'     => 'Créer un système capable d\'analyser des mémoires, thèses et rapports en PDF/Word, de détecter les similarités avec des sources web et une base de documents académiques, et de générer des rapports détaillés pour les enseignants.',
            'type'           => 'RESEARCH',
            'status'         => 'OPEN',
            'max_members'    => 5,
            'required_skills'=> 'Python, NLP, Machine Learning, Laravel, React.js',
            'conditions'     => 'Être étudiant en Master ou Doctorat. Disponibilité de 10h/semaine minimum.',
        ]);

        ProjectMembership::create(['project_id' => $project1->id, 'user_id' => $karim->id, 'role' => 'OWNER', 'status' => 'ACCEPTED', 'joined_at' => now()]);
        ProjectMembership::create(['project_id' => $project1->id, 'user_id' => $yasmineRefresh->id, 'role' => 'MEMBER', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(10)]);
        ProjectMembership::create(['project_id' => $project1->id, 'user_id' => $salma->id, 'role' => 'MEMBER', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(8)]);
        ProjectMembership::create(['project_id' => $project1->id, 'user_id' => $moussaoui->id, 'role' => 'COLLABORATOR', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(5)]);
        ProjectMembership::create(['project_id' => $project1->id, 'user_id' => $berrada->id, 'role' => 'COLLABORATOR', 'status' => 'PENDING', 'joined_at' => null]);

        ProjectTask::create(['project_id' => $project1->id, 'title' => 'Collecte et préparation du dataset de documents académiques', 'status' => 'COMPLETED', 'assigned_to' => $salma->id]);
        ProjectTask::create(['project_id' => $project1->id, 'title' => 'Implémentation du modèle BERT pour la similarité sémantique', 'status' => 'COMPLETED', 'assigned_to' => $salma->id]);
        ProjectTask::create(['project_id' => $project1->id, 'title' => 'Développement de l\'API REST Laravel', 'status' => 'COMPLETED', 'assigned_to' => $karim->id]);
        ProjectTask::create(['project_id' => $project1->id, 'title' => 'Interface React pour le tableau de bord enseignant', 'status' => 'PENDING', 'assigned_to' => $yasmineRefresh->id]);
        ProjectTask::create(['project_id' => $project1->id, 'title' => 'Rédaction du rapport scientifique et soumission à une conférence', 'status' => 'PENDING', 'assigned_to' => $karim->id]);

        // Projet 2
        $project2 = Project::create([
            'owner_id'       => $berrada->id,
            'title'          => 'SmartEdu — Système de Gestion Universitaire Intelligent',
            'description'    => 'Développement d\'un système de gestion universitaire complet pour IGA Casablanca intégrant la gestion des emplois du temps, des présences, des notes et un module de recommandation pédagogique par IA.',
            'objectives'     => 'Remplacer les outils obsolètes de gestion universitaire par une plateforme moderne, mobile-first, avec des fonctionnalités d\'IA pour personnaliser l\'expérience étudiante.',
            'type'           => 'ACADEMIC',
            'status'         => 'OPEN',
            'max_members'    => 6,
            'required_skills'=> 'Laravel, React Native, MySQL, UML, Méthodes Agiles',
            'conditions'     => 'Étudiants en Master ou Ingénierie. Connaissance de Laravel ou React Native requise.',
        ]);

        ProjectMembership::create(['project_id' => $project2->id, 'user_id' => $berrada->id, 'role' => 'OWNER', 'status' => 'ACCEPTED', 'joined_at' => now()]);
        ProjectMembership::create(['project_id' => $project2->id, 'user_id' => $mehdi->id, 'role' => 'MEMBER', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(15)]);
        ProjectMembership::create(['project_id' => $project2->id, 'user_id' => $nadia->id, 'role' => 'MEMBER', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(12)]);
        ProjectMembership::create(['project_id' => $project2->id, 'user_id' => $youssef->id, 'role' => 'MEMBER', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(9)]);
        ProjectMembership::create(['project_id' => $project2->id, 'user_id' => $mansouri->id, 'role' => 'COLLABORATOR', 'status' => 'PENDING', 'joined_at' => null]);

        ProjectTask::create(['project_id' => $project2->id, 'title' => 'Conception de l\'architecture système et modélisation UML', 'status' => 'COMPLETED', 'assigned_to' => $berrada->id]);
        ProjectTask::create(['project_id' => $project2->id, 'title' => 'Développement du module de gestion des emplois du temps', 'status' => 'COMPLETED', 'assigned_to' => $mehdi->id]);
        ProjectTask::create(['project_id' => $project2->id, 'title' => 'Module de gestion des notes et bulletins', 'status' => 'PENDING', 'assigned_to' => $nadia->id]);
        ProjectTask::create(['project_id' => $project2->id, 'title' => 'Sécurisation de l\'API et audit de sécurité', 'status' => 'PENDING', 'assigned_to' => $youssef->id]);

        // Projet 3
        $project3 = Project::create([
            'owner_id'       => $elfadili->id,
            'title'          => 'CampusIoT — Campus Intelligent par l\'Internet des Objets',
            'description'    => 'Déploiement d\'une infrastructure IoT complète sur le campus d\'IGA Casablanca pour optimiser la consommation énergétique, la gestion des espaces et améliorer l\'expérience étudiante.',
            'objectives'     => 'Installer 150 capteurs IoT (température, humidité, occupation, éclairage), développer une plateforme de monitoring temps réel et un système d\'alerte intelligent. Cible : réduire la consommation énergétique de 30%.',
            'type'           => 'RESEARCH',
            'status'         => 'OPEN',
            'max_members'    => 4,
            'required_skills'=> 'IoT, MQTT, Raspberry Pi, Python, React, Gestion de projet',
            'conditions'     => 'Idéalement étudiants en Réseaux, IoT ou Systèmes embarqués. Disponibilité pour interventions sur site.',
        ]);

        ProjectMembership::create(['project_id' => $project3->id, 'user_id' => $elfadili->id, 'role' => 'OWNER', 'status' => 'ACCEPTED', 'joined_at' => now()]);
        ProjectMembership::create(['project_id' => $project3->id, 'user_id' => $youssef->id, 'role' => 'MEMBER', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(7)]);
        ProjectMembership::create(['project_id' => $project3->id, 'user_id' => $karim->id, 'role' => 'MEMBER', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(5)]);
        ProjectMembership::create(['project_id' => $project3->id, 'user_id' => $kettani->id, 'role' => 'COLLABORATOR', 'status' => 'ACCEPTED', 'joined_at' => now()->subDays(3)]);
        ProjectMembership::create(['project_id' => $project3->id, 'user_id' => $mehdi->id, 'role' => 'MEMBER', 'status' => 'PENDING', 'joined_at' => null]);

        ProjectTask::create(['project_id' => $project3->id, 'title' => 'Spécification technique et choix des capteurs', 'status' => 'COMPLETED', 'assigned_to' => $elfadili->id]);
        ProjectTask::create(['project_id' => $project3->id, 'title' => 'Installation et configuration des 50 premiers capteurs', 'status' => 'COMPLETED', 'assigned_to' => $kettani->id]);
        ProjectTask::create(['project_id' => $project3->id, 'title' => 'Développement du broker MQTT et pipeline de données', 'status' => 'PENDING', 'assigned_to' => $youssef->id]);
        ProjectTask::create(['project_id' => $project3->id, 'title' => 'Dashboard React de monitoring en temps réel', 'status' => 'PENDING', 'assigned_to' => $karim->id]);

        $this->command->info('✅ 3 projets créés.');

        // ================================================================
        // ÉTAPE 10 : CHANNELS ET MESSAGES
        // ================================================================
        $this->command->info('💬 Étape 10 : Création des channels et messages...');

        // Channel GLOBAL IGA
        $globalChannel = Channel::create([
            'name'       => 'Fil Général IGA',
            'slug'       => 'fil-general-iga',
            'description'=> 'Espace de discussion général pour toute la communauté IGA Casablanca',
            'type'       => 'GLOBAL',
            'is_private' => false,
        ]);

        $globalMessages = [
            [$berrada->id, 'Bienvenue sur le nouveau réseau académique Mini-LinkedIn IGA ! Je suis Prof. Berrada du département Informatique. N\'hésitez pas à vous connecter et partager vos travaux ! 👋'],
            [$yasmineRefresh->id, 'Super initiative ! Je suis Yasmine, L3 Génie Info. Ravi d\'avoir un espace dédié à notre communauté académique 🎓'],
            [$karim->id, 'Karim ici, Master 1 GL. Est-ce qu\'il y a d\'autres étudiants en Master intéressés par de la collaboration sur des projets open-source ?'],
            [$salma->id, 'Salma, L3 IA ! Je suis intéressée Karim. Notamment sur des projets ML. Tu travailles sur quoi exactement ?'],
            [$moussaoui->id, 'Dr. Moussaoui du LRIT. Ravit de voir cette initiative ! Je cherche des étudiants motivés pour des projets de recherche en ML. Contactez-moi 🔬'],
            [$mansouri->id, 'Tout à fait d\'accord avec Dr. Moussaoui. L\'IA est un domaine qui offre d\'incroyables opportunités pour les jeunes chercheurs marocains.'],
            [$youssef->id, 'Quelqu\'un a des ressources sur la préparation à la CEH ? Je prépare la certification ethical hacking 🔐'],
            [$kettani->id, 'Pour la CEH, je recommande le livre "CEH Certified Ethical Hacker All-in-One Exam Guide" + la plateforme TryHackMe. Bon courage Youssef !'],
            [$mehdi->id, 'Et HackTheBox aussi c\'est excellent pour la pratique ! Je suis passé de débutant à niveau Hacker en 6 mois avec ça.'],
            [$nadia->id, 'Question pour les enseignants : y a-t-il des ateliers Power BI ou Tableau prévus ce semestre ?'],
            [$idrissi->id, 'Oui Nadia ! J\'organise un atelier Power BI le 15 Juillet pour les étudiants en Data Science. Je posterai les détails prochainement.'],
            [$berrada->id, 'Rappel : les soutenances de fin de semestre sont du 25 au 30 Juin. Bon courage à tous ! 💪'],
        ];

        foreach ($globalMessages as $msg) {
            ChatMessage::create([
                'channel_id' => $globalChannel->id,
                'sender_id'  => $msg[0],
                'content'    => $msg[1],
            ]);
        }

        // Channel PRIVATE — Yasmine ↔ Karim (Expanded)
        $privateChannel1 = Channel::create([
            'name'       => 'Yasmine & Karim',
            'slug'       => 'private-yasmine-karim-' . time(),
            'type'       => 'PRIVATE',
            'is_private' => true,
            'user1_id'   => $yasmineRefresh->id,
            'user2_id'   => $karim->id,
        ]);
        ChatMessage::create(['channel_id' => $privateChannel1->id, 'sender_id' => $karim->id, 'content' => 'Salut Yasmine ! J\'ai vu que tu es intéressée par PlagiaDetect. Tu veux rejoindre le projet ?']);
        ChatMessage::create(['channel_id' => $privateChannel1->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Oui absolument ! J\'aimerais contribuer à la partie interface React. Je peux commencer quand ?']);
        ChatMessage::create(['channel_id' => $privateChannel1->id, 'sender_id' => $karim->id, 'content' => 'Super ! Je t\'ajoute au repo GitHub. On a une réunion de projet ce vendredi à 15h sur Meet, tu peux y être ?']);
        ChatMessage::create(['channel_id' => $privateChannel1->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Parfait, je serai là ! J\'enverrai d\'abord mes premières maquettes Figma pour qu\'on valide la direction UI.']);
        ChatMessage::create(['channel_id' => $privateChannel1->id, 'sender_id' => $karim->id, 'content' => 'Génial, j\'ai hâte de voir ça. Est-ce que tu as déjà travaillé avec Zustand pour la gestion d\'état ?']);
        ChatMessage::create(['channel_id' => $privateChannel1->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Oui, je l\'ai utilisé sur un projet personnel. C\'est beaucoup plus simple et léger que Redux Toolkit.']);
        ChatMessage::create(['channel_id' => $privateChannel1->id, 'sender_id' => $karim->id, 'content' => 'Parfait ! C\'est exactement ce que j\'ai mis en place sur le boilerplate. Tu te sentiras comme chez toi.']);
        ChatMessage::create(['channel_id' => $privateChannel1->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Super ! Je commence à cloner le projet ce soir et je regarde la structure.']);

        // Channel PRIVATE — Yasmine ↔ Dr. Moussaoui (Expanded)
        $privateChannel2 = Channel::create([
            'name'       => 'Yasmine & Dr. Moussaoui',
            'slug'       => 'private-yasmine-moussaoui-' . (time() + 1),
            'type'       => 'PRIVATE',
            'is_private' => true,
            'user1_id'   => $yasmineRefresh->id,
            'user2_id'   => $moussaoui->id,
        ]);
        ChatMessage::create(['channel_id' => $privateChannel2->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Bonjour Dr. Moussaoui ! J\'ai lu votre article sur le federated learning en médical et c\'est fascinant. Je prépare un mémoire sur l\'application du ML en santé.']);
        ChatMessage::create(['channel_id' => $privateChannel2->id, 'sender_id' => $moussaoui->id, 'content' => 'Bonjour Yasmine ! Très bien que vous vous intéressiez à ce domaine. Quel aspect vous intéresse particulièrement ?']);
        ChatMessage::create(['channel_id' => $privateChannel2->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'La question de la confidentialité des données patients dans les modèles ML. Comment entraîner des modèles précis sans compromettre la vie privée ?']);
        ChatMessage::create(['channel_id' => $privateChannel2->id, 'sender_id' => $moussaoui->id, 'content' => 'Excellente question. Je vous recommande de commencer par les papers de Dwork sur la "differential privacy". Je peux vous envoyer une bibliographie de démarrage.']);
        ChatMessage::create(['channel_id' => $privateChannel2->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Oh ce serait parfait ! Merci infiniment pour votre temps, Dr. Moussaoui.']);
        ChatMessage::create(['channel_id' => $privateChannel2->id, 'sender_id' => $moussaoui->id, 'content' => 'Je viens de vous envoyer les fichiers sur votre email universitaire. N\'hésitez pas si vous avez des questions lors de vos lectures.']);
        ChatMessage::create(['channel_id' => $privateChannel2->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Bien reçu ! Je commence par l\'article de 2016 sur la privacy-preserving deep learning. Bonne journée !']);

        // Channel PRIVATE — Berrada ↔ Karim
        $privateChannel3 = Channel::create([
            'name'       => 'Prof. Berrada & Karim',
            'slug'       => 'private-berrada-karim-' . (time() + 2),
            'type'       => 'PRIVATE',
            'is_private' => true,
            'user1_id'   => $berrada->id,
            'user2_id'   => $karim->id,
        ]);
        ChatMessage::create(['channel_id' => $privateChannel3->id, 'sender_id' => $berrada->id, 'content' => 'Bonjour Karim ! J\'ai vu votre post sur PlagiaDetect, c\'est un projet très prometteur. Vous cherchez un encadrant académique ?']);
        ChatMessage::create(['channel_id' => $privateChannel3->id, 'sender_id' => $karim->id, 'content' => 'Bonjour Prof. Berrada ! Effectivement, ce serait une grande chance d\'avoir votre expertise sur ce projet. Vous seriez disponible pour un meeting de présentation ?']);
        ChatMessage::create(['channel_id' => $privateChannel3->id, 'sender_id' => $berrada->id, 'content' => 'Bien sûr ! La semaine prochaine je suis disponible Mardi et Jeudi après 14h. Préparez une présentation de 15 min du projet.']);

        // Channel PRIVATE — Yasmine ↔ Salma (New)
        $privateChannel4 = Channel::create([
            'name'       => 'Yasmine & Salma',
            'slug'       => 'private-yasmine-salma-' . (time() + 3),
            'type'       => 'PRIVATE',
            'is_private' => true,
            'user1_id'   => $yasmineRefresh->id,
            'user2_id'   => $salma->id,
        ]);
        ChatMessage::create(['channel_id' => $privateChannel4->id, 'sender_id' => $salma->id, 'content' => 'Coucou Yasmine ! Tu as vu le dernier article de Dr. Moussaoui sur les GANs ?']);
        ChatMessage::create(['channel_id' => $privateChannel4->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Oui ! Je l\'ai lu hier soir. C\'est super intéressant pour notre projet. Tu penses qu\'on peut adapter ça pour notre modèle ?']);
        ChatMessage::create(['channel_id' => $privateChannel4->id, 'sender_id' => $salma->id, 'content' => 'Je pense que oui, mais on a besoin de plus de puissance de calcul. J\'ai demandé au Prof. Mansouri si on pouvait utiliser le serveur du labo.']);
        ChatMessage::create(['channel_id' => $privateChannel4->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Ah génial ! Qu\'est-ce qu\'elle a dit ?']);
        ChatMessage::create(['channel_id' => $privateChannel4->id, 'sender_id' => $salma->id, 'content' => 'Elle est d\'accord ! Elle veut juste qu\'on lui présente un petit plan de ce qu\'on va faire vendredi.']);
        ChatMessage::create(['channel_id' => $privateChannel4->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Super, je vais préparer les slides alors. Merci beaucoup Salma !']);

        // Channel PRIVATE — Yasmine ↔ Mehdi (New)
        $privateChannel5 = Channel::create([
            'name'       => 'Yasmine & Mehdi',
            'slug'       => 'private-yasmine-mehdi-' . (time() + 4),
            'type'       => 'PRIVATE',
            'is_private' => true,
            'user1_id'   => $yasmineRefresh->id,
            'user2_id'   => $mehdi->id,
        ]);
        ChatMessage::create(['channel_id' => $privateChannel5->id, 'sender_id' => $mehdi->id, 'content' => 'Salut Yasmine, tu t\'y connais en déploiement Docker ? J\'ai un souci avec mon container React.']);
        ChatMessage::create(['channel_id' => $privateChannel5->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Salut Mehdi ! Oui un peu, c\'est quoi le problème ?']);
        ChatMessage::create(['channel_id' => $privateChannel5->id, 'sender_id' => $mehdi->id, 'content' => 'En gros, le Hot Module Replacement (HMR) ne fonctionne pas quand je lance avec Docker Compose, je dois rebuild à chaque modification de code.']);
        ChatMessage::create(['channel_id' => $privateChannel5->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Ah, c\'est classique ! Il faut que tu exposes le port HMR (généralement 5173 ou le port WebSocket de Vite) dans ton docker-compose.yml et configures la section \'server\' dans ton fichier \'vite.config.js\' avec usePolling: true.']);
        ChatMessage::create(['channel_id' => $privateChannel5->id, 'sender_id' => $mehdi->id, 'content' => 'Ah mais oui ! Je n\'avais pas configuré le polling du tout. Je teste ça tout de suite.']);
        ChatMessage::create(['channel_id' => $privateChannel5->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Ça marche, tiens-moi au courant si ça résout le problème !']);
        ChatMessage::create(['channel_id' => $privateChannel5->id, 'sender_id' => $mehdi->id, 'content' => 'Ça fonctionne à la perfection ! Tu me sauves la mise, merci infiniment Yasmine !']);

        // Channel PRIVATE — Yasmine ↔ Nadia (New)
        $privateChannel6 = Channel::create([
            'name'       => 'Yasmine & Nadia',
            'slug'       => 'private-yasmine-nadia-' . (time() + 5),
            'type'       => 'PRIVATE',
            'is_private' => true,
            'user1_id'   => $yasmineRefresh->id,
            'user2_id'   => $nadia->id,
        ]);
        ChatMessage::create(['channel_id' => $privateChannel6->id, 'sender_id' => $nadia->id, 'content' => 'Salut Yasmine ! Est-ce que tu as l\'emploi du temps de la semaine prochaine pour les ateliers Power BI du département ?']);
        ChatMessage::create(['channel_id' => $privateChannel6->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Salut Nadia ! Oui, le Prof. Idrissi a dit que ce sera le mardi à 14h dans la salle des serveurs.']);
        ChatMessage::create(['channel_id' => $privateChannel6->id, 'sender_id' => $nadia->id, 'content' => 'Parfait, merci pour l\'info ! Tu comptes y aller ?']);
        ChatMessage::create(['channel_id' => $privateChannel6->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Oui tout à fait, c\'est super utile pour mon projet. On doit présenter nos tableaux de bord bientôt.']);
        ChatMessage::create(['channel_id' => $privateChannel6->id, 'sender_id' => $nadia->id, 'content' => 'Super, on s\'y verra alors ! On pourra bosser ensemble après l\'atelier.']);
        ChatMessage::create(['channel_id' => $privateChannel6->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Avec plaisir ! À mardi.']);

        // Channel PRIVATE — Yasmine ↔ Prof. Berrada (New)
        $privateChannel7 = Channel::create([
            'name'       => 'Yasmine & Prof. Berrada',
            'slug'       => 'private-yasmine-berrada-' . (time() + 6),
            'type'       => 'PRIVATE',
            'is_private' => true,
            'user1_id'   => $yasmineRefresh->id,
            'user2_id'   => $berrada->id,
        ]);
        ChatMessage::create(['channel_id' => $privateChannel7->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Bonjour Prof. Berrada, j\'ai mis à jour la structure de la base de données de Scholar comme vous me l\'avez suggéré lors du dernier point.']);
        ChatMessage::create(['channel_id' => $privateChannel7->id, 'sender_id' => $berrada->id, 'content' => 'Bonjour Yasmine. C\'est très bien. Avez-vous pensé à configurer correctement les index sur les clés étrangères pour optimiser les requêtes ?']);
        ChatMessage::create(['channel_id' => $privateChannel7->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Oui, j\'ai ajouté des index sur user_id et post_id. Les temps de réponse se sont nettement améliorés.']);
        ChatMessage::create(['channel_id' => $privateChannel7->id, 'sender_id' => $berrada->id, 'content' => 'Excellent travail. N\'oubliez pas de profiler vos requêtes SQL pour éviter le problème N+1 sur le feed de posts.']);
        ChatMessage::create(['channel_id' => $privateChannel7->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'C\'est noté, j\'ai installé clockwork pour faire ce profilage dès aujourd\'hui. Merci pour vos conseils !']);

        // Channel PRIVATE — Yasmine ↔ Prof. Laila Mansouri (New)
        $privateChannel8 = Channel::create([
            'name'       => 'Yasmine & Prof. Mansouri',
            'slug'       => 'private-yasmine-mansouri-' . (time() + 7),
            'type'       => 'PRIVATE',
            'is_private' => true,
            'user1_id'   => $yasmineRefresh->id,
            'user2_id'   => $mansouri->id,
        ]);
        ChatMessage::create(['channel_id' => $privateChannel8->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Bonjour Prof. Mansouri, auriez-vous des recommandations de lectures ou de chartes concernant l\'éthique de l\'IA à inclure dans notre rapport de PFE ?']);
        ChatMessage::create(['channel_id' => $privateChannel8->id, 'sender_id' => $mansouri->id, 'content' => 'Bonjour Yasmine. Je vous conseille vivement de consulter la Recommandation sur l\'éthique de l\'IA publiée par l\'UNESCO en 2021. C\'est la référence internationale la plus complète actuellement.']);
        ChatMessage::create(['channel_id' => $privateChannel8->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Merci beaucoup ! C\'est très utile. Je vais l\'intégrer dans notre section sur les limites éthiques et la protection des données.']);
        ChatMessage::create(['channel_id' => $privateChannel8->id, 'sender_id' => $mansouri->id, 'content' => 'C\'est une excellente initiative, Yasmine. Le sujet de la protection des données et de l\'explicabilité est crucial pour un projet universitaire de cette envergure. Bon courage !']);

        // Channel PROJET — PlagiaDetect
        $projectChannel1 = Channel::create([
            'name'       => 'PlagiaDetect — Équipe Projet',
            'slug'       => 'project-plagiadetect-' . $project1->id,
            'type'       => 'PROJECT',
            'is_private' => true,
            'project_id' => $project1->id,
        ]);
        ChatMessage::create(['channel_id' => $projectChannel1->id, 'sender_id' => $karim->id, 'content' => '👋 Bienvenue dans le channel de l\'équipe PlagiaDetect ! Ici on coordonne le développement du projet.']);
        ChatMessage::create(['channel_id' => $projectChannel1->id, 'sender_id' => $salma->id, 'content' => 'Salut ! J\'ai terminé la préparation du dataset. 15,000 documents académiques collectés depuis HAL et arXiv. Accuracy du modèle BERT : 92.3% sur le jeu de test.']);
        ChatMessage::create(['channel_id' => $projectChannel1->id, 'sender_id' => $karim->id, 'content' => 'Excellent travail Salma ! 92.3% c\'est déjà très bien pour un premier itération. On peut l\'améliorer avec du fine-tuning. L\'API Laravel est prête en dev, je push sur le repo.']);
        ChatMessage::create(['channel_id' => $projectChannel1->id, 'sender_id' => $yasmineRefresh->id, 'content' => 'Parfait timing ! J\'ai les maquettes Figma du dashboard prêtes. Je partage le lien : figma.com/plagiadetect-dashboard. Retours bienvenus !']);
        ChatMessage::create(['channel_id' => $projectChannel1->id, 'sender_id' => $moussaoui->id, 'content' => 'Beau travail équipe ! Pour améliorer la détection, regardez aussi du côté des embeddings multilingues de type LaBSE — surtout utile pour les documents mixtes arabe/français.']);

        // Channel PROJET — CampusIoT
        $projectChannel2 = Channel::create([
            'name'       => 'CampusIoT — Coordination',
            'slug'       => 'project-campusiot-' . $project3->id,
            'type'       => 'PROJECT',
            'is_private' => true,
            'project_id' => $project3->id,
        ]);
        ChatMessage::create(['channel_id' => $projectChannel2->id, 'sender_id' => $elfadili->id, 'content' => 'Team CampusIoT ! Les 50 premiers capteurs DHT22 sont installés dans les salles A101 à A150. Les données remontent bien sur ThingsBoard.']);
        ChatMessage::create(['channel_id' => $projectChannel2->id, 'sender_id' => $kettani->id, 'content' => 'J\'ai configuré le firewall pour sécuriser le trafic MQTT. Toutes les communications sont maintenant chiffrées TLS 1.3.']);
        ChatMessage::create(['channel_id' => $projectChannel2->id, 'sender_id' => $youssef->id, 'content' => 'Je commence demain l\'implémentation du broker Mosquitto avec clustering pour la haute disponibilité. Des recommandations Dr. Elfadili ?']);
        ChatMessage::create(['channel_id' => $projectChannel2->id, 'sender_id' => $elfadili->id, 'content' => 'Pour le clustering Mosquitto, regardez EMQX qui est plus performant pour notre scale. Testez d\'abord avec un nœud unique puis montez en charge.']);

        $this->command->info('✅ Channels et messages créés.');

        // ================================================================
        // ÉTAPE 11 : NOTIFICATIONS
        // ================================================================
        $this->command->info('🔔 Étape 11 : Création des notifications...');

        // Notifications pour Yasmine
        Notification::create([
            'user_id'        => $yasmineRefresh->id,
            'type'           => 'CONNECTION_REQUEST',
            'message'        => 'Youssef Radi vous a envoyé une demande de connexion.',
            'reference_id'   => $youssef->id,
            'reference_type' => 'User',
            'is_read'        => false,
        ]);
        Notification::create([
            'user_id'        => $yasmineRefresh->id,
            'type'           => 'CONNECTION_REQUEST',
            'message'        => 'Prof. Fatima Zahra Idrissi vous a envoyé une demande de connexion.',
            'reference_id'   => $idrissi->id,
            'reference_type' => 'User',
            'is_read'        => false,
        ]);
        Notification::create([
            'user_id'        => $yasmineRefresh->id,
            'type'           => 'POST_LIKED',
            'message'        => 'Prof. Hassan Berrada a aimé votre post "Mon stage chez OCP !".',
            'reference_id'   => $studentPosts[0]->id,
            'reference_type' => 'Post',
            'is_read'        => false,
        ]);
        Notification::create([
            'user_id'        => $yasmineRefresh->id,
            'type'           => 'POST_COMMENTED',
            'message'        => 'Karim Benali a commenté votre post "Mon stage chez OCP !".',
            'reference_id'   => $studentPosts[0]->id,
            'reference_type' => 'Post',
            'is_read'        => false,
        ]);
        Notification::create([
            'user_id'        => $yasmineRefresh->id,
            'type'           => 'PROJECT_INVITATION',
            'message'        => 'Vous avez été invitée à rejoindre le projet "PlagiaDetect".',
            'reference_id'   => $project1->id,
            'reference_type' => 'Project',
            'is_read'        => true,
        ]);
        Notification::create([
            'user_id'        => $yasmineRefresh->id,
            'type'           => 'CONNECTION_ACCEPTED',
            'message'        => 'Dr. Rachid Moussaoui a accepté votre demande de connexion.',
            'reference_id'   => $moussaoui->id,
            'reference_type' => 'User',
            'is_read'        => true,
        ]);

        // Notifications pour Karim
        Notification::create([
            'user_id'        => $karim->id,
            'type'           => 'POST_LIKED',
            'message'        => 'Prof. Hassan Berrada a aimé votre post sur PlagiaDetect.',
            'reference_id'   => $studentPosts[2]->id,
            'reference_type' => 'Post',
            'is_read'        => false,
        ]);
        Notification::create([
            'user_id'        => $karim->id,
            'type'           => 'PROJECT_JOIN_REQUEST',
            'message'        => 'Prof. Hassan Berrada souhaite rejoindre votre projet PlagiaDetect.',
            'reference_id'   => $project1->id,
            'reference_type' => 'Project',
            'is_read'        => false,
        ]);

        // Notifications pour les chercheurs
        Notification::create([
            'user_id'        => $moussaoui->id,
            'type'           => 'CONNECTION_REQUEST',
            'message'        => 'Prof. Hassan Berrada vous a envoyé une demande de connexion.',
            'reference_id'   => $berrada->id,
            'reference_type' => 'User',
            'is_read'        => false,
        ]);

        $this->command->info('✅ Notifications créées.');

        // ================================================================
        // RÉSUMÉ FINAL
        // ================================================================
        $this->command->newLine();
        $this->command->info('🎉 ============================================');
        $this->command->info('   MegaSeeder terminé avec succès !');
        $this->command->info('==============================================');
        $this->command->table(
            ['Entité', 'Quantité'],
            [
                ['Utilisateurs conservés', User::whereIn('email', $keepEmails)->count()],
                ['Étudiants créés', 5],
                ['Enseignants créés', 4],
                ['Chercheurs créés', 10],
                ['Posts créés', Post::count()],
                ['Connexions', Connection::count()],
                ['Projets', Project::count()],
                ['Tâches de projet', ProjectTask::count()],
                ['Channels', Channel::count()],
                ['Messages', ChatMessage::count()],
                ['Notifications', Notification::count()],
                ['Likes', Like::count()],
                ['Commentaires', Comment::count()],
            ]
        );
        $this->command->info('🔑 Mot de passe de tous les nouveaux comptes : Password123!');
    }
}
