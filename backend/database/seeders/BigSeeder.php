<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Profile;
use App\Models\Post;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Connection;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\ProjectTask;
use App\Models\Channel;
use App\Models\ChatMessage;
use App\Models\Notification;
use App\Models\Skill;
use App\Models\Experience;
use App\Models\Education;
use App\Models\Publication;

class BigSeeder extends Seeder
{
    private string $password;
    private array $avatarPaths = [];
    private array $bannerPaths = [];

    public function run(): void
    {
        $this->password = Hash::make('Password123!');

        $this->command->info('🚀 BigSeeder démarrage...');
        $this->command->info('🗑️  Nettoyage des anciens utilisateurs...');

        $protected = ['admin@iga.ma', 'yasmine@student.ma'];
        $toDelete  = User::whereNotIn('email', $protected)->get();
        foreach ($toDelete as $u) { $u->delete(); }
        $this->command->info("✅ {$toDelete->count()} utilisateurs supprimés.");

        // Prepare storage dirs
        foreach (['avatars','banners','posts/images','posts/covers'] as $dir) {
            Storage::disk('public')->makeDirectory($dir);
        }

        $this->command->info('🖼️  Téléchargement des images...');
        $this->downloadAssets();

        $this->command->info('🎓 Création des 20 étudiants...');
        $students = $this->createStudents();

        $this->command->info('👨‍🏫 Création des 8 enseignants...');
        $teachers = $this->createTeachers();

        $this->command->info('🔬 Création des 12 chercheurs...');
        $researchers = $this->createResearchers();

        // Update Yasmine profile
        $yasmine = User::where('email', 'yasmine@student.ma')->first();
        if ($yasmine) {
            $this->updateYasmineProfile($yasmine);
            $students[] = $yasmine;
        }

        $allUsers = collect(array_merge($students, $teachers, $researchers));

        $this->command->info('🤝 Création des connexions...');
        $this->createConnections($allUsers);

        $this->command->info('📝 Création des posts généraux...');
        $posts = $this->createGeneralPosts($allUsers);

        $this->command->info('📚 Création des articles scientifiques...');
        $articles = $this->createScientificArticles(array_merge($teachers, $researchers));

        $allPosts = array_merge($posts, $articles);

        $this->command->info('❤️  Likes et commentaires...');
        $this->createLikesAndComments($allUsers, $allPosts);

        $this->command->info('📁 Création des projets...');
        $projects = $this->createProjects(array_merge($teachers, $researchers), $allUsers);

        $this->command->info('💬 Création des channels et messages...');
        $this->createChats($allUsers, $projects, $articles);

        $this->command->info('🔔 Création des notifications...');
        $this->createNotifications($allUsers, $allPosts);

        $this->command->info('');
        $this->command->info('🎉 ==========================================');
        $this->command->info('   BigSeeder terminé avec succès !');
        $this->command->info('==========================================');
        $this->command->table(
            ['Entité', 'Quantité'],
            [
                ['Utilisateurs',   User::count()],
                ['Posts généraux', Post::where('type','GENERAL')->count()],
                ['Articles',       Post::where('type','SCIENTIFIC_ARTICLE')->count()],
                ['Connexions',     Connection::count()],
                ['Projets',        Project::count()],
                ['Likes',          Like::count()],
                ['Commentaires',   Comment::count()],
                ['Channels',       Channel::count()],
                ['Messages',       ChatMessage::count()],
                ['Notifications',  Notification::count()],
            ]
        );
        $this->command->info('🔑 Mot de passe : Password123!');
    }

    // ─── Image downloads ─────────────────────────────────────────────────────

    private function downloadAssets(): void
    {
        for ($i = 1; $i <= 15; $i++) {
            $path = "avatars/av{$i}.jpg";
            if (!Storage::disk('public')->exists($path)) {
                try {
                    $r = Http::timeout(8)->get("https://i.pravatar.cc/300?img={$i}");
                    if ($r->successful()) Storage::disk('public')->put($path, $r->body());
                } catch (\Exception $e) {}
            }
            $this->avatarPaths[] = $path;
        }

        for ($i = 0; $i < 8; $i++) {
            $seed = ($i + 1) * 111;
            $path = "banners/bn{$seed}.jpg";
            if (!Storage::disk('public')->exists($path)) {
                try {
                    $r = Http::timeout(8)->get("https://picsum.photos/seed/{$seed}/1500/300");
                    if ($r->successful()) Storage::disk('public')->put($path, $r->body());
                } catch (\Exception $e) {}
            }
            $this->bannerPaths[] = $path;
        }

        if (empty($this->avatarPaths))  $this->avatarPaths  = ["avatars/av1.jpg"];
        if (empty($this->bannerPaths))  $this->bannerPaths  = ["banners/bn111.jpg"];
    }

    private function avatar(int $i): string { return $this->avatarPaths[$i % count($this->avatarPaths)]; }
    private function banner(int $i): string { return $this->bannerPaths[$i % count($this->bannerPaths)]; }

    private function postImage(string $seed, string $folder = 'posts/images'): ?string
    {
        $path = "{$folder}/img_{$seed}.jpg";
        if (Storage::disk('public')->exists($path)) return $path;
        try {
            $num = abs(crc32($seed)) % 900 + 1;
            $r = Http::timeout(8)->get("https://picsum.photos/seed/{$num}/800/450");
            if ($r->successful()) { Storage::disk('public')->put($path, $r->body()); return $path; }
        } catch (\Exception $e) {}
        return null;
    }

    // ─── Students ────────────────────────────────────────────────────────────

    private function createStudents(): array
    {
        $data = [
            ['Karim','Benali','karim@student.ma','Informatique','Master 2','Casablanca'],
            ['Salma','Idrissi','salma@student.ma','Data Science','Master 1','Rabat'],
            ['Mehdi','Tazi','mehdi@student.ma','Génie Logiciel','Licence 3','Fès'],
            ['Nadia','Chraibi','nadia@student.ma','IA & Machine Learning','Master 2','Marrakech'],
            ['Youssef','Amrani','youssef@student.ma','Cybersécurité','Master 1','Agadir'],
            ['Imane','Bakkali','imane@student.ma','Développement Web','Licence 3','Casablanca'],
            ['Omar','Filali','omar@student.ma','Réseaux','Master 2','Rabat'],
            ['Zineb','Laarbi','zineb@student.ma','Systèmes Embarqués','Master 1','Meknès'],
            ['Amine','Ouali','amine@student.ma','Cloud Computing','Master 2','Casablanca'],
            ['Hiba','Naciri','hiba@student.ma','Bioinformatique','Doctorat 1','Rabat'],
            ['Soufiane','Kettani','soufiane@student.ma','Informatique Décisionnelle','Master 2','Salé'],
            ['Fatima','Ziani','fatima@student.ma','Vision par Ordinateur','Master 1','Oujda'],
            ['Tarik','Berrada','tarik@student.ma','Blockchain','Licence 3','Casablanca'],
            ['Chaima','Alami','chaima@student.ma','NLP','Master 2','Rabat'],
            ['Reda','Mansouri','reda@student.ma','Développement Mobile','Licence 3','Fès'],
            ['Sara','Tahiri','sara@student.ma','UX/UI Design','Master 1','Casablanca'],
            ['Bilal','Raji','bilal@student.ma','Systèmes d\'Info.','Master 2','Kénitra'],
            ['Layla','Bennani','layla@student.ma','Géomatique & SIG','Master 1','Marrakech'],
            ['Hamza','Idali','hamza@student.ma','DevOps','Master 2','Tanger'],
            ['Rim','Boukhris','rim@student.ma','Mathématiques App.','Master 1','Rabat'],
        ];

        $bios = [
            'Passionné(e) par la technologie et l\'innovation numérique. En quête de nouvelles opportunités.',
            'Étudiant(e) motivé(e) avec une forte curiosité intellectuelle. Toujours prêt(e) à relever de nouveaux défis.',
            'Futur ingénieur spécialisé dans les nouvelles technologies. Actif dans plusieurs clubs scientifiques.',
            'Développeur(se) passionné(e) par l\'open source et les architectures cloud-native.',
            'Chercheur(se) en herbe, intéressé(e) par l\'intersection entre l\'IA et les sciences sociales.',
        ];

        $users = [];
        foreach ($data as $i => [$fn, $ln, $email, $field, $level, $city]) {
            if (User::where('email', $email)->exists()) continue;
            $user = User::create(['first_name'=>$fn,'last_name'=>$ln,'email'=>$email,'password'=>$this->password,'role'=>'STUDENT','status'=>'ACTIVE']);
            $profile = Profile::create([
                'user_id'=>$user->id, 'photo_url'=>$this->avatar($i),
                'website_url'=>$this->banner($i), 'institution'=>'IGA Maroc',
                'field'=>$field, 'study_level'=>$level, 'department'=>'Informatique & Numérique',
                'biography'=>$bios[$i % count($bios)], 'location'=>$city,
                'phone'=>'+212 6'.rand(10000000,99999999), 'languages'=>['Arabe','Français','Anglais'],
            ]);
            $this->skills($profile, $field);
            $this->education($profile, $field, $level);
            $this->studentExp($profile, $i);
            $users[] = $user;
        }
        return $users;
    }

    // ─── Teachers ────────────────────────────────────────────────────────────

    private function createTeachers(): array
    {
        $data = [
            ['Hassan','Berrada','h.berrada@iga.ma','Informatique','Professeur en Algorithmique & Structures de Données'],
            ['Fatima','Idrissi','f.idrissi@iga.ma','Data Science','Maître de Conférences en Machine Learning'],
            ['Omar','Kettani','o.kettani@iga.ma','Réseaux','Professeur en Sécurité des Systèmes d\'Information'],
            ['Laila','Mansouri','l.mansouri@iga.ma','IA & Machine Learning','Professeure en Intelligence Artificielle'],
            ['Youssef','El Filali','y.filali@iga.ma','Génie Logiciel','Professeur en Génie Logiciel & DevOps'],
            ['Khadija','Tahiri','k.tahiri@iga.ma','Cloud Computing','Maître de Conférences en Architecture Cloud'],
            ['Rachid','Amrani','r.amrani@iga.ma','Développement Mobile','Professeur en Développement Mobile & IoT'],
            ['Siham','Laaroussi','s.laaroussi@iga.ma','Mathématiques','Professeure en Mathématiques Appliquées'],
        ];
        $users = [];
        foreach ($data as $i => [$fn, $ln, $email, $dept, $title]) {
            if (User::where('email', $email)->exists()) continue;
            $user = User::create(['first_name'=>$fn,'last_name'=>$ln,'email'=>$email,'password'=>$this->password,'role'=>'TEACHER','status'=>'PENDING']);
            $profile = Profile::create([
                'user_id'=>$user->id,'photo_url'=>$this->avatar($i+20),'website_url'=>$this->banner(($i+3)%8),
                'institution'=>'IGA Maroc','field'=>$dept,'department'=>$dept,
                'biography'=>"{$title} à l'IGA Maroc. Spécialiste en {$dept}, avec ".rand(8,20)." ans d'expérience.",
                'location'=>collect(['Casablanca','Rabat','Marrakech','Fès'])->random(),
                'phone'=>'+212 6'.rand(10000000,99999999),'languages'=>['Arabe','Français','Anglais'],
                'linkedin_url'=>'https://linkedin.com/in/'.strtolower($fn).'-'.strtolower($ln),
            ]);
            $this->skills($profile, $dept);
            $this->education($profile, $dept, 'Doctorat');
            $this->teacherExp($profile, $title, $i);
            $this->publications($profile, $i, $dept);
            $users[] = $user;
        }
        return $users;
    }

    // ─── Researchers ─────────────────────────────────────────────────────────

    private function createResearchers(): array
    {
        $data = [
            ['Rachid','Moussaoui','r.moussaoui@research.ma','LIM','Apprentissage Fédéré & Vie Privée'],
            ['Zineb','Alaoui','z.alaoui@research.ma','LMSA','Big Data & Analytics'],
            ['Mohamed','Chakir','m.chakir@research.ma','LABTIC','NLP & Traitement du Langage'],
            ['Houda','Benmoussa','h.benmoussa@research.ma','LARIT','Vision par Ordinateur'],
            ['Adil','Zeroual','a.zeroual@research.ma','IRF-SIC','Cybersécurité & Cryptographie'],
            ['Meryem','Qbadou','m.qbadou@research.ma','LISTA','IoT & Systèmes Intelligents'],
            ['Kamal','Eddine','k.eddine@research.ma','LIMIARF','Optimisation & Algorithmes Évolutionnaires'],
            ['Amina','Lahbabi','a.lahbabi@research.ma','LARI','Bioinformatique & Génomique Computationnelle'],
            ['Yassine','Benchekroun','y.benchekroun@research.ma','LIM','Cloud Computing & Edge Computing'],
            ['Nour','El Amine','n.elamine@research.ma','LRIAD','Apprentissage par Renforcement'],
            ['Badr','Soulaymani','b.soulaymani@research.ma','LABTIC','Blockchain & Systèmes Décentralisés'],
            ['Sanae','El Haddad','s.elhaddad@research.ma','LRIT','Fouille de Données & Recommandation'],
        ];
        $users = [];
        foreach ($data as $i => [$fn, $ln, $email, $lab, $field]) {
            if (User::where('email', $email)->exists()) continue;
            $user = User::create(['first_name'=>$fn,'last_name'=>$ln,'email'=>$email,'password'=>$this->password,'role'=>'RESEARCHER','status'=>'PENDING']);
            $profile = Profile::create([
                'user_id'=>$user->id,'photo_url'=>$this->avatar($i+28),'website_url'=>$this->banner(($i+1)%8),
                'institution'=>'IGA Maroc','field'=>$field,'department'=>$field,'laboratory'=>$lab,
                'biography'=>"Dr. {$fn} {$ln} est chercheur(se) au laboratoire {$lab}. Ses travaux portent sur {$field}. ".rand(10,45)." publications internationales.",
                'location'=>collect(['Casablanca','Rabat','Fès','Marrakech','Agadir'])->random(),
                'phone'=>'+212 6'.rand(10000000,99999999),'languages'=>['Arabe','Français','Anglais'],
                'linkedin_url'=>'https://linkedin.com/in/dr-'.strtolower($fn).'-'.strtolower($ln),
                'github_url'=>'https://github.com/'.strtolower($fn).strtolower($ln),
            ]);
            $this->skills($profile, $field);
            $this->education($profile, $field, 'Doctorat');
            $this->researcherExp($profile, $lab, $field);
            $this->publications($profile, $i + 8, $field);
            $users[] = $user;
        }
        return $users;
    }

    // ─── Profile helpers ─────────────────────────────────────────────────────

    private function skills(Profile $profile, string $field): void
    {
        $map = [
            'Informatique'          => ['Python','Java','C++','Algorithmes','SQL'],
            'Data Science'          => ['Python','R','TensorFlow','Pandas','Tableau'],
            'IA & Machine Learning' => ['PyTorch','Scikit-learn','Deep Learning','Keras','NLP'],
            'Cybersécurité'         => ['Pentesting','Cryptographie','SIEM','Firewall','CTF'],
            'Cloud Computing'       => ['AWS','Azure','Kubernetes','Docker','Terraform'],
            'Génie Logiciel'        => ['Git','Agile/Scrum','CI/CD','UML','Design Patterns'],
            'Réseaux'               => ['TCP/IP','Cisco','VPN','SDN','Wireshark'],
            'Développement Mobile'  => ['Flutter','React Native','Android','iOS','Firebase'],
            'NLP'                   => ['BERT','Transformers','spaCy','Hugging Face','Regex'],
            'Blockchain'            => ['Solidity','Ethereum','Web3.js','Smart Contracts','DeFi'],
            'Vision par Ordinateur' => ['OpenCV','YOLO','MediaPipe','GANs','TFLite'],
            'Bioinformatique'       => ['BioPython','R Bioconductor','BLAST','Genome Assembly','ML'],
        ];
        $names = $map[$field] ?? ['Python','SQL','Linux','Git','LaTeX'];
        $levels = ['Débutant','Intermédiaire','Avancé','Expert'];
        foreach ($names as $name) {
            Skill::create(['profile_id'=>$profile->id,'name'=>$name,'level'=>$levels[array_rand($levels)],'is_autoformation'=>(bool)rand(0,1)]);
        }
    }

    private function education(Profile $profile, string $field, string $level): void
    {
        $schools = ['IGA Maroc','ENSIAS','ENSA Rabat','Université Mohammed V','INPT','Université Hassan II'];
        Education::create([
            'profile_id'    => $profile->id,
            'school'        => $schools[array_rand($schools)],
            'degree'        => str_contains($level,'Doctorat') ? 'Doctorat' : (str_contains($level,'Master') ? 'Master' : 'Licence'),
            'field_of_study'=> $field,
            'city'          => collect(['Casablanca','Rabat','Marrakech','Fès','Agadir'])->random(),
            'start_date'    => date('Y-m-d', strtotime('-'.rand(2,6).' years')),
            'end_date'      => str_contains($level,'2') ? null : date('Y-m-d', strtotime('-'.rand(0,2).' years')),
            'description'   => "Formation en {$field}. Projets académiques et mémoire de recherche.",
        ]);
    }

    private function studentExp(Profile $profile, int $idx): void
    {
        $companies = ['OCP Group','Maroc Telecom','Bank Al-Maghrib','HPS','Intelcia','Vermeg','CGI','IBM Maroc'];
        $roles     = ['Stagiaire Développeur','Stagiaire Data Analyst','Assistant Recherche','Développeur Junior','Stagiaire DevOps'];
        $types     = ['INTERNSHIP','RESEARCH','OTHER'];
        Experience::create([
            'profile_id'  => $profile->id,
            'title'       => $roles[$idx % count($roles)],
            'organization'=> $companies[$idx % count($companies)],
            'location'    => collect(['Casablanca','Rabat','Marrakech'])->random(),
            'start_date'  => date('Y-m-d', strtotime('-'.rand(6,18).' months')),
            'end_date'    => date('Y-m-d', strtotime('-'.rand(0,5).' months')),
            'is_current'  => rand(0,3) === 0,
            'type'        => $types[array_rand($types)],
            'description' => 'Participation à des projets de développement, collaboration en équipe Agile.',
        ]);
    }

    private function teacherExp(Profile $profile, string $title, int $idx): void
    {
        Experience::create([
            'profile_id'  => $profile->id,
            'title'       => $title,
            'organization'=> 'IGA Maroc',
            'location'    => 'Casablanca',
            'start_date'  => date('Y-m-d', strtotime('-'.rand(8,20).' years')),
            'end_date'    => null,
            'is_current'  => true,
            'type'        => 'TEACHING',
            'description' => 'Cours magistraux, travaux dirigés, encadrement de mémoires.',
        ]);
        if (rand(0,1)) {
            Experience::create([
                'profile_id'  => $profile->id,
                'title'       => 'Consultant Expert',
                'organization'=> collect(['OCP','Maroc Telecom','CIH Bank','Inwi'])->random(),
                'location'    => 'Casablanca',
                'start_date'  => date('Y-m-d', strtotime('-3 years')),
                'end_date'    => date('Y-m-d', strtotime('-1 year')),
                'is_current'  => false,
                'type'        => 'OTHER',
                'description' => 'Mission de conseil et d\'audit technique.',
            ]);
        }
    }

    private function researcherExp(Profile $profile, string $lab, string $field): void
    {
        Experience::create([
            'profile_id'  => $profile->id,
            'title'       => 'Chercheur Associé',
            'organization'=> "Laboratoire {$lab} - IGA Maroc",
            'location'    => 'Casablanca',
            'start_date'  => date('Y-m-d', strtotime('-'.rand(3,8).' years')),
            'end_date'    => null,
            'is_current'  => true,
            'type'        => 'RESEARCH',
            'description' => "Recherches sur {$field}. Encadrement de thèses, publications internationales.",
        ]);
        Experience::create([
            'profile_id'  => $profile->id,
            'title'       => 'Post-Doctorant',
            'organization'=> collect(['Université Paris-Saclay','MIT','INRIA','EPFL','U. Montréal'])->random(),
            'location'    => collect(['Paris','Boston','Grenoble','Lausanne','Montréal'])->random(),
            'start_date'  => date('Y-m-d', strtotime('-'.rand(5,10).' years')),
            'end_date'    => date('Y-m-d', strtotime('-'.rand(2,4).' years')),
            'is_current'  => false,
            'type'        => 'OTHER',
            'description' => "Recherche post-doctorale en {$field} dans une institution internationale.",
        ]);
    }

    private function publications(Profile $profile, int $idx, string $field = ''): void
    {
        $journals = ['IEEE Trans. Neural Networks','Nature Machine Intelligence','ACM Computing Surveys',
                     'Pattern Recognition Letters','Neurocomputing','Expert Systems with Applications',
                     'Information Sciences','Journal of Big Data','Computers & Security'];
        $titles = [
            "Deep Learning approach for ".($field ?: 'signal classification'),
            "Federated Learning with Differential Privacy in ".($field ?: 'distributed systems'),
            "A Comparative Study of ".($field ?: 'classification algorithms')." in Large-Scale Datasets",
            "Transformer-Based Model for ".($field ?: 'sequence prediction'),
            "Ensemble Methods for Anomaly Detection in ".($field ?: 'IoT environments'),
        ];
        for ($p = 0; $p < rand(2,4); $p++) {
            Publication::create([
                'profile_id'       => $profile->id,
                'title'            => $titles[$p % count($titles)],
                'publisher'        => $journals[($idx + $p) % count($journals)],
                'publication_date' => date('Y-m-d', strtotime('-'.rand(0,4).' years')),
                'description'      => "Article publié dans ".$journals[($idx + $p) % count($journals)],
                'link'             => 'https://doi.org/10.'.rand(1000,9999).'/'.rand(10000,99999),
            ]);
        }
    }

    private function updateYasmineProfile(User $yasmine): void
    {
        $profile = $yasmine->profile ?? Profile::create(['user_id' => $yasmine->id]);
        $profile->update([
            'photo_url'=>$this->avatar(0),'website_url'=>$this->banner(0),
            'institution'=>'IGA Maroc','field'=>'Data Science & IA',
            'study_level'=>'Master 2','department'=>'Informatique',
            'biography'=>'Étudiante passionnée en Data Science et IA à l\'IGA Maroc.',
            'location'=>'Casablanca','phone'=>'+212 661234567','languages'=>['Arabe','Français','Anglais'],
        ]);
        if ($profile->skills()->count() === 0) $this->skills($profile, 'Data Science');
        if ($profile->experiences()->count() === 0) $this->studentExp($profile, 0);
    }

    // ─── Connections ─────────────────────────────────────────────────────────

    private function createConnections($allUsers): void
    {
        $ids = $allUsers->pluck('id')->toArray();
        $cnt = 0;
        foreach ($ids as $uid) {
            $others = array_filter($ids, fn($id) => $id !== $uid);
            shuffle($others);
            foreach (array_slice($others, 0, rand(8,12)) as $tid) {
                $exists = Connection::where(fn($q)=>$q->where('sender_id',$uid)->where('receiver_id',$tid))
                    ->orWhere(fn($q)=>$q->where('sender_id',$tid)->where('receiver_id',$uid))->exists();
                if (!$exists) { Connection::create(['sender_id'=>$uid,'receiver_id'=>$tid,'status'=>'ACCEPTED']); $cnt++; }
            }
        }
        $this->command->info("✅ {$cnt} connexions créées.");
    }

    // ─── General Posts ────────────────────────────────────────────────────────

    private function createGeneralPosts($allUsers): array
    {
        $contents = [
            "🚀 Je viens de terminer mon projet de fin d'études sur l'apprentissage automatique appliqué à la détection de fraudes bancaires. Très fier du résultat ! #MachineLearning #FinTech",
            "📚 Partage de ressources : voici les 5 cours en ligne incontournables pour maîtriser Python en 2024. Que vous soyez débutant ou expert, il y en a pour tous les niveaux !",
            "💡 Réflexion du jour : l'IA ne remplacera pas les développeurs, elle amplifiera leurs capacités. Notre valeur réside dans notre créativité et notre pensée critique. #IA",
            "🎓 Félicitations à toute la promo 2024 de l'IGA Maroc ! Quelle aventure incroyable ces deux ans de master. Fiers de vous tous ! #IGA #Promotion2024",
            "🔧 Tutoriel : Comment déployer une application FastAPI sur AWS Lambda avec Docker. Lien dans les commentaires ! #Python #AWS #Serverless",
            "📊 Résultats fascinants de ma recherche sur les algorithmes de clustering. Le K-Means reste efficace mais le DBSCAN brille pour les données non-convexes.",
            "🌐 Je cherche des collaborateurs pour un projet open source sur la détection de deepfakes. DM si intéressé ! #OpenSource #DeepLearning",
            "🏆 Notre équipe a remporté le 1er prix au Hackathon National IA 2024 ! Merci à tous les membres pour leur implication. #Hackathon #IA #Innovation",
            "📝 Publication de mon article sur l'optimisation des hyperparamètres par recherche bayésienne. Disponible sur arXiv. #RechercheSci #MachineLearning",
            "🎯 Tips pour réussir son entretien technique en Data Science : 1) Fondamentaux stat 2) LeetCode 3) Portfolio solide. Thread 👇",
            "🔐 Après 6 mois de bug bounty, j'ai découvert une vulnérabilité critique dans une application web. Responsable disclosure effectuée. #Cybersécurité",
            "☁️ Migration de notre infrastructure vers Kubernetes : 40% de coûts en moins, 99.9% de disponibilité. Retour d'expérience après 3 mois. #DevOps",
            "🤖 Démonstration de mon chatbot multilingue en Darija, Français et Anglais. Basé sur llama-3 fine-tuné sur un corpus marocain. #NLP #LLM",
            "📱 Notre app mobile de gestion de rendez-vous médicaux vient d'atteindre 10 000 téléchargements ! #MobileDev #HealthTech",
            "🔬 Fasciné par les dernières avancées en bioinformatique computationnelle. Le séquençage nanopore ouvre des possibilités incroyables pour la médecine de précision.",
            "💻 Code review best practices : j'ai compilé les erreurs les plus courantes. Un thread pour tous les développeurs ! #CodeQuality",
            "🌍 Retour de la Conférence Internationale sur l'IA à Paris. Quelques insights sur l'IA responsable et les modèles multimodaux.",
            "📈 Mon projet de prédiction des prix immobiliers au Maroc avec Random Forest : R² = 0.87. Les données OpenStreetMap + scraping ont été clés. #DataScience",
            "🎉 Bonne nouvelle ! J'ai été accepté pour un stage de recherche au CNRS Paris en Computer Vision. #Stage #Recherche",
            "⚡ Optimisation de requêtes SQL : de 45 secondes à 0.3 secondes grâce à l'indexation. Incroyable ! #SQL #Performance",
            "🧠 Exploration des réseaux de neurones biologiquement plausibles. La connexion entre neurosciences et deep learning est fascinante.",
            "🔗 Blockchain pour la traçabilité alimentaire : notre POC avec Hyperledger Fabric est opérationnel. #Blockchain #FoodTech",
            "📸 Visite de l'École Polytechnique de Montréal pour une collaboration de recherche. Le MILA est une source d'inspiration ! #Canada",
            "🚗 Simulation d'un algorithme de navigation autonome dans un environnement 3D. Prochaine étape : tester sur un vrai robot. #Robotique",
            "💬 Débat ouvert : REST vs GraphQL en 2024. Je penche pour GraphQL pour les APIs complexes, mais REST reste roi pour la simplicité.",
            "🎸 Important : l'équilibre vie pro/perso est essentiel. Même les passionnés d'informatique ont besoin de déconnecter !",
            "📦 Docker tip : utilisez les multi-stage builds pour réduire la taille de vos images de 80%. Exemple dans les commentaires. #Docker",
            "🔍 Analyse comparative de 10 frameworks de ML en Python. Résultats surprenants sur la performance et la facilité d'utilisation. #MLOps",
            "🌟 Félicitations à notre équipe pour la publication dans IEEE Transactions ! Un travail collectif de 18 mois récompensé. #IEEE",
            "🎓 Conseil aux étudiants : contribuez à l'open source dès le L2. Rien ne vaut une vraie expérience collaborative pour votre CV !",
        ];

        $seeds = ['programming','python','data','cloud','network','security','mobile','web','ai',
                  'blockchain','nlp','vision','robotics','chemistry','biology','physics','engineering'];
        $ids = $allUsers->pluck('id')->toArray();
        $posts = [];

        foreach ($contents as $i => $content) {
            $authorId = $ids[$i % count($ids)];
            $fileUrl = null;
            if (rand(0,2) !== 0) {
                $fileUrl = $this->postImage($seeds[$i % count($seeds)].'_'.$i);
            }
            $posts[] = Post::create([
                'author_id'  => $authorId,
                'content'    => $content,
                'type'       => 'GENERAL',
                'media_type' => $fileUrl ? 'IMAGE' : null,
                'file_url'   => $fileUrl,
                'created_at' => now()->subDays(rand(0,90))->subHours(rand(0,23)),
                'updated_at' => now()->subDays(rand(0,10)),
            ]);
        }

        $this->command->info("✅ ".count($posts)." posts généraux créés.");
        return $posts;
    }

    // ─── Scientific Articles ──────────────────────────────────────────────────

    private function createScientificArticles(array $academics): array
    {
        $articles = [
            ['OptimLake : Optimisation des Requêtes dans les Architectures Lakehouse',
             'Les architectures Lakehouse combinent la flexibilité des data lakes et les performances des data warehouses. Nous proposons OptimLake, un système d\'optimisation basé sur l\'apprentissage par renforcement qui apprend dynamiquement les stratégies de partitionnement, d\'indexation et de mise en cache optimales.',
             'IEEE Transactions on Big Data','10.1109/TBDATA.2024.00789','Lakehouse, RL, Big Data','data-lake'],
            ['FedPriv : Apprentissage Fédéré avec Confidentialité Différentielle Adaptative',
             'Nous proposons FedPriv, un protocole FL adaptatif qui calibre dynamiquement le bruit de confidentialité différentielle en fonction de la sensibilité locale des données.',
             'Nature Machine Intelligence','10.1038/s42256-024-00892-3','FL, DP, IoT, RGPD','federated'],
            ['DarijaFormer : Modèle de Langage Pré-entraîné pour le Dialecte Marocain Darija',
             'Nous présentons DarijaFormer, un modèle Transformer pré-entraîné sur 15 GB de textes Darija collectés depuis les réseaux sociaux, forums et transcriptions orales.',
             'ACM Transactions on Asian NLP','10.1145/3634567.3634890','NLP, Darija, Transformers','nlp-arabic'],
            ['DeepSkin : Détection Précoce du Mélanome par Vision Profonde',
             'Nous proposons DeepSkin, un pipeline de diagnostic automatique basé sur EfficientNet-B7 combiné à des techniques d\'augmentation de données synthétiques (StyleGAN3).',
             'Medical Image Analysis','10.1016/j.media.2024.103012','Vision, Mélanome, GANs','medical-ai'],
            ['QuantumSafe-IoT : Protocoles Cryptographiques Post-Quantiques pour l\'IoT',
             'Nous proposons QuantumSafe-IoT, une suite de protocoles cryptographiques post-quantiques (CRYSTALS-Kyber, FALCON) adaptés aux contraintes mémoire des dispositifs IoT.',
             'IEEE Internet of Things Journal','10.1109/JIOT.2024.3412567','IoT, Crypto, NIST','iot-security'],
            ['GreenCloud : Ordonnancement Énergétique dans les Data Centers',
             'GreenCloud, un algorithme d\'ordonnancement multi-objectif basé sur NSGA-III qui minimise simultanément la consommation d\'énergie, les violations de SLA et les émissions CO₂.',
             'IEEE Trans. Cloud Computing','10.1109/TCC.2024.3389012','Cloud, Green IT, NSGA-III','cloud-green'],
            ['GraphFraud : Détection de Fraudes Financières par GNN Hétérogènes',
             'GraphFraud, une architecture Graph Neural Network hétérogène combinant HAN et HGCN pour capturer les relations multi-relationnelles entre clients, marchands et transactions.',
             'Expert Systems with Applications','10.1016/j.eswa.2024.123456','GNN, Fraude, Finance','fraud-graph'],
            ['SoilSense : Prédiction de la Fertilité des Sols Marocains par ML',
             'SoilSense, un système de prédiction de la fertilité basé sur la spectroscopie NIR et des modèles d\'ensemble (XGBoost, LightGBM). Évalué sur 2400 échantillons de 12 régions marocaines.',
             'Computers and Electronics in Agriculture','10.1016/j.compag.2024.109876','Agriculture, ML, Sol, Maroc','agriculture'],
            ['SecureChain : Traçabilité Pharmaceutique par Blockchain Permissionnée',
             'SecureChain, un framework basé sur Hyperledger Fabric intégrant des QR codes cryptographiques et des smart contracts pour assurer l\'authenticité dans la chaîne pharmaceutique.',
             'Int. Journal of Information Management','10.1016/j.ijinfomgt.2024.102789','Blockchain, Pharma, Santé','blockchain-health'],
            ['AdaptEmo : Reconnaissance Adaptative des Émotions Multimodales',
             'AdaptEmo combine l\'analyse faciale (ViT), la prosodie audio (wav2vec 2.0) et le texte (BERT) dans un modèle de fusion tardive auto-adaptative avec attention croisée.',
             'Pattern Recognition Letters','10.1016/j.patrec.2024.03.456','Émotions, Multimodal, ViT','emotion-ai'],
            ['RLTraffic : Contrôle des Feux de Circulation par Deep RL',
             'RLTraffic utilise un agent PPO multi-agent entraîné dans SUMO pour optimiser en temps réel les phases des feux à l\'échelle d\'une ville entière.',
             'Transportation Research Part C','10.1016/j.trc.2024.104567','RL, Smart City, SUMO, Trafic','traffic-city'],
            ['SolarAI : Prévision de la Production Solaire par CNN-LSTM',
             'SolarAI combine une architecture CNN pour les patterns spatiaux nuageux et un LSTM pour les séries temporelles, atteignant un RMSE 23% inférieur aux méthodes NWP.',
             'Applied Energy','10.1016/j.apenergy.2024.123789','Solaire, CNN-LSTM, Smart Grid','solar-energy'],
            ['AutoML-Maroc : Plateforme d\'AutoML pour les PME Marocaines',
             'AutoML-Maroc, une plateforme no-code incluant la sélection de modèles, l\'optimisation d\'hyperparamètres par Optuna et l\'explicabilité via SHAP, en Darija et Français.',
             'Journal of Artificial Intelligence Research','10.1613/jair.2024.12345','AutoML, PME, Maroc, SHAP','automl'],
            ['AquaML : Prédiction de la Qualité des Eaux Souterraines Marocaines',
             'AquaML intègre des données de 1 800 puits marocains et combine des modèles de stacking (RF + XGBoost + SVM) pour prédire 12 paramètres de qualité de l\'eau.',
             'Environmental Modelling & Software','10.1016/j.envsoft.2024.105890','Eau, ML, Environnement, Maroc','water-env'],
            ['GenomeNet-MA : Diversité Génomique de la Population Marocaine',
             'GenomeNet-MA analyse les génomes de 3 200 individus marocains pour caractériser la structure des populations, identifier des variants rares et établir des références cliniques.',
             'Nature Communications','10.1038/s41467-024-56789-0','Génomique, Bioinformatique, Maroc','genomics'],
            ['PrivacyEdge : Inférence IA Préservant la Vie Privée sur Dispositifs Edge',
             'PrivacyEdge propose un framework de split computing avec chiffrement homomorphe partiel permettant de distribuer l\'inférence entre l\'appareil et le serveur sans exposer les données.',
             'IEEE Trans. Mobile Computing','10.1109/TMC.2024.3345678','Edge, Vie Privée, IA embarquée','edge-privacy'],
            ['MetaVerse-Edu : Apprentissage Immersif en Réalité Virtuelle',
             'MetaVerse-Edu est une plateforme VR collaborative permettant de simuler des laboratoires scientifiques, évaluée auprès de 450 étudiants universitaires marocains.',
             'Computers & Education','10.1016/j.compedu.2024.104890','VR, Education, eLearning','vr-edu'],
            ['MoroccoRoad : Carte Sémantique des Routes Marocaines par Télédétection',
             'Nous présentons un dataset de 50 000 images Sentinel-2 annotées et un modèle SegFormer atteignant un mIoU de 0.87 sur les routes marocaines.',
             'Remote Sensing of Environment','10.1016/j.rse.2024.114321','Télédétection, Routes, SegFormer, Maroc','remote-sensing'],
        ];

        $posts = [];
        foreach ($articles as $i => [$title, $abstract, $journal, $doi, $keywords, $imgSeed]) {
            $author = $academics[$i % count($academics)];
            $cover  = $this->postImage($imgSeed, 'posts/covers');
            $posts[] = Post::create([
                'author_id'       => $author->id,
                'type'            => 'SCIENTIFIC_ARTICLE',
                'article_title'   => $title,
                'abstract'        => $abstract,
                'content'         => $abstract,
                'journal'         => $journal,
                'doi'             => $doi,
                'keywords'        => $keywords,
                'cover_image_url' => $cover,
                'created_at'      => now()->subDays(rand(1,180))->subHours(rand(0,23)),
                'updated_at'      => now()->subDays(rand(0,30)),
            ]);
        }

        $this->command->info("✅ ".count($posts)." articles scientifiques créés.");
        return $posts;
    }

    // ─── Likes & Comments ────────────────────────────────────────────────────

    private function createLikesAndComments($allUsers, array $allPosts): void
    {
        $reactions = ['LIKE','LOVE','CLAP','INSIGHTFUL','LIKE','LIKE','LOVE'];
        $ids = $allUsers->pluck('id')->toArray();
        $comments = [
            'Excellent travail, très instructif !','Merci pour ce partage, très pertinent.',
            'Impressionnant ! Quelle est votre méthodologie exacte ?','Félicitations pour ces résultats remarquables.',
            'Avez-vous prévu de publier le code source ?','Très utile pour mes recherches, merci !',
            'Beau travail d\'équipe, continuez !','Pouvez-vous partager les données d\'entraînement ?',
            'C\'est exactement ce que je cherchais. Merci !','Quelles sont les limites identifiées ?',
            'Bravo ! Ce travail mérite d\'être reconnu.','Très belle contribution scientifique.',
            'Avez-vous testé sur d\'autres datasets ?','La section méthodo est très claire, bravo !',
            'Partagez-vous votre code sur GitHub ?','Excellent état de l\'art, très exhaustif.',
        ];
        $likes = 0; $coms = 0;
        foreach ($allPosts as $post) {
            shuffle($ids);
            foreach (array_slice($ids, 0, rand(intval(count($ids)*0.4), intval(count($ids)*0.8))) as $uid) {
                if ($uid === $post->author_id) continue;
                if (!Like::where('post_id',$post->id)->where('user_id',$uid)->exists()) {
                    Like::create(['post_id'=>$post->id,'user_id'=>$uid,'type'=>$reactions[array_rand($reactions)]]);
                    $likes++;
                }
            }
            shuffle($ids);
            foreach (array_slice($ids, 0, rand(3,8)) as $uid) {
                Comment::create([
                    'post_id'   => $post->id,
                    'author_id' => $uid,
                    'content'   => $comments[array_rand($comments)],
                    'created_at'=> now()->subDays(rand(0,30)),
                    'updated_at'=> now()->subDays(rand(0,5)),
                ]);
                $coms++;
            }
        }
        $this->command->info("✅ {$likes} likes et {$coms} commentaires créés.");
    }

    // ─── Projects ────────────────────────────────────────────────────────────

    private function createProjects(array $supervisors, $allUsers): array
    {
        $projectsData = [
            ['PlagiaDetect — Détection de Plagiat Académique par NLP',
             'Plateforme SaaS de détection de plagiat utilisant Sentence-BERT et Qdrant pour comparer les soumissions avec 5M+ documents académiques.',
             'Développer un système de détection >95%, créer une API REST, intégrer avec Moodle.','RESEARCH','IN_PROGRESS','Python, NLP, FastAPI, Azure',6],
            ['SmartCampus — Application IoT de Gestion Intelligente du Campus',
             'Système IoT (capteurs température, CO₂, occupation), MQTT/Node-RED et dashboards Grafana. Objectif : réduire la consommation énergétique de 30%.',
             'Déployer 50 capteurs, développer le serveur MQTT, créer les alertes automatiques.','APPLIED','IN_PROGRESS','IoT, MQTT, Node-RED, Grafana, Python',8],
            ['MoroccoHealthAI — Prédiction des Épidémies Saisonnières',
             'Système de surveillance épidémiologique basé sur les données du Ministère de la Santé, Twitter et Google Trends. Prédit les pics d\'influenza avec 3 semaines d\'avance.',
             'Collecter et nettoyer les données, entraîner modèles, créer tableau de bord.','RESEARCH','PLANNING','Python, Épidémiologie, Time Series, NLP',5],
            ['DarijaBot — Assistant Conversationnel en Darija',
             'Chatbot pédagogique en Darija marocaine, intégrant Llama-3 + LoRA fine-tuné sur des dialogues éducatifs. Disponible sur WhatsApp et Telegram.',
             'Fine-tuner le modèle, créer le dataset Darija, intégrer WhatsApp Business API.','APPLIED','IN_PROGRESS','LLM, Fine-tuning, Python, WhatsApp API',4],
            ['AgriSmart-MA — Agriculture de Précision via Smartphone',
             'App mobile permettant aux agriculteurs de diagnostiquer leurs cultures via photo. Utilise EfficientDet et des données météorologiques pour des recommandations personnalisées.',
             'Développer l\'app Flutter, entraîner le modèle sur 30 cultures, tester avec 50 agriculteurs pilotes.','APPLIED','IN_PROGRESS','Flutter, Computer Vision, TFLite, Agriculture',6],
            ['CryptoVault-MA — Transferts de Fonds de la Diaspora via Blockchain',
             'Solution Stellar Network pour les Marocains de la diaspora. Objectif : réduire les frais de 12% (WU) à moins de 1%, confirmation en moins de 5 secondes.',
             'Développer les smart contracts, créer l\'interface mobile, obtenir la conformité BAM.','STARTUP','PLANNING','Blockchain, Stellar, React Native',5],
            ['EduViz — Visualisation Interactive des Données Éducatives',
             'Dashboard analytique pour le Ministère de l\'Éducation marocain. Construit avec D3.js, FastAPI et PostgreSQL.',
             'Définir les KPIs, développer les visualisations D3.js, intégrer les données ministérielles.','APPLIED','COMPLETED','D3.js, Python, FastAPI, PostgreSQL',4],
            ['SecureVote — Système de Vote Électronique Vérifiable',
             'Prototype de vote électronique basé sur Ethereum privée et ZK-SNARK pour garantir l\'anonymat des votants. Testé pour les élections estudiantines.',
             'Concevoir le protocole cryptographique, développer les smart contracts Solidity.','RESEARCH','IN_PROGRESS','Blockchain, Solidity, ZK-SNARK, Sécurité',5],
        ];

        $allIds = $allUsers->pluck('id')->toArray();
        $projects = [];

        foreach ($projectsData as $i => [$title,$desc,$obj,$type,$status,$skills,$max]) {
            $owner = $supervisors[$i % count($supervisors)];
            $project = Project::create([
                'owner_id'=>$owner->id,'title'=>$title,'description'=>$desc,'objectives'=>$obj,
                'type'=>$type,'status'=>$status,'max_members'=>$max,'required_skills'=>$skills,
                'conditions'=>'Être étudiant ou chercheur à l\'IGA Maroc. Disponibilité 10h/semaine.',
            ]);

            ProjectMembership::create(['project_id'=>$project->id,'user_id'=>$owner->id,'role'=>'OWNER','status'=>'APPROVED']);

            $others = array_filter($allIds, fn($id) => $id !== $owner->id);
            shuffle($others);
            foreach (array_slice($others, 0, rand(3, min(5,$max-1))) as $uid) {
                ProjectMembership::create(['project_id'=>$project->id,'user_id'=>$uid,'role'=>'MEMBER','status'=>'APPROVED']);
            }
            foreach (array_slice($others, 5, 2) as $uid) {
                ProjectMembership::create(['project_id'=>$project->id,'user_id'=>$uid,'role'=>'MEMBER','status'=>'PENDING']);
            }

            // Project tasks — only PENDING and COMPLETED are valid
            $taskSets = [
                [['Analyse des besoins','COMPLETED'],['Conception architecture','COMPLETED'],['Développement MVP','PENDING'],['Tests','PENDING'],['Déploiement','PENDING']],
                [['Collecte données','COMPLETED'],['Entraînement modèles','PENDING'],['Évaluation','PENDING'],['Intégration API','PENDING'],['Rapport final','PENDING']],
                [['Définition périmètre','COMPLETED'],['Prototypage','COMPLETED'],['Développement','PENDING'],['Tests utilisateurs','PENDING'],['Publication','PENDING']],
            ];
            foreach ($taskSets[$i % 3] as $idx => [$taskTitle, $taskStatus]) {
                ProjectTask::create([
                    'project_id' => $project->id,
                    'title'      => $taskTitle,
                    'description'=> "Tâche ".($idx+1)." : {$taskTitle}",
                    'status'     => $taskStatus,
                ]);
            }
            $projects[] = $project;
        }

        $this->command->info("✅ ".count($projects)." projets créés avec membres et tâches.");
        return $projects;
    }

    // ─── Chats ───────────────────────────────────────────────────────────────

    private function createChats($allUsers, array $projects, array $articles): void
    {
        $ids = $allUsers->pluck('id')->toArray();
        $nameMap = $allUsers->keyBy('id')->map(fn($u)=>$u->first_name)->toArray();
        $total = 0;

        // Global channel
        $global = Channel::firstOrCreate(
            ['type'=>'GLOBAL'],
            ['name'=>'Général','slug'=>'general','description'=>'Discussion ouverte à tous']
        );
        $globalMsgs = [
            'Bonjour à tous ! Quelqu\'un a des ressources sur les Transformers ?',
            'La conf IA de la semaine prochaine à Rabat s\'annonce super !',
            'Partage de code Python pour le scraping de PubMed si quelqu\'un est intéressé.',
            'Question : quelle différence entre BERT et RoBERTa en pratique ?',
            'Nouveau cours en ligne gratuit sur le Deep Learning par fast.ai, très recommandé !',
            'Quelqu\'un cherche des collaborateurs pour un projet de recherche en NLP ?',
            'Résultats du dernier hackathon : notre équipe a terminé 2ème 🎉',
            'Tips pour poster sur arXiv pour la première fois ?',
            'L\'IGA recrute des assistants de recherche pour l\'année prochaine !',
            'Partage de ma liste de lectures : articles sur les LLMs multimodaux.',
        ];
        foreach ($globalMsgs as $i => $msg) {
            ChatMessage::create(['channel_id'=>$global->id,'sender_id'=>$ids[$i % count($ids)],'content'=>$msg,'created_at'=>now()->subDays(rand(0,30))->subHours(rand(0,23))]);
            $total++;
        }

        // Private channels
        $done = [];
        for ($p = 0; $p < 15; $p++) {
            $shuffled = $ids; shuffle($shuffled);
            [$a, $b] = [$shuffled[0], $shuffled[1]];
            if ($a === $b) continue;
            $key = min($a,$b).'-'.max($a,$b);
            if (in_array($key,$done)) continue;
            $done[] = $key;

            $ch = Channel::firstOrCreate(
                ['type'=>'PRIVATE','user1_id'=>min($a,$b),'user2_id'=>max($a,$b)],
                ['name'=>'Chat entre '.($nameMap[$a]??'').' et '.($nameMap[$b]??''),'slug'=>'prv-'.min($a,$b).'-'.max($a,$b)]
            );
            $pvMsgs = [
                'Bonjour ! J\'aurais besoin de ton aide sur un projet.','Bien sûr ! De quoi s\'agit-il ?',
                'Je travaille sur un modèle de classification, l\'overfitting est problématique.',
                'As-tu essayé la régularisation L2 et le dropout ?',
                'Oui, mais les résultats restent instables. Il manque probablement des données.',
                'Data augmentation pourrait aider. Tu as essayé ?','Pas encore, bonne idée !',
                'Tiens-moi au courant, on peut faire un code review ensemble.',
                'Merci beaucoup !','Avec plaisir, c\'est ça la collaboration académique 😊',
            ];
            foreach ($pvMsgs as $mi => $msg) {
                ChatMessage::create(['channel_id'=>$ch->id,'sender_id'=>($mi%2===0?$a:$b),'content'=>$msg,'created_at'=>now()->subDays(rand(0,14))->subMinutes(rand(0,1440))]);
                $total++;
            }
        }

        // Project channels
        foreach ($projects as $proj) {
            $ch = Channel::firstOrCreate(
                ['type'=>'PROJECT','project_id'=>$proj->id],
                ['name'=>'Projet: '.$proj->title,'slug'=>'proj-'.$proj->id,'description'=>$proj->description]
            );
            $members = ProjectMembership::where('project_id',$proj->id)->where('status','APPROVED')->pluck('user_id')->toArray();
            if (empty($members)) continue;
            $projMsgs = [
                'Bonjour l\'équipe ! Réunion ce vendredi à 15h.','J\'ai poussé les modifs sur GitHub, review ?',
                'Résultats très prometteurs : +3 points de F1-score !','Quelle version de Python on utilise ?',
                'Python 3.11 + venv, voir README.','Collecte terminée, 45 000 échantillons au total !',
                'Super ! Entraînement dès demain.','Issue ouverte sur GitHub pour le bug preprocessing.',
                'Rapport à rendre vendredi, qui s\'en charge ?','Je prends en charge, partagez vos notes.',
                'Notes dans le drive, merci !','Meeting annulé, on reprend lundi. Bon week-end !',
            ];
            foreach ($projMsgs as $mi => $msg) {
                ChatMessage::create(['channel_id'=>$ch->id,'sender_id'=>$members[$mi%count($members)],'content'=>$msg,'created_at'=>now()->subDays(rand(0,21))->subHours(rand(0,12))]);
                $total++;
            }
        }

        // Article channels
        foreach (array_slice($articles, 0, 10) as $article) {
            $ch = Channel::firstOrCreate(
                ['type'=>'ARTICLE','post_id'=>$article->id],
                ['name'=>$article->article_title ?? 'Article','slug'=>'art-'.$article->id,'description'=>$article->journal ?? '']
            );
            $artMsgs = [
                'Excellent article ! La méthodologie est très bien décrite.',
                'Avez-vous comparé avec l\'approche de Smith et al. 2023 ?',
                'Les résultats sur le dataset X sont impressionnants !',
                'Je travaille sur un sujet similaire, serait-il possible de collaborer ?',
                'Question section 3.2 : comment avez-vous traité les données manquantes ?',
                'Publication open access ? Je voudrais la partager avec mes étudiants.',
                'Le code sera-t-il disponible sur GitHub ?',
                'J\'attends la suite de la série d\'articles !',
            ];
            $shuffled = $ids; shuffle($shuffled);
            $commenters = array_slice($shuffled, 0, min(6, count($ids)));
            foreach (array_slice($artMsgs, 0, rand(3,6)) as $mi => $msg) {
                ChatMessage::create(['channel_id'=>$ch->id,'sender_id'=>$commenters[$mi%count($commenters)],'content'=>$msg,'created_at'=>now()->subDays(rand(0,30))->subHours(rand(0,12))]);
                $total++;
            }
        }

        $this->command->info("✅ {$total} messages dans ".Channel::count()." channels.");
    }

    // ─── Notifications ────────────────────────────────────────────────────────

    private function createNotifications($allUsers, array $allPosts): void
    {
        $ids = $allUsers->pluck('id')->toArray();
        $nameMap = $allUsers->keyBy('id')->map(fn($u)=>$u->first_name.' '.$u->last_name)->toArray();
        $types = [
            ['POST_LIKED',            '{actor} a aimé votre publication.'],
            ['POST_COMMENTED',        '{actor} a commenté votre publication.'],
            ['CONNECTION_ACCEPTED',   '{actor} a accepté votre demande de connexion.'],
            ['CONNECTION_REQUEST',    '{actor} vous a envoyé une demande de connexion.'],
            ['DIRECT_MESSAGE_RECEIVED','{actor} vous a envoyé un message.'],
        ];
        $cnt = 0;
        foreach (array_slice($ids, 0, 25) as $uid) {
            for ($n = 0; $n < rand(5,12); $n++) {
                [$type, $msg] = $types[array_rand($types)];
                $actor = $ids[array_rand($ids)];
                Notification::create([
                    'user_id'       => $uid,
                    'type'          => $type,
                    'message'       => str_replace('{actor}', $nameMap[$actor] ?? 'Quelqu\'un', $msg),
                    'is_read'       => rand(0,2) !== 0,
                    'reference_id'  => !empty($allPosts) ? $allPosts[array_rand($allPosts)]->id : null,
                    'reference_type'=> 'POST',
                    'created_at'    => now()->subDays(rand(0,30))->subHours(rand(0,23)),
                ]);
                $cnt++;
            }
        }
        $this->command->info("✅ {$cnt} notifications créées.");
    }
}
