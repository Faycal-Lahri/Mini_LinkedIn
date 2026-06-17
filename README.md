# ScholarNet / Miniii Link 🚀

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-4.5-red?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![Laravel](https://img.shields.io/badge/Laravel-11.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)

**ScholarNet (Mini LinkedIn)** est une plateforme universitaire premium de réseautage professionnel et de collaboration scientifique. Dotée d'une interface élégante et épurée inspirée du design macOS/Apple (verre dépoli, micro-animations, palettes HSL harmonieuses), elle est conçue pour connecter les étudiants, enseignants et chercheurs d'établissements universitaires (particulièrement l'**IGA Casablanca**).

---

## 🛠️ Architecture & Technologies

### 💻 Frontend (React SPA)
*   **Framework** : `React 19` avec `Vite` pour un build ultra-rapide et HMR (Hot Module Replacement).
*   **Gestion d'État** : `Zustand` pour un store global fluide (gestion de session, rôles).
*   **Styling** : Combinaison de **Vanilla CSS Premium** et **Tailwind CSS**. Optimisation contre le faible contraste en mode hybride.
*   **Composant de Rendu de Texte** : [FormattedText.jsx](file:///c:/xampp/htdocs/miniii_link/frontend/src/components/FormattedText.jsx) personnalisé pour le rendu robuste du Markdown (gras, italique, puces, liens) en couleur contrastée noire/sombre lisible sur cartes blanches.
*   **Icônes** : `Lucide React` et Google `Material Symbols`.
*   **Réseau** : `Axios` avec intercepteurs pour injecter automatiquement le jeton d'authentification Sanctum.

### 🔌 Backend (Laravel API)
*   **Framework** : `Laravel 11` (REST API).
*   **Authentification** : `Laravel Sanctum` (jetons d'accès révocables).
*   **Base de Données** : `MySQL 8.0` / `MariaDB` avec ORM Eloquent, relations riches en cascade, migrations de schémas et seeders de données volumineuses.
*   **Extraction de Documents** : Package PHP `Smalot\PdfParser` pour analyser et lire les textes complets au sein de fichiers PDF académiques.
*   **Moteur d'IA** : Intégration de l'API **OpenRouter** avec fallbacks de modèles et gestion adaptative locale.

---

## 🧠 Fonctionnalités Clés & Intégration IA

### 🔬 1. Espace Scientifique & Module IA "Scholar"
*   **Publication d'Articles de Recherche** : Permet aux enseignants et chercheurs d'ajouter des publications avec titre, abstract, mots-clés, DOI, nom de revue et fichier PDF.
*   **Analyse et Extraction Automatique de PDF par IA** :
    *   **Téléversement de gros fichiers** : Supporte des documents PDF allant jusqu'à **50 Mo** grâce à des ajustements dynamiques de configuration PHP (`ini_set('memory_limit', '-1')`, `set_time_limit(300)`).
    *   **Extraction textuelle massive** : Lit jusqu'à **150 000 caractères** du document PDF pour englober la totalité de l'article (introduction, méthodologie, résultats et conclusion).
    *   **Prompting Avancé OpenRouter** : Envoie le texte extrait au LLM avec des instructions strictes pour générer des métadonnées sous format JSON structuré (Titre, Mots-clés, Résumé et le Corps/Contenu complet de l'article).
    *   **Analyseur de secours (Regex Fallback)** : Intégration d'un parseur Regex robuste côté backend pour nettoyer et décoder le JSON renvoyé par l'IA en cas de présence de caractères spéciaux ou de blocs Markdown non désirés.
    *   **Rendu Frontend Ergonomique** : Remplissage instantané des champs du formulaire. Affichage du texte intégral de l'article dans un accordéon pliable ("Lire la suite") sur la carte du flux.
*   **Optimiseur de Publications (Post Enhancer)** :
    *   Aide les membres à enrichir leurs publications.
    *   Envoie le prompt à OpenRouter selon un format de réponse strict exigé : `Voici le titre :... Voici le contenu :... Améliore le ou parle d'avantage.`.
*   **Recommandations IA (Connection Suggestions)** :
    *   Analyse le profil connecté (compétences, établissement, biographie) et suggère intelligemment des profils pertinents de pairs à ajouter à son réseau.

### 🛡️ 2. Gestion des Rôles & Modération Académique
*   **Multi-Rôles** :
    *   `STUDENT` : Peut échanger, participer aux projets, commenter, réagir et gérer des tâches.
    *   `TEACHER` & `RESEARCHER` : Rôles certifiés ayant les privilèges de publication scientifique dans le Hub Académique.
    *   `ADMIN` : Accède au panneau d'administration pour approuver les nouveaux inscrits, gérer le statut des utilisateurs (activer/désactiver), envoyer des avertissements, bannir des comptes ou supprimer du contenu hors-norme.

### 💬 3. Messagerie Directe & Chat Hub
*   **Discussions privées interactives** : Canaux de discussion directs 1-à-1.
*   **Personnalisation Graphique** : Affichage dynamique du nom réel de l'interlocuteur, du titre de l'article si la discussion provient d'une publication, et de la photo de profil/avatar dans l'en-tête et la liste de gauche.
*   **Statut en ligne** : Indicateur vert vif en temps réel pour savoir quels pairs sont actuellement actifs.

### 📂 4. Espace Projets Collaboratifs (Kanban)
*   **Groupes de travail académiques** : Inviter des membres, accepter ou décliner les demandes de participation.
*   **Tableau de Bord Agile** : Création, édition et suppression de tâches associées à un projet avec attribution de statut (`Todo`, `In Progress`, `Done`) et assignation de membres.

---

## 📂 Structure Complète du Projet

```
miniii_link/
├── backend/                        # API REST Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/        # Contrôleurs (AiController, PostController, ChatController, etc.)
│   │   └── Models/                 # Modèles de données Eloquent (User, Post, Profile, Task, etc.)
│   ├── database/
│   │   ├── migrations/             # Schémas de base de données (ajout de cover_image, etc.)
│   │   └── seeders/                # Données de démo (UserSeeder, MegaSeeder de 100 Ko)
│   ├── routes/
│   │   └── api.php                 # Endpoints REST de l'application
│   ├── storage/                    # Fichiers téléversés (Photos de profil, PDFs d'articles)
│   └── composer.json               # Dépendances PHP (Smalot PDF Parser, etc.)
├── frontend/                       # Application Single Page React
│   ├── src/
│   │   ├── api/                    # Configuration globale de Axios
│   │   ├── components/             # Boutons, Navbar, Loader, FormattedText (Markdown)
│   │   ├── pages/                  # Ecrans (Feed, Profile, ChatHub, Articles, Network, Admin)
│   │   ├── store/                  # Store de gestion de session Zustand (authStore.js)
│   │   ├── App.jsx                 # Routage principal
│   │   └── index.css               # Feuilles de style et palette graphique macOS
│   └── package.json                # Dépendances JS et scripts de build
├── start.bat                       # Script Windows de démarrage automatique des serveurs
└── README.md                       # Ce guide complet
```

---

## 🔌 Référence Complète des Endpoints API

Toutes les routes requièrent un en-tête `Authorization: Bearer <TOKEN>`, à l'exception de `/api/register` et `/api/login`.

| Méthode | Route | Action du Contrôleur | Description |
| :---: | :--- | :--- | :--- |
| **POST** | `/api/register` | `AuthController@register` | Crée un compte utilisateur et téléverse les justificatifs. |
| **POST** | `/api/login` | `AuthController@login` | Connecte l'utilisateur et génère le jeton Sanctum. |
| **GET** | `/api/user` | `AuthController@me` | Récupère les informations de session de l'utilisateur connecté. |
| **POST** | `/api/logout` | `AuthController@logout` | Révoque le jeton d'accès actuel de l'utilisateur. |
| **POST** | `/api/ai/assist-post` | `AiController@assistPost` | Optimise un post grâce à l'IA OpenRouter. |
| **POST** | `/api/ai/analyze-pdf` | `AiController@analyzeArticlePdf` | Extrait et analyse le texte complet d'un PDF pour le transformer en JSON. |
| **GET** | `/api/ai/connections` | `AiController@connectionSuggestions` | Analyse le profil pour suggérer des connexions par IA. |
| **GET** | `/api/profile` | `ProfileController@show` | Récupère le profil complet de l'utilisateur connecté. |
| **GET** | `/api/profile/{user}` | `ProfileController@publicShow` | Récupère le profil public d'un autre utilisateur. |
| **POST** | `/api/profile/update` | `ProfileController@update` | Met à jour les informations du profil utilisateur. |
| **POST** | `/api/profile/ai-bio` | `ProfileController@generateAiBiography` | Génère une biographie à partir du parcours académique. |
| **POST** | `/api/profile/skills` | `ProfileController@addSkill` | Ajoute une compétence au profil de l'utilisateur. |
| **DELETE** | `/api/profile/skills/{skill}` | `ProfileController@removeSkill` | Retire une compétence du profil. |
| **POST** | `/api/profile/experiences` | `ProfileController@addExperience` | Ajoute une expérience professionnelle ou d'enseignement. |
| **DELETE** | `/api/profile/experiences/{experience}` | `ProfileController@removeExperience` | Supprime une expérience du profil. |
| **GET** | `/api/posts` | `PostController@index` | Affiche les publications du flux avec pagination. |
| **POST** | `/api/posts` | `PostController@store` | Publie un post standard ou un article scientifique (avec PDF). |
| **POST** | `/api/posts/{post}/like` | `PostController@toggleLike` | Gère les réactions animées sur une publication. |
| **POST** | `/api/posts/{post}/comment` | `PostController@comment` | Ajoute un commentaire sur un post ou article. |
| **POST** | `/api/posts/{post}/share` | `PostController@share` | Repartage un post existant dans le fil d'actualités. |
| **DELETE** | `/api/posts/{post}` | `PostController@destroy` | Supprime une publication (auteur ou admin). |
| **GET** | `/api/network/connections` | `NetworkController@getConnections` | Liste les amis/relations validées. |
| **GET** | `/api/network/suggestions` | `NetworkController@suggestions` | Suggère des relations (recommandations classiques). |
| **GET** | `/api/network/search` | `NetworkController@search` | Recherche globale multicritères de profils. |
| **POST** | `/api/network/request/{user}` | `NetworkController@sendRequest` | Envoie une demande de connexion à un membre. |
| **POST** | `/api/network/accept/{user}` | `NetworkController@acceptRequest` | Accepte une demande de connexion entrante. |
| **GET** | `/api/chat/channels` | `ChatController@getChannels` | Liste les salons de discussion de l'utilisateur. |
| **POST** | `/api/chat/private/{otherUser}` | `ChatController@startPrivateChat` | Crée ou récupère une discussion privée 1-à-1. |
| **GET** | `/api/chat/channels/{channel}/messages` | `ChatController@getMessages` | Récupère l'historique des messages d'un salon. |
| **POST** | `/api/chat/channels/{channel}/messages` | `ChatController@sendMessage` | Envoie un message texte dans une discussion. |
| **GET** | `/api/projects` | `ProjectController@index` | Récupère tous les projets de l'utilisateur connecté. |
| **POST** | `/api/projects` | `ProjectController@store` | Crée un nouvel espace projet collaboratif. |
| **GET** | `/api/projects/{project}/tasks` | `ProjectController@getTasks` | Liste les tâches du Kanban d'un projet. |
| **POST** | `/api/projects/{project}/tasks` | `ProjectController@addTask` | Ajoute une tâche dans le Kanban d'un projet. |
| **PATCH** | `/api/projects/{project}/tasks/{task}` | `ProjectController@updateTask` | Modifie le statut, le titre ou l'assignation d'une tâche. |
| **DELETE** | `/api/projects/{project}/tasks/{task}` | `ProjectController@deleteTask` | Supprime une tâche d'un tableau projet. |
| **GET** | `/api/notifications` | `NotificationController@index` | Liste les notifications reçues. |
| **POST** | `/api/notifications/read-all` | `NotificationController@markAllAsRead` | Marque toutes les notifications comme lues. |

---

## 🚀 Guide d'Installation Étape par Étape

### 📋 Prérequis système
*   **PHP 8.2 ou supérieur** (activé dans XAMPP, Laragon, ou en CLI)
*   **Composer** (gestionnaire de paquets PHP)
*   **Node.js (v18+) & npm** (environnement JavaScript)
*   **Base de Données MySQL / MariaDB**

---

### 💾 1. Configuration et Initialisation du Backend

1.  Se placer dans le répertoire du backend :
    ```bash
    cd backend
    ```
2.  Installer les packages PHP via Composer :
    ```bash
    composer install
    ```
3.  Installer les modules Node pour les tâches de build du backend si nécessaire :
    ```bash
    npm install
    ```
4.  Créer le fichier de configuration de l'environnement :
    ```bash
    cp .env.example .env
    ```
5.  Ouvrir le fichier `.env` nouvellement créé et configurer les paramètres de connexion de base de données, ainsi que la clé API OpenRouter :
    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=miniii_link
    DB_USERNAME=root
    DB_PASSWORD=

    # Clé d'accès à l'API OpenRouter pour les fonctionnalités IA
    OPENROUTER_API_KEY=votre_cle_api_ici
    ```
6.  Générer la clé d'application Laravel indispensable au chiffrement :
    ```bash
    php artisan key:generate
    ```
7.  Créer la base de données vide nommée `miniii_link` dans votre serveur MySQL (via phpMyAdmin ou console MySQL) :
    ```sql
    CREATE DATABASE miniii_link CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```
8.  Exécuter les migrations de base pour configurer les tables :
    ```bash
    php artisan migrate
    ```
9.  Remplir la base de données avec des données de démo. Deux seeders sont disponibles :
    *   **Seed Standard** (Rapide avec comptes de base) :
        ```bash
        php artisan db:seed
        ```
    *   **Mega Seed Premium** (Hautement recommandé : remplit l'application de dizaines de profils complets, compétences, expériences, articles scientifiques et messages pour une expérience de test complète) :
        ```bash
        php artisan db:seed --class=MegaSeeder
        ```
10. Lier le dossier de stockage privé au dossier public afin que les photos de profil et les PDFs d'articles scientifiques soient accessibles par le navigateur :
    ```bash
    php artisan storage:link
    ```

> [!NOTE]
> **Résolution de l'erreur SSL cURL local (Error 60)** :
> Dans les environnements locaux de développement sous Windows (comme XAMPP sans certificats configurés), les requêtes cURL vers des APIs externes HTTPS comme OpenRouter peuvent échouer. Le projet intègre de manière sécurisée et native le contournement SSL pour le développement via la méthode `Http::withoutVerifying()` dans [AiController.php](file:///c:/xampp/htdocs/miniii_link/backend/app/Http/Controllers/AiController.php) et [ProfileController.php](file:///c:/xampp/htdocs/miniii_link/backend/app/Http/Controllers/ProfileController.php). Aucun réglage du php.ini n'est requis à ce sujet.

---

### 💻 2. Configuration du Frontend (React)

1.  Accéder au dossier frontend :
    ```bash
    cd ../frontend
    ```
2.  Installer les modules npm :
    ```bash
    npm install
    ```
3.  Vérifier la variable d'environnement dans le fichier `.env` local pour s'assurer que l'adresse de l'API pointe vers l'instance de développement de Laravel :
    ```env
    VITE_API_URL=http://localhost:8000
    ```

---

### ⚙️ 3. Configuration Recommandée de PHP (pour les gros PDFs)

L'extraction d'articles scientifiques volumineux (jusqu'à 50 Mo) requiert des limites PHP adaptées. Si vous rencontrez des erreurs de dépassement de capacité lors du téléversement de documents volumineux, ajustez les valeurs suivantes dans votre fichier `php.ini` de XAMPP/Laragon, puis redémarrez Apache :

```ini
upload_max_filesize = 64M
post_max_size = 64M
memory_limit = 512M
max_execution_time = 300
```
*(Remarque : le backend ScholarNet désactive dynamiquement la limite de mémoire à l'exécution de l'extraction de fichier via `ini_set('memory_limit', '-1')` pour éviter tout crash inopiné.)*

---

## 🏃 Lancement de l'Application

### Option A : Lancement en un Clic (Windows 🪟)
À la racine du projet, double-cliquez sur le fichier script [start.bat](file:///c:/xampp/htdocs/miniii_link/start.bat).
Celui-ci va ouvrir les terminaux adéquats, démarrer `php artisan serve` sur le port **8000**, démarrer le serveur de développement Vite sur le port **5173**, puis ouvrir votre navigateur automatiquement à l'adresse [http://localhost:5173](http://localhost:5173).

### Option B : Lancement Manuel
Ouvrez deux invites de commande distinctes :

*   **Terminal 1 (Backend)** :
    ```bash
    cd backend
    php artisan serve --port=8000
    ```
*   **Terminal 2 (Frontend)** :
    ```bash
    cd frontend
    npm run dev
    ```

---

## 👥 Comptes de Démo pour les Tests (Mot de passe : `password`)

Connectez-vous avec les comptes pré-configurés pour essayer les différents profils et permissions :

*   **Compte Administrateur** :
    *   Identifiant : `admin@iga.ma`
    *   Rôle : `ADMIN`
    *   Permissions : Modération de contenus, validation d'inscriptions, rapports d'infractions, modification ou bannissement d'utilisateurs.
*   **Compte Enseignant** :
    *   Identifiant : `omar@teacher.ma` (ou `h.berrada@iga.ma` via MegaSeeder)
    *   Rôle : `TEACHER`
    *   Permissions : Publication d'articles scientifiques, téléversement de PDF, analyse de métadonnées par IA, création et gestion de projets de recherche.
*   **Compte Chercheur** :
    *   Identifiant : `layla@researcher.ma` (ou `r.moussaoui@research.ma` via MegaSeeder)
    *   Rôle : `RESEARCHER`
    *   Permissions : Publication scientifique haut de gamme, analyse IA, réseautage.
*   **Comptes Étudiants** :
    *   Identifiants : `yasmine@student.ma` ou `karim@student.ma`
    *   Rôle : `STUDENT`
    *   Permissions : Collaboration sur les tableaux Kanban, messagerie instantanée, réactions animées, commentaires de publications.

---

## 🎨 Design System & Esthétique Visuelle
*   **Esthétique Apple Premium** : Utilisation d'arrière-plans translucides avec des filtres de flou CSS (`backdrop-filter: blur`), des bordures subtiles d'un pixel pour un effet verre dépoli ("glassmorphism").
*   **Optimisation des Contrastes en Mode Sombre** : Les posts possèdent des fonds blancs clairs et nets. Le composant `FormattedText` force des couleurs de police noires saturées (`#171717` ou `#000000`) pour éliminer l'effet de texte gris invisible courant lors de l'application de classes Tailwind configurées globalement pour le mode sombre.
*   **Micro-animations** : Les réactions sous forme d'emojis s'animent de manière fluide au survol de la souris. Les fenêtres modales et les tiroirs de chat utilisent des transitions douces en CSS standard.
