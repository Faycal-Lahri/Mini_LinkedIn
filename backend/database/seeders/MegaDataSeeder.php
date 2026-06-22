<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\ProjectTask;
use App\Models\Channel;
use App\Models\ChatMessage;

class MegaDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Lancement de MegaDataSeeder...');

        // 0. Nettoyage préliminaire pour éviter les doublons lors des exécutions successives
        $this->command->info('🗑️ Étape 0 : Nettoyage des anciennes données MegaDataSeeder...');
        
        $originalEmails = [
            'admin@iga.ma', 'yasmine@student.ma', 'karim@student.ma', 'salma@student.ma',
            'mehdi@student.ma', 'nadia@student.ma', 'youssef@student.ma', 'h.berrada@iga.ma',
            'f.idrissi@iga.ma', 'o.kettani@iga.ma', 'l.mansouri@iga.ma', 'r.moussaoui@research.ma',
            'a.bensouda@research.ma', 'k.tahiri@research.ma', 'n.hamdouch@research.ma', 's.elfadili@research.ma',
            'm.ouadi@research.ma', 'h.zerari@research.ma', 'z.alaoui@research.ma', 'y.bouazza@research.ma',
            'r.khalidi@research.ma'
        ];

        // Supprimer les utilisateurs créés lors d'anciennes exécutions
        $usersToDelete = User::whereNotIn('email', $originalEmails)->get();
        foreach ($usersToDelete as $user) {
            $user->delete(); // La cascade supprime leurs profils, posts, messages, etc.
        }

        // Supprimer les projets créés par MegaDataSeeder
        $originalProjects = [
            'PlagiaDetect — Plateforme IA de Détection de Plagiat',
            'SmartEdu — Système de Gestion Universitaire Intelligent',
            'CampusIoT — Campus Intelligent par l\'Internet des Objets'
        ];
        Project::whereNotIn('title', $originalProjects)->get()->each(function($project) {
            $project->tasks()->delete();
            $project->memberships()->delete();
            \App\Models\Channel::where('project_id', $project->id)->each(function($ch) {
                $ch->messages()->delete();
                $ch->delete();
            });
            $project->delete();
        });

        // Supprimer les canaux privés de discussion pour les recréer proprement
        Channel::where('type', 'PRIVATE')->get()->each(function($ch) {
            $ch->messages()->delete();
            $ch->delete();
        });

        $this->command->info('✅ Nettoyage terminé.');

        // Assurer l'existence des répertoires de stockage
        Storage::disk('public')->makeDirectory('profiles');
        Storage::disk('public')->makeDirectory('banners');
        Storage::disk('public')->makeDirectory('posts');
        Storage::disk('public')->makeDirectory('posts/covers');

        // Pools d'assets existants sur le serveur
        $avatarPool = [
            'profiles/IEdyJRLXfkklGiz2gdIwWatrVboPv33oA4KZ5Lz1.png',
            'profiles/q76QLGDCldVQSkZFK5d9z1atwT7UbxTtWGy5iWob.png',
            'profiles/rjlBxcLT3I86Dy4OW16gvCBJtwwyymt88iiMHFLk.jpg',
            'profiles/wdf1p4N6tsDPHSrrvl14SRxph5r04BUrDRK98GRS.jpg',
            'profiles/yAO3dBhnoiTcRZouflKA6cchpsvI1bq8LFmXaXto.png',
        ];

        $bannerPool = [
            'banners/D4CZFEmWmZmNzYd1zmd2R2QH53iCvaaNFuhW0lr5.png',
            'banners/E6R92ebAEfzIVxkt61uGMjLvMU6Iwu6gjFeMULMV.jpg',
            'banners/GUJ06IiDEJdnj2vXQgpoUzVWIvDLyyl6gwXmF0Em.png',
            'banners/LczVxnID0481467gnRxxqACfTXtvI7bk8XKUYgUj.jpg',
            'banners/PujJU3HoDNzvslspsnRtNIu0qqCvbXhs6ZpE3JB0.jpg',
            'banners/QZpAHbuXDbetPiVUHWGY6izj7b956EbGwaSnrDnj.png',
            'banners/ShRUiJ5fNuU3CEOCzaCLlEIC24Q6oWiqy3MDOQ3X.jpg',
            'banners/YuOKfAAiDU7g0rXkPguPllaN02HQWd1cL7G4iuph.png',
            'banners/cfdJSVuLaL4Wwf2Q9oZzd3asNfZLgba1ecgWFHvL.jpg',
            'banners/iW33YkX6Ag3SdbVxjenFCCDs9lJATokDcl47S75G.png',
            'banners/utegui0TgQ3yp8yPejrTZO9SuKpkcUqt8iPhKhCZ.jpg',
        ];

        $postImagePool = [
            'posts/IADEo96uCxirljye4h15McA2OvGuRcCi7IovTu29.jpg',
            'posts/f2e5WR4eQWx9fV6EkhfDmV3wV0EZnKhzCfuCmBTy.jpg',
            'posts/wPgnWpLYoAkY8LFmaNFmJfbJcTPGFIA6CWRHz3lq.jpg',
            'posts/covers/Qyrg9OUUkEu0PCV5BdEfrBmSOKytwskdLuWLT84g.jpg',
            'posts/covers/aJfVY6MhuquENiCqKGyEBqRWHvtDTTRcr21LJ1Ch.jpg',
            'posts/covers/epUaYO3qzqlcMCz4lSlqrcEx5BoKwuDAup1h5eCn.png',
            'posts/covers/exHb4NMavhj709H1SGOz5OP36hCnWpeW1RlnUAMo.png',
        ];

        $postPdfPool = [
            'verification_docs/iOHfK16jZ7g6vsMusYFSfOHZW50AICUuNCNewBTZ.pdf',
            'verification_docs/IqZFBDeXJ7siU6FCLwtNRd7XwDdR2nWVXvGpRjYV.pdf',
            'verification_docs/oE8GzrMgdvdnjJsOBfcc7uJGG0GdaEgmz6Y8ufpY.pdf',
            'verification_docs/TNzfGgivxH4red2DM7SKj3MkpeGBWRAQT4sxUcDp.pdf',
        ];

        // 1. Liste de données pour générer les 50 nouveaux utilisateurs
        $firstNamesM = ['Amine', 'Youssef', 'Karim', 'Mehdi', 'Anass', 'Hamza', 'Tarik', 'Reda', 'Khalid', 'Rachid', 'Hassan', 'Omar', 'Adil', 'Samir', 'Nabil', 'Mourad', 'Jamal', 'Mustapha', 'Said', 'Kamel', 'Yassine', 'Faycal', 'Zakaria', 'Ayoub', 'Marouane', 'Oussama', 'Noureddine', 'Abdelilah', 'Jalal', 'Imad'];
        $firstNamesF = ['Yasmine', 'Salma', 'Nadia', 'Laila', 'Fatima Zahra', 'Kenza', 'Sara', 'Meriem', 'Zineb', 'Rim', 'Sofia', 'Ghita', 'Houda', 'Imane', 'Noura', 'Aicha', 'Amina', 'Rabia', 'Malika', 'Khadija', 'Asmae', 'Sanaa', 'Ihssane', 'Oumaima', 'Hajar', 'Chaimae', 'Kaoutar', 'Meryem', 'Soukaina', 'Hasnaa'];
        $lastNames = ['Benali', 'Alaoui', 'Mansouri', 'Fassi', 'Berrada', 'Idrissi', 'Kettani', 'Bensouda', 'Tahiri', 'Hamdouch', 'Elfadili', 'Ouadi', 'Zerari', 'Bouazza', 'Khalidi', 'Tazi', 'Senhaji', 'Filali', 'Amrani', 'Kadiri', 'Bennani', 'Mrabet', 'Belkhayat', 'Cherkaoui', 'Slaoui', 'Daoudi', 'Chraibi', 'Guessous', 'Mezouar', 'El Mansouri', 'Sbai', 'Lahlou', 'Jahidi', 'Gharbi', 'Rami', 'Fellah', 'Sabiri', 'Naji', 'Jabri', 'Habibi'];

        $institutions = ['IGA Casablanca', 'IGA Rabat', 'IGA Marrakech', 'IGA Fès', 'Université Mohammed V', 'Université Cadi Ayyad', 'Université Hassan II', 'ENSAM Meknès', 'ENSA Marrakech', 'CNRST Rabat'];
        
        $fields = [
            'Génie Informatique & Logiciel',
            'Intelligence Artificielle & Machine Learning',
            'Cybersécurité & Cloud Computing',
            'Big Data & Data Engineering',
            'Réseaux & Objets Connectés (IoT)'
        ];

        $departments = [
            'Informatique & Génie Logiciel',
            'Intelligence Artificielle & Data Science',
            'Réseaux & Cybersécurité',
            'Mathématiques Appliquées & Modélisation',
            'Systèmes Embarqués & Internet des Objets',
            'Management Agile & Systèmes d\'Information'
        ];

        $laboratories = [
            'LRIT (Laboratoire de Recherche en Informatique et Télécommunications)',
            'LIM (Laboratoire d\'Informatique et Mathématiques)',
            'LABTIC (Laboratoire des Technologies de l\'Information et de la Communication)',
            'LISI (Laboratoire d\'Ingénierie des Systèmes Informatiques)',
            'Riad Lab (Research in Intelligent and Autonomous Devices)'
        ];

        $locations = ['Casablanca, Maroc', 'Rabat, Maroc', 'Marrakech, Maroc', 'Fès, Maroc', 'Tanger, Maroc', 'Agadir, Maroc', 'Meknès, Maroc'];

        $languagesList = [
            [['language' => 'Arabe', 'level' => 'Natif'], ['language' => 'Français', 'level' => 'Bilingue'], ['language' => 'Anglais', 'level' => 'Courant']],
            [['language' => 'Arabe', 'level' => 'Natif'], ['language' => 'Français', 'level' => 'Bilingue'], ['language' => 'Anglais', 'level' => 'Bilingue']],
            [['language' => 'Arabe', 'level' => 'Natif'], ['language' => 'Français', 'level' => 'Bilingue'], ['language' => 'Anglais', 'level' => 'Courant'], ['language' => 'Espagnol', 'level' => 'Intermédiaire']],
            [['language' => 'Arabe', 'level' => 'Natif'], ['language' => 'Français', 'level' => 'Courant'], ['language' => 'Anglais', 'level' => 'Courant']]
        ];

        $skillsPool = [
            'STUDENT' => [
                'Laravel', 'PHP', 'React.js', 'JavaScript', 'TypeScript', 'TailwindCSS', 'Python', 'Machine Learning', 
                'SQL', 'MySQL', 'MongoDB', 'Docker', 'Git & GitHub', 'Node.js', 'REST APIs', 'Java', 'HTML5 & CSS3', 'Linux'
            ],
            'TEACHER' => [
                'Génie Logiciel', 'Architecture Logicielle', 'Design Patterns', 'UML', 'Java Spring Boot', 'Python Data Science', 
                'Algorithmique', 'Bases de Données Relationnelles', 'Cybersécurité offensive', 'Réseaux informatiques', 
                'Management Agile', 'DevOps & CI/CD', 'Méthodes Numériques', 'Statistiques Avancées'
            ],
            'RESEARCHER' => [
                'Deep Learning', 'Computer Vision', 'Natural Language Processing (NLP)', 'Federated Learning', 'Reinforcement Learning', 
                'Blockchain & Smart Contracts', 'Internet of Things (IoT)', 'Edge Computing', 'Data Lakes & Spark', 'R / RStudio', 
                'MATLAB', 'Calcul Scientifique', 'Analyse Sémantique', 'Cryptographie'
            ]
        ];

        // Créer les 50 nouveaux utilisateurs
        $newUsersCount = 50;
        $createdUsers = [];

        $this->command->info("👤 Étape 1 : Création de {$newUsersCount} nouveaux utilisateurs...");

        for ($i = 0; $i < $newUsersCount; $i++) {
            // Déterminer le rôle
            if ($i < 20) {
                $role = 'STUDENT';
            } elseif ($i < 35) {
                $role = 'TEACHER';
            } else {
                $role = 'RESEARCHER';
            }

            // Choisir le genre et le nom
            $isMale = rand(0, 1) === 0;
            $firstName = $isMale ? $firstNamesM[array_rand($firstNamesM)] : $firstNamesF[array_rand($firstNamesF)];
            $lastName = $lastNames[array_rand($lastNames)];
            
            // Garantir l'unicité de l'email
            $slugName = strtolower(Str::slug($firstName . '.' . $lastName));
            $email = $slugName . '_' . rand(10, 99) . '@' . ($role === 'STUDENT' ? 'student.ma' : ($role === 'TEACHER' ? 'iga.ma' : 'research.ma'));

            // Créer le compte
            $user = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'password' => Hash::make('Password123!'),
                'role' => $role,
                'status' => 'ACTIVE',
                'email_verified' => true,
            ]);

            // Profil de base
            $inst = $institutions[array_rand($institutions)];
            $loc = $locations[array_rand($locations)];
            $ph = '+212 6 ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99);
            
            $profileData = [
                'user_id' => $user->id,
                'institution' => $inst,
                'location' => $loc,
                'phone' => $ph,
                'languages' => $languagesList[array_rand($languagesList)],
                'linkedin_url' => 'https://linkedin.com/in/' . Str::slug($firstName . '-' . $lastName),
                'github_url' => 'https://github.com/' . Str::slug($firstName . '-' . $lastName),
            ];

            if ($role === 'STUDENT') {
                $profileData['field'] = $fields[array_rand($fields)];
                $profileData['study_level'] = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'][rand(0, 4)];
                $profileData['biography'] = "{$firstName} {$lastName}\nÉtudiant(e) en {$profileData['field']} à {$inst}.\n\nPassionné(e) par la technologie, le développement et l'innovation numérique, j'apprends continuellement pour élargir mes compétences techniques. Je recherche activement des opportunités de projets collaboratifs ou de stages pratiques.";
            } elseif ($role === 'TEACHER') {
                $profileData['department'] = $departments[array_rand($departments)];
                $profileData['biography'] = "Pr. {$firstName} {$lastName}\nEnseignant au département {$profileData['department']} — {$inst}.\n\nAvec plusieurs années d'expérience dans l'enseignement et l'accompagnement des étudiants dans le supérieur, je me focalise sur la transmission des bonnes pratiques de l'ingénierie et du développement technologique au Maroc.";
            } else {
                $profileData['department'] = $departments[array_rand($departments)];
                $profileData['laboratory'] = $laboratories[array_rand($laboratories)];
                $profileData['biography'] = "Dr. {$firstName} {$lastName}\nChercheur au laboratoire {$profileData['laboratory']}.\n\nMes recherches actuelles portent sur les innovations technologiques et les théories appliquées aux sciences du numérique. J'ai contribué à plusieurs articles internationaux et projets scientifiques interdisciplinaires.";
            }

            $profile = Profile::create($profileData);

            // Ajouter des compétences
            $userSkills = (array) array_rand(array_flip($skillsPool[$role]), rand(4, 7));
            foreach ($userSkills as $skillName) {
                Skill::create([
                    'profile_id' => $profile->id,
                    'name' => $skillName,
                    'level' => ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'][rand(0, 3)]
                ]);
            }

            // Ajouter des formations (Educations)
            if ($role === 'STUDENT') {
                Education::create([
                    'profile_id' => $profile->id,
                    'school' => $inst,
                    'degree' => str_contains($profileData['study_level'], 'Licence') ? 'Licence' : 'Master',
                    'field_of_study' => $profileData['field'],
                    'city' => explode(',', $loc)[0],
                    'start_date' => '2023-09-01',
                    'description' => 'Parcours de formation théorique et pratique axé sur les technologies de pointe.'
                ]);
            } else {
                Education::create([
                    'profile_id' => $profile->id,
                    'school' => 'Université Mohammed V de Rabat',
                    'degree' => $role === 'TEACHER' ? 'Master / Ingénieur' : 'Doctorat',
                    'field_of_study' => 'Sciences de l\'Ingénieur',
                    'city' => 'Rabat',
                    'start_date' => '2010-09-01',
                    'end_date' => '2014-06-30',
                    'description' => 'Études doctorales approfondies sur les systèmes avancés.'
                ]);
            }

            // Ajouter des expériences (Experiences)
            if ($role === 'STUDENT') {
                Experience::create([
                    'profile_id' => $profile->id,
                    'title' => 'Stagiaire Développeur',
                    'organization' => 'Tech Solutions Maroc',
                    'location' => explode(',', $loc)[0],
                    'start_date' => '2024-07-01',
                    'end_date' => '2024-08-31',
                    'type' => 'INTERNSHIP',
                    'duration' => '2 mois',
                    'description' => 'Intégration au sein de l\'équipe technique, écriture de tests unitaires et développement de nouvelles fonctionnalités.'
                ]);
            } elseif ($role === 'TEACHER') {
                Experience::create([
                    'profile_id' => $profile->id,
                    'title' => 'Enseignant Chercheur',
                    'organization' => $inst,
                    'location' => explode(',', $loc)[0],
                    'start_date' => '2016-09-01',
                    'is_current' => true,
                    'type' => 'TEACHING',
                    'duration' => 'En cours',
                    'description' => 'Enseignement théorique, direction de projets académiques et encadrement de mémoires.'
                ]);
            } else {
                Experience::create([
                    'profile_id' => $profile->id,
                    'title' => 'Chercheur Associé',
                    'organization' => 'CNRST Maroc',
                    'location' => 'Rabat, Maroc',
                    'start_date' => '2018-01-01',
                    'is_current' => true,
                    'type' => 'RESEARCH',
                    'duration' => 'En cours',
                    'description' => 'Développement de prototypes scientifiques, traitement de gros volumes de données et rédaction de publications.'
                ]);

                // Ajouter des publications
                Publication::create([
                    'profile_id' => $profile->id,
                    'title' => 'Nouvelles architectures algorithmiques pour le Web décentralisé',
                    'publisher' => 'Science Review Morocco',
                    'publication_date' => '2024-02-15',
                    'link' => 'https://example.com/publication-pdf'
                ]);
            }

            // Certifications
            Certification::create([
                'profile_id' => $profile->id,
                'title' => $role === 'STUDENT' ? 'AWS Certified Cloud Practitioner' : 'Oracle Certified Professional Java SE',
                'issuing_organization' => $role === 'STUDENT' ? 'Amazon Web Services' : 'Oracle',
                'issue_date' => '2024-01-10',
                'description' => 'Validation officielle des acquis et des compétences d\'ingénierie.'
            ]);

            $createdUsers[] = $user;
        }

        $this->command->info("✅ {$newUsersCount} nouveaux utilisateurs créés.");

        // 2. Étape : S'assurer que TOUS les utilisateurs (anciens et nouveaux, total ~71) ont des photos de profil et de bannières uniques
        $this->command->info('🖼️ Étape 2 : Copie et attribution des avatars et bannières uniques...');

        $allUsers = User::with('profile')->get();

        foreach ($allUsers as $u) {
            $prof = $u->profile;
            if (!$prof) {
                $prof = Profile::create(['user_id' => $u->id]);
            }

            // Si photo_url est null (sauf admin et yasmine qui en ont déjà), lui en attribuer une unique
            if (empty($prof->photo_url)) {
                $srcPhoto = $avatarPool[array_rand($avatarPool)];
                $targetPhoto = $this->copyAsset($srcPhoto, 'profiles');
                if ($targetPhoto) {
                    $prof->photo_url = $targetPhoto;
                }
            }

            // Si website_url (bannière) est null, lui en attribuer une unique
            if (empty($prof->website_url)) {
                $srcBanner = $bannerPool[array_rand($bannerPool)];
                $targetBanner = $this->copyAsset($srcBanner, 'banners');
                if ($targetBanner) {
                    $prof->website_url = $targetBanner;
                }
            }

            $prof->save();
        }

        $this->command->info('✅ Photos de profil et bannières attribuées de manière sécurisée.');

        // 3. Étape : Générer des publications de masse (minimum 10 posts par utilisateur pour les 71 utilisateurs)
        $this->command->info('📝 Étape 3 : Génération de 10 publications par utilisateur (Total : ~710 posts)...');

        $studentTemplates = [
            [
                'title' => 'Mon premier projet d\'application Web !',
                'content' => 'Fier d\'avoir terminé le développement de ma première application web full-stack avec Laravel et React ! Le projet intègre une authentification sécurisée et un tableau de bord en temps réel. #WebDev #Laravel #React',
                'type' => 'UNIVERSITY_PROJECT'
            ],
            [
                'title' => 'Préparation de la certification AWS',
                'content' => 'Je viens de commencer mon parcours d\'apprentissage pour obtenir la certification AWS Cloud Practitioner. Les concepts de scalabilité et de serveurs virtuels (EC2) sont passionnants. Des conseils pour bien me préparer ? #Cloud #AWS #Apprentissage',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Retour sur mon stage d\'été',
                'content' => 'Une expérience incroyable de 2 mois chez un éditeur de logiciels. J\'ai pu travailler sur l\'intégration de services tiers et l\'optimisation de requêtes SQL complexes. Merci à mon tuteur et toute l\'équipe ! #Stage #Expérience #SQL',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Implémentation d\'un modèle Machine Learning',
                'content' => 'Dans le cadre de notre projet académique, nous avons construit un modèle de prédiction du taux de désabonnement client (Churn) en utilisant Random Forest. Les résultats affichent un score F1 de 88%. #DataScience #Python #MachineLearning',
                'type' => 'UNIVERSITY_PROJECT'
            ],
            [
                'title' => 'Le rôle de Git au quotidien',
                'content' => 'Au début, Git paraissait complexe avec ses branches et ses conflits de merge. Aujourd\'hui, c\'est un outil indispensable pour notre travail de groupe. Organiser son code et faire des commits réguliers change la donne ! #Git #GitHub #Collaboration',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Développement mobile : Flutter ou React Native ?',
                'content' => 'Pour notre projet de fin d\'année, nous développons une application mobile universitaire. Nous hésitons encore entre Flutter (Dart) et React Native (JS). Qu\'en pensez-vous pour une équipe de 3 développeurs ? #MobileDev #ReactNative #Flutter',
                'type' => 'UNIVERSITY_PROJECT'
            ],
            [
                'title' => 'Participation au Hackathon de l\'école',
                'content' => '24h intenses de codage et de pitch ! Notre équipe a développé une solution pour optimiser le tri sélectif des déchets à l\'échelle du campus. Fatigués mais extrêmement fiers de notre travail ! #Hackathon #Innovation #Environnement',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Importance du responsive design',
                'content' => 'Une application web doit être aussi belle sur mobile que sur un écran 24 pouces. L\'intégration de Flexbox et Grid CSS est cruciale pour une bonne expérience utilisateur. #CSS #WebDesign #UIUX',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Plateforme de covoiturage pour étudiants',
                'content' => 'Notre projet de groupe : IGA-Share, une application de covoiturage exclusive aux étudiants de notre établissement. C\'est écologique, économique et ça renforce les liens ! Code source disponible sur GitHub. #Covoiturage #React #Laravel',
                'type' => 'UNIVERSITY_PROJECT'
            ],
            [
                'title' => 'Comprendre les APIs REST',
                'content' => 'Les APIs sont le pont entre le front-end et le back-end. Une bonne API doit être documentée, utiliser les bons verbes HTTP (GET, POST, PUT, DELETE) et renvoyer des codes de statut clairs. #APIs #Backend #REST',
                'type' => 'GENERAL'
            ]
        ];

        $teacherTemplates = [
            [
                'title' => 'Introduction aux architectures microservices',
                'content' => 'Aujourd\'hui, nous avons discuté avec mes étudiants de Master des avantages et inconvénients des architectures microservices par rapport aux architectures monolithiques. Un débat passionnant sur la scalabilité et la complexité opérationnelle. #Enseignement #Architecture #Microservices',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Projets de fin d\'études 2025 : sujets disponibles',
                'content' => 'Je propose des sujets de recherche et développement pour les PFE de cette année dans les domaines de l\'IoT, de la détection de vulnérabilités et de la gestion de base de données à grande échelle. Me contacter par message privé pour postuler. #SujetsPFE #Master #IGA',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'L\'importance de l\'UML dans la conception logicielle',
                'content' => 'Coder sans faire de conception, c\'est comme construire une maison sans plan. J\'insiste toujours pour que mes étudiants rédigent des diagrammes de classes et de cas d\'utilisation rigoureux avant d\'écrire la première ligne de code. #UML #Conception #SoftwareEngineering',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Lancement de l\'atelier Programmation Concurrente',
                'content' => 'Ce semestre, nous ouvrons un atelier pratique de programmation parallèle et concurrente avec Java et Go. L\'objectif est de comprendre le multi-threading et de concevoir des systèmes hautement performants. #Java #Go #Programmation',
                'type' => 'GENERAL'
            ]
        ];

        $researcherTemplates = [
            [
                'title' => 'Conférence sur l\'Intelligence Artificielle en Afrique',
                'content' => 'Honoré d\'avoir présenté nos travaux sur le traitement du langage naturel Darija lors de la conférence panafricaine sur l\'IA. Le potentiel de l\'IA pour préserver notre patrimoine linguistique est immense. #NLP #Darija #Recherche',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Recherche sur le Edge Computing dans l\'industrie',
                'content' => 'Nos récents tests de déploiement de modèles de Deep Learning compressés sur microcontrôleurs (TinyML) montrent une réduction de latence de 75% par rapport aux requêtes Cloud. L\'avenir de l\'industrie se joue à la périphérie ! #TinyML #EdgeComputing #DeepLearning',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Nouvel article accepté dans IEEE Sensors',
                'content' => 'Notre travail sur les réseaux de capteurs de précision pour l\'irrigation durable vient d\'être officiellement accepté pour publication. Un grand merci à mes co-auteurs et aux partenaires agricoles pour le déploiement terrain. #Sensors #IoT #Irrigation',
                'type' => 'GENERAL'
            ],
            [
                'title' => 'Le Federated Learning appliqué à la santé',
                'content' => 'Comment entraîner des modèles médicaux robustes tout en préservant à 100% l\'anonymat et la vie privée des patients ? Le Federated Learning est une réponse concrète, permettant de s\'affranchir du partage de données sensibles. #Santé #FederatedLearning #Cybersécurité',
                'type' => 'GENERAL'
            ]
        ];

        // Titres et abstracts d'articles scientifiques (pour SCIENTIFIC_ARTICLE)
        $scientificArticlesData = [
            [
                'title' => 'Une approche hybride de Deep Learning pour la reconnaissance des caractères Tifinagh',
                'journal' => 'Journal of North African Research',
                'doi' => '10.1016/j.jnar.2025.00124',
                'keywords' => 'tamazight, tifinagh, deep learning, CNN, optical character recognition',
                'abstract' => 'Cet article introduit une nouvelle architecture convolutive optimisée pour la reconnaissance optique des caractères (OCR) de l\'alphabet Tifinagh. En combinant un extracteur de caractéristiques ResNet léger et un mécanisme d\'attention locale, notre modèle surpasse les approches de l\'état de l\'art de 2.5% sur le benchmark de l\'IRCAM, avec un taux d\'exactitude de 98.6%.'
            ],
            [
                'title' => 'Optimisation énergétique des réseaux LoRaWAN par contrôle adaptatif de la puissance de transmission',
                'journal' => 'IEEE Internet of Things Journal',
                'doi' => '10.1109/JIOT.2025.04561',
                'keywords' => 'LoRaWAN, IoT, energy efficiency, transmission power, green computing',
                'abstract' => 'Dans les déploiements IoT agricoles à grande échelle, la durée de vie des batteries des capteurs est un enjeu critique. Nous présentons un algorithme distribué d\'ajustement dynamique de puissance (ADR) basé sur le rapport signal-sur-bruit historique. L\'évaluation expérimentale démontre une baisse de consommation d\'énergie de 32% tout en conservant un taux de délivrance de paquets supérieur à 97%.'
            ],
            [
                'title' => 'Blockchain de consortium pour la certification des diplômes universitaires au Maroc',
                'journal' => 'International Journal of Decentralized Systems',
                'doi' => '10.5555/ijds.2024.123',
                'keywords' => 'blockchain, smart contracts, higher education, digital diplomas, credential verification',
                'abstract' => 'La contrefaçon de diplômes universitaires est un problème mondial persistant. Nous concevons et implémentons une blockchain de consortium (basée sur Hyperledger Fabric) regroupant plusieurs universités marocaines. Notre système de smart contracts permet l\'émission cryptographique infalsifiable de attestations de réussite, vérifiables instantanément par des tiers (recruteurs) sans intermédiaire.'
            ],
            [
                'title' => 'Détection d\'intrusions réseau par apprentissage fédéré et anonymisation différentielle',
                'journal' => 'Computers & Security',
                'doi' => '10.1016/j.cose.2025.10234',
                'keywords' => 'cybersecurity, intrusion detection, federated learning, differential privacy, network security',
                'abstract' => 'L\'entraînement collaboratif de modèles de détection d\'intrusions (IDS) se heurte souvent aux contraintes de confidentialité des données réseau internes des entreprises. Cette recherche propose un framework d\'apprentissage fédéré intégrant un mécanisme d\'anonymisation par bruit gaussien (differential privacy). Notre IDS collaboratif atteint une détection de 95.2% des attaques Zero-day tout en prévenant toute fuite de topologies réseau.'
            ],
            [
                'title' => 'Traitement sémantique du dialecte Darija marocain par Transformers pré-entraînés',
                'journal' => 'Proceedings of ACL 2025',
                'doi' => '10.18653/v1/24.acl-main.999',
                'keywords' => 'darija, NLP, transformer, BERT, low-resource languages',
                'abstract' => 'Le dialecte marocain (Darija) pose des défis linguistiques en raison de sa nature orale, de sa morphologie riche et du mélange de langues. Nous présentons DarijaBERT, le plus grand modèle linguistique pré-entraîné à ce jour sur un corpus web Darija de 5 Go. Le modèle affiche des performances record sur les tâches de détection de sentiment, d\'analyse morphologique et de traduction automatique.'
            ],
            [
                'title' => 'Optimisation du trafic urbain à Casablanca par apprentissage par renforcement multi-agents',
                'journal' => 'Transportation Research Part C: Emerging Technologies',
                'doi' => '10.1016/j.trc.2024.08900',
                'keywords' => 'smart cities, traffic light control, reinforcement learning, multi-agent systems, SUMO simulation',
                'abstract' => 'La congestion routière à Casablanca génère d\'importantes pertes économiques et environnementales. Nous proposons un système de contrôle intelligent des feux de signalisation basé sur l\'apprentissage par renforcement coopératif (MARL). Modélisé sous SUMO avec des données réelles d\'intersections, le système réduit les temps d\'attente de 23% par rapport aux cycles de feux fixes classiques.'
            ]
        ];

        foreach ($allUsers as $u) {
            $existingPostsCount = Post::where('author_id', $u->id)->count();
            $postsToCreate = 10 - $existingPostsCount;

            if ($postsToCreate <= 0) {
                continue;
            }

            for ($p = 0; $p < $postsToCreate; $p++) {
                $fileUrl = null;
                $fileUrls = null;
                $mediaType = null;
                $coverImageUrl = null;

                // Décider si l'on ajoute un média (40% de probabilité)
                $hasMedia = rand(1, 10) <= 4;

                if ($hasMedia) {
                    $mediaRandomType = rand(0, 1); // 0: Image, 1: PDF

                    if ($mediaRandomType === 0) {
                        $mediaType = 'IMAGE';
                        $srcImg = $postImagePool[array_rand($postImagePool)];
                        $targetImg = $this->copyAsset($srcImg, 'posts');
                        if ($targetImg) {
                            $fileUrl = $targetImg;
                            $fileUrls = [$targetImg];
                        }
                    } else {
                        $mediaType = 'PDF';
                        $srcPdf = $postPdfPool[array_rand($postPdfPool)];
                        $targetPdf = $this->copyAsset($srcPdf, 'posts');
                        if ($targetPdf) {
                            $fileUrl = $targetPdf;
                            $fileUrls = [$targetPdf];
                        }
                    }
                }

                // Si l'utilisateur est chercheur ou enseignant, lui générer des articles scientifiques
                if (($u->role === 'RESEARCHER' || $u->role === 'TEACHER') && ($p % 2 === 0)) {
                    // Créer un article scientifique
                    $art = $scientificArticlesData[array_rand($scientificArticlesData)];
                    
                    // Assurer qu'il y a un PDF pour les articles scientifiques si pas encore défini
                    if ($mediaType !== 'PDF') {
                        $mediaType = 'PDF';
                        $srcPdf = $postPdfPool[array_rand($postPdfPool)];
                        $targetPdf = $this->copyAsset($srcPdf, 'posts');
                        if ($targetPdf) {
                            $fileUrl = $targetPdf;
                            $fileUrls = [$targetPdf];
                        }
                    }

                    // Attribuer aussi une image de couverture de temps en temps
                    if (rand(0, 1) === 0) {
                        $srcCover = $postImagePool[array_rand($postImagePool)];
                        $targetCover = $this->copyAsset($srcCover, 'posts/covers');
                        if ($targetCover) {
                            $coverImageUrl = $targetCover;
                        }
                    }

                    Post::create([
                        'author_id' => $u->id,
                        'type' => 'SCIENTIFIC_ARTICLE',
                        'content' => $art['abstract'],
                        'article_title' => $art['title'],
                        'journal' => $art['journal'],
                        'doi' => $art['doi'],
                        'keywords' => $art['keywords'],
                        'abstract' => $art['abstract'],
                        'media_type' => $mediaType,
                        'file_url' => $fileUrl,
                        'file_urls' => $fileUrls,
                        'cover_image_url' => $coverImageUrl
                    ]);
                } else {
                    // Créer un post général ou un projet
                    $templates = ($u->role === 'STUDENT') ? $studentTemplates : ($u->role === 'TEACHER' ? $teacherTemplates : $researcherTemplates);
                    $t = $templates[array_rand($templates)];

                    Post::create([
                        'author_id' => $u->id,
                        'type' => $t['type'],
                        'title' => $t['title'],
                        'content' => $t['content'],
                        'media_type' => $mediaType,
                        'file_url' => $fileUrl,
                        'file_urls' => $fileUrls
                    ]);
                }
            }
        }

        $this->command->info('✅ Publications créées avec succès.');

        // 4. Étape : Messagerie de masse (Chat)
        $this->command->info('💬 Étape 4 : Création de canaux de discussion privés et messages...');

        // Récupérer tous les utilisateurs
        $usersArray = User::all();
        $totalUsers = $usersArray->count();
        $channelsCount = 100;
        
        $chatConversations = [
            [
                "Salut ! Tu as pu regarder le sujet de notre projet de développement Laravel ?",
                "Salut, oui ! J'ai cloné le boilerplate de départ. Il y a encore quelques erreurs de configuration de la base de données de mon côté.",
                "Ah oui, c'est classique. Tu as bien copié le fichier `.env.example` en `.env` et configuré le port 3306 ?",
                "Oui, mais MySQL était éteint sur XAMPP... C'est bon, ça fonctionne maintenant ! On commence par créer les migrations ?",
                "Parfait ! Oui, on peut s'occuper de la table des profils et des compétences ce soir. Je te laisse push la première structure."
            ],
            [
                "Bonjour Professeur, j'ai une question concernant l'exercice 3 du TP de modélisation.",
                "Bonjour. Quel aspect vous pose problème ? Est-ce la modélisation des agrégations ?",
                "Oui, je n'arrive pas à faire la différence entre une agrégation simple et une composition dans le schéma de classes.",
                "C'est simple : dans une composition, la vie de l'objet fils dépend de l'objet parent. Si vous supprimez le parent, le fils meurt. Dans une agrégation simple, ils peuvent exister indépendamment.",
                "C'est beaucoup plus clair maintenant, merci pour votre explication rapide !"
            ],
            [
                "Hello ! Tu as vu le dernier article publié par le Dr. Moussaoui sur le Federated Learning ?",
                "Oui, c'est impressionnant. Ils ont réussi à faire baisser la consommation énergétique en combinant de l'adaptation de puissance.",
                "Exactement. Je me demandais si on pouvait appliquer cette approche sur des routeurs grand public.",
                "Ça va être dur car les ressources mémoires sont très limitées. Il faudrait faire du TinyML.",
                "C'est une super piste pour notre sujet de mémoire. On devrait en parler avec notre tuteur."
            ],
            [
                "Félicitations pour ton stage ! Tu as été pris chez OCP ?",
                "Merci beaucoup ! Oui, j'intègre l'équipe Data Analyst début juillet.",
                "Génial ! Tu vas faire de la visualisation ou de l'extraction de données ?",
                "Un peu des deux, je vais travailler sur des dashboards Power BI et faire des scripts Python avec Pandas.",
                "C'est un super sujet. Bon courage pour ton intégration !"
            ],
            [
                "Salut, est-ce que tu es libre pour un appel de groupe demain après les cours ?",
                "Salut ! Oui, vers 17h30 ça te va ? On doit valider les diapos du projet.",
                "Parfait pour moi. J'inviterai aussi le reste de l'équipe.",
                "Ça marche. Pensez à relire la section sur l'architecture système avant l'appel."
            ]
        ];

        // Créer 100 channels privés uniques avec conversations
        $createdChannels = 0;
        for ($c = 0; $c < $channelsCount; $c++) {
            $user1 = $usersArray->random();
            $user2 = $usersArray->reject(fn($usr) => $usr->id === $user1->id)->random();

            // Vérifier s'il y a déjà un canal privé entre eux
            $exists = Channel::where('type', 'PRIVATE')
                ->where(function($q) use ($user1, $user2) {
                    $q->where('user1_id', $user1->id)->where('user2_id', $user2->id);
                })->orWhere(function($q) use ($user1, $user2) {
                    $q->where('user1_id', $user2->id)->where('user2_id', $user1->id);
                })->exists();

            if ($exists) {
                continue;
            }

            $channel = Channel::create([
                'name' => "Chat {$user1->first_name} & {$user2->first_name}",
                'slug' => 'private-' . Str::slug($user1->last_name . '-' . $user2->last_name) . '-' . time() . '-' . rand(100, 999),
                'type' => 'PRIVATE',
                'is_private' => true,
                'user1_id' => $user1->id,
                'user2_id' => $user2->id,
            ]);

            // Ajouter les messages de conversation
            $conversation = $chatConversations[array_rand($chatConversations)];
            foreach ($conversation as $idx => $msgContent) {
                $sender = ($idx % 2 === 0) ? $user1 : $user2;
                ChatMessage::create([
                    'channel_id' => $channel->id,
                    'sender_id' => $sender->id,
                    'content' => $msgContent,
                    'created_at' => now()->subMinutes(count($conversation) - $idx)
                ]);
            }

            $createdChannels++;
        }

        $this->command->info("✅ {$createdChannels} canaux de discussion créés avec des messages historiques.");

        // 5. Étape : Création de 10 nouveaux projets de recherche et tâches
        $this->command->info('📁 Étape 5 : Création de 10 projets et tâches de masse...');

        $projectNames = [
            ['title' => 'IGA-Car : Prototype de voiture autonome miniature', 'type' => 'RESEARCH', 'desc' => 'Conception d\'un mini-véhicule équipé d\'une caméra et de capteurs ultrasons piloté par un Raspberry Pi et un algorithme de suivi de ligne basé sur OpenCV.', 'obj' => 'Faire naviguer de manière autonome un véhicule miniature dans un circuit balisé en évitant les obstacles mobiles.'],
            ['title' => 'CloudNative IGA : Architecture d\'hébergement agile', 'type' => 'ACADEMIC', 'desc' => 'Migration d\'une plateforme universitaire monolithique vers une architecture de microservices conteneurisés déployée sous un cluster Kubernetes.', 'obj' => 'Mettre en place une infrastructure cloud-native résiliente avec CI/CD automatisé et monitoring Grafana.'],
            ['title' => 'DarijaNLP : Analyse de sentiment automatique pour la Darija', 'type' => 'RESEARCH', 'desc' => 'Entraînement de modèles linguistiques basés sur l\'attention pour classer automatiquement les avis et commentaires écrits en Darija marocaine sur les réseaux sociaux.', 'obj' => 'Construire le plus grand dataset labellisé Darija et atteindre une précision de classification de 90%.'],
            ['title' => 'SmartGrid-IGA : Monitoring d\'énergie connecté', 'type' => 'RESEARCH', 'desc' => 'Déploiement de capteurs de puissance connectés en Wi-Fi dans les salles de TP pour collecter, analyser et optimiser la consommation électrique de l\'école.', 'obj' => 'Identifier les anomalies de consommation d\'énergie et réduire de 15% la facture d\'électricité globale.'],
            ['title' => 'WebSecurity-Shield : Outil d\'audit de vulnérabilités', 'type' => 'ACADEMIC', 'desc' => 'Développement d\'une application web permettant de scanner des sites web pour identifier les failles majeures du Top 10 OWASP (SQL injection, XSS, etc.).', 'obj' => 'Permettre aux administrateurs de réaliser des audits de sécurité automatisés simples avec rapports PDF.'],
            ['title' => 'RoboArm : Bras robotique industriel articulé', 'type' => 'ACADEMIC', 'desc' => 'Programmation et impression 3D d\'un bras articulé à 5 degrés de liberté piloté par des servomoteurs et une application Web intuitive.', 'obj' => 'Réaliser des tâches de tri de pièces de couleur par caméra de vision artificielle.'],
            ['title' => 'Morocco-SupplyChain : Traçabilité agricole par Blockchain', 'type' => 'RESEARCH', 'desc' => 'Utilisation d\'Ethereum et d\'un réseau de capteurs de température IoT pour tracer les conditions de transport de denrées périssables depuis les fermes de Souss-Massa.', 'obj' => 'Garantir l\'authenticité et le respect de la chaîne du froid via des transactions immuables.'],
            ['title' => 'E-Learning-Gamification : App d\'apprentissage ludique', 'type' => 'ACADEMIC', 'desc' => 'Plateforme de cours universitaires intégrant des mécaniques de jeux (badges, classements, défis quotidiens, monnaie virtuelle) pour stimuler l\'engagement.', 'obj' => 'Augmenter le taux de complétion des modules de cours de 30% grâce aux techniques d\'engagement.'],
            ['title' => 'FaceRecogn-Gate : Système de contrôle d\'accès par caméra', 'type' => 'ACADEMIC', 'desc' => 'Système de reconnaissance faciale en temps réel connecté à un servomoteur d\'ouverture de porte, pour authentifier les membres du laboratoire.', 'obj' => 'Fournir une solution biométrique de contrôle d\'accès avec logs centralisés.'],
            ['title' => 'AirQuality-Map : Réseau de monitoring de pollution', 'type' => 'RESEARCH', 'desc' => 'Station météo connectée collectant la concentration de particules fines, le CO2 et la température pour dresser une carte interactive de pollution de la ville.', 'obj' => 'Mesurer la qualité de l\'air en temps réel dans les zones industrielles de Casablanca.']
        ];

        $taskTemplates = [
            "Conception du modèle de données et des diagrammes de cas d\'utilisation",
            "Configuration du dépôt GitHub et mise en place de la pipeline CI/CD",
            "Développement de l\'interface front-end responsive",
            "Écriture des contrôleurs d\'API back-end et sécurisation des routes",
            "Collecte de données et nettoyage du dataset initial",
            "Entraînement des modèles et phase de fine-tuning",
            "Réalisation des tests de charge et audit de performance",
            "Rédaction du rapport de projet et préparation de la soutenance",
            "Achat et soudure des composants matériels",
            "Intégration du module de messagerie instantanée"
        ];

        foreach ($projectNames as $pIndex => $pData) {
            $owner = $usersArray->random();

            $project = Project::create([
                'owner_id' => $owner->id,
                'title' => $pData['title'],
                'description' => $pData['desc'],
                'objectives' => $pData['obj'],
                'type' => $pData['type'],
                'status' => 'OPEN',
                'max_members' => rand(4, 8),
                'required_skills' => 'Git, React, Laravel, PHP, Python, Collaboration',
                'conditions' => 'Disponibilité hebdomadaire de 8h requise. Niveau Master ou cycle d\'ingénieurs.'
            ]);

            // Attribuer l'owner comme membre
            ProjectMembership::create([
                'project_id' => $project->id,
                'user_id' => $owner->id,
                'role' => 'OWNER',
                'status' => 'ACCEPTED',
                'joined_at' => now()->subDays(20)
            ]);

            // Ajouter d'autres membres (4 à 6 membres)
            $members = $usersArray->reject(fn($usr) => $usr->id === $owner->id)->random(rand(4, 6));
            foreach ($members as $m) {
                ProjectMembership::create([
                    'project_id' => $project->id,
                    'user_id' => $m->id,
                    'role' => rand(0, 1) === 0 ? 'MEMBER' : 'COLLABORATOR',
                    'status' => 'ACCEPTED',
                    'joined_at' => now()->subDays(rand(1, 15))
                ]);
            }

            // Créer le canal de projet
            $projectChannel = Channel::create([
                'name' => "Projet — " . explode(':', $project->title)[0],
                'slug' => 'project-' . Str::slug(explode(':', $project->title)[0]) . '-' . $project->id,
                'type' => 'PROJECT',
                'is_private' => true,
                'project_id' => $project->id,
            ]);

            // Ajouter des messages de chat de projet
            $projectTeam = array_merge([$owner], $members->all());
            $projMessages = [
                "Bienvenue à tous dans le canal de coordination de notre projet " . $project->title . " ! Commençons par lister les tâches prioritaires.",
                "Merci pour l'invitation ! Je peux m'occuper de la mise en place du front-end React.",
                "Parfait, moi je prends le back-end et les APIs Laravel.",
                "Je vais m'occuper de la recherche documentaire et de la rédaction de notre premier document de conception.",
                "Super ! J'ai déjà écrit la modélisation de la base de données. Je la partage sur notre espace de travail.",
                "Excellent travail d'équipe. Pensez à faire vos branches Git de manière claire pour éviter les conflits."
            ];
            foreach ($projMessages as $mIdx => $mContent) {
                $sender = $projectTeam[array_rand($projectTeam)];
                ChatMessage::create([
                    'channel_id' => $projectChannel->id,
                    'sender_id' => $sender->id,
                    'content' => $mContent,
                    'created_at' => now()->subHours(count($projMessages) - $mIdx)
                ]);
            }

            // Créer 8 à 12 tâches
            $tasksCount = rand(8, 12);
            for ($t = 0; $t < $tasksCount; $t++) {
                $assignee = (rand(0, 4) === 0) ? null : $projectTeam[array_rand($projectTeam)]->id;
                ProjectTask::create([
                    'project_id' => $project->id,
                    'title' => $taskTemplates[($t % count($taskTemplates))],
                    'status' => ['PENDING', 'COMPLETED'][rand(0, 1)],
                    'assigned_to' => $assignee,
                    'description' => 'Tâche de production standard affectée à l\'un des ingénieurs ou développeurs de l\'équipe projet.',
                    'sub_tasks' => [
                        ['title' => 'Sous-tâche 1 : Analyse technique', 'completed' => true],
                        ['title' => 'Sous-tâche 2 : Intégration initiale', 'completed' => rand(0, 1) === 0],
                        ['title' => 'Sous-tâche 3 : Validation des tests', 'completed' => false],
                    ]
                ]);
            }
        }

        $this->command->info('✅ 10 projets et tâches de masse créés.');

        // 6. Étape : Commentaires et réactions dynamiques
        $this->command->info('❤️ Étape 6 : Ajout de réactions et de commentaires dynamiques sur les posts...');

        $postsList = Post::all();
        $usersList = User::all();

        $commentsPool = [
            "Félicitations pour ce travail remarquable !",
            "Sujet très intéressant et d'actualité pour notre secteur.",
            "Bravo à toute l'équipe pour cette superbe réalisation.",
            "Merci pour ce partage et ces conseils précieux !",
            "Une approche très propre et innovante, félicitations.",
            "Excellent ! C'est vraiment inspirant pour notre promotion.",
            "Travail de qualité, la rigueur de l'analyse est impressionnante.",
            "Superbe projet, hâte de voir la démo vidéo !"
        ];

        foreach ($postsList as $post) {
            // Ajouter 5 à 15 likes aléatoires
            $likesCount = rand(5, 15);
            $randomLikers = $usersList->reject(fn($usr) => $usr->id === $post->author_id)->random(min($likesCount, $usersList->count() - 1));
            
            foreach ($randomLikers as $liker) {
                Like::firstOrCreate([
                    'user_id' => $liker->id,
                    'post_id' => $post->id
                ], [
                    'type' => ['LIKE', 'LOVE', 'CLAP', 'INSIGHTFUL'][rand(0, 3)]
                ]);
            }

            // Ajouter 2 à 4 commentaires
            $commCount = rand(2, 4);
            $randomCommenters = $usersList->reject(fn($usr) => $usr->id === $post->author_id)->random(min($commCount, $usersList->count() - 1));

            foreach ($randomCommenters as $commenter) {
                Comment::create([
                    'post_id' => $post->id,
                    'author_id' => $commenter->id,
                    'content' => $commentsPool[array_rand($commentsPool)],
                    'created_at' => now()->subMinutes(rand(10, 180))
                ]);
            }
        }

        $this->command->info('✅ Réactions et commentaires ajoutés.');
        $this->command->info('🎉 Seeder MegaDataSeeder exécuté avec succès à 100% !');
    }

    /**
     * Copier un fichier asset existant vers un nouveau nom unique dans le répertoire cible de stockage public
     */
    private function copyAsset(string $sourcePath, string $targetDir): ?string
    {
        if (!Storage::disk('public')->exists($sourcePath)) {
            return null;
        }
        
        $extension = pathinfo($sourcePath, PATHINFO_EXTENSION);
        $filename = Str::random(40) . '.' . $extension;
        $targetPath = $targetDir . '/' . $filename;
        
        Storage::disk('public')->copy($sourcePath, $targetPath);
        
        return $targetPath;
    }
}
