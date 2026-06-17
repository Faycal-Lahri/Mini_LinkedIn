# ScholarNet / Miniii Link 🚀

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-4.5-red?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![Laravel](https://img.shields.io/badge/Laravel-11.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)

**ScholarNet (Mini LinkedIn)** est une plateforme de réseautage professionnel et de collaboration scientifique haut de gamme. Développée avec une esthétique épurée inspirée de macOS/Apple, elle est conçue pour les établissements universitaires (particulièrement l'**IGA Casablanca**) afin de connecter étudiants, enseignants et chercheurs.

Les membres peuvent publier des articles de recherche (avec DOI et pièces jointes PDF), partager des médias (images et vidéos), réagir avec des emojis animés, collaborer sur des projets académiques via des tableaux de tâches partagés, échanger par messagerie privée en temps réel et bénéficier d'une assistance IA intégrée pour polir leurs publications ou rédiger leur biographie.

---

## 🛠️ Architecture & Technologies

### 💻 Frontend (React SPA)
*   **Framework** : `React` avec `Vite` pour un rechargement à chaud (HMR) ultra-rapide.
*   **Gestion d'État** : `Zustand` pour un store réactif, moderne et sans boilerplate.
*   **Styling** : Combinaison de Vanilla CSS Premium et `Tailwind CSS`.
*   **Icônes** : `Lucide React` et Google `Material Symbols` (Apple design).
*   **Client HTTP** : `Axios` configuré avec des intercepteurs pour la gestion automatique des jetons de session.

### 🔌 Backend (Laravel API)
*   **Framework** : `Laravel 11` (PHP 8.2+) REST API.
*   **Authentification** : `Laravel Sanctum` pour une gestion robuste des sessions et des jetons d'accès.
*   **Base de données** : `MySQL` avec l'ORM Eloquent.
*   **Assistant IA** : Intégration d'API pour la génération automatique de biographies et le polissage de publications.
*   **Stockage** : Gestion des uploads médias et PDF de recherche via le système de fichiers Laravel.

---

## 🌟 Fonctionnalités Clés

### 🛡️ 1. Gestion des Utilisateurs & Rôles
*   **Système d'Inscription** : Formulaire multi-étapes avec téléversement de justificatifs.
*   **Rôles applicatifs** :
    *   `STUDENT` : Accès aux fonctionnalités sociales, messagerie, projets et tâches.
    *   `TEACHER` / `RESEARCHER` : Privilèges élevés permettant de publier des articles scientifiques dans le Hub Académique.
    *   `ADMIN` : Accès à la suite d'administration (modération de contenu, validation de comptes, rapports d'activité, avertissements et bannissements).

### 📰 2. Flux Social & Hub Scientifique
*   **Publications riches** : Prise en charge des textes, galeries d'images multiples et vidéos.
*   **Hub Académique** : Outil de publication de papiers contenant titre, résumé (abstract), mots-clés, DOI, nom de revue et le document PDF officiel lié.
*   **Réactions à la LinkedIn** : Menu d'emojis animés au survol : *J'aime (👍)*, *J'adore (❤️)*, *Bravo (👏)*, *Instructif (💡)*, *Je n'aime pas (👎)*.
*   **Commentaires et Partages** : Fils de discussions interactifs et possibilité de repartager des publications (avec ou sans commentaire additionnel).

### 👥 3. Réseau et Relations
*   **Gestion des relations** : Envoyer, accepter ou refuser des demandes de connexion.
*   **Suggestions intelligentes** : Recommandations d'utilisateurs basées sur les rôles et l'établissement.
*   **Recherche globale** : Moteur de recherche instantané pour trouver des pairs par nom, fonction ou compétences.

### 📂 4. Espace Projets & Tâches
*   **Groupes de travail** : Création de projets académiques collaboratifs.
*   **Tableau de tâches** : Gestion de tâches d'équipe avec création, assignation, suivi de statut et suppression.
*   **Gestion des membres** : Système d'invitation et approbation des demandes d'adhésion.

### 💬 5. Messagerie Instantanée (Chat Hub)
*   **Discussions privées** : Salons de chat 1-à-1 réactifs avec indicateur de présence en ligne (cercle vert).
*   **Tiroir de messagerie persistant** : Tiroir de discussion rétractable (style LinkedIn) accessible depuis n'importe quelle page.
*   **Réponses rapides** : Suggestions de réponses instantanées en un clic.

---

## 📂 Structure du Projet

```
miniii_link/
├── backend/                  # API Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/# Contrôleurs (Auth, Chat, Network, Post, Profile, etc.)
│   │   └── Models/         # Modèles Eloquent (User, Post, Task, Project, etc.)
│   ├── database/             # Migrations et Données de test (Seeders)
│   ├── routes/               # Fichier de routes API (api.php)
│   └── public/               # Dossier public avec lien symbolique pour le stockage
├── frontend/                 # Application React
│   ├── src/
│   │   ├── api/             # Configuration Axios
│   │   ├── components/      # Composants partagés (Navbar, Modals, Lightbox, etc.)
│   │   ├── pages/           # Pages (Feed, Profile, ChatHub, Network, Admin)
│   │   ├── store/           # Store global Zustand (authStore)
│   │   ├── App.jsx          # Déclaration des routes React Router
│   │   └── index.css        # Styles CSS principaux
│   └── index.html           # Point d'entrée HTML
├── start.bat                 # Script de démarrage rapide local
└── README.md                 # Documentation générale (Ce fichier)
```

---

## 🔌 Points d'Accès de l'API (Routes)

Toutes les routes (sauf `/api/login` et `/api/register`) requièrent un en-tête d'authentification (`Bearer Token`).

| Route | Méthode | Contrôleur & Action | Description |
| :--- | :---: | :--- | :--- |
| `/api/register` | `POST` | `AuthController@register` | Création de compte |
| `/api/login` | `POST` | `AuthController@login` | Connexion et émission du jeton |
| `/api/user` | `GET` | `AuthController@me` | Obtenir l'utilisateur connecté |
| `/api/logout` | `POST` | `AuthController@logout` | Déconnexion |
| `/api/profile` | `GET` | `ProfileController@show` | Profil utilisateur connecté |
| `/api/profile/{user}` | `GET` | `ProfileController@publicShow` | Profil public d'un autre membre |
| `/api/profile/update` | `POST` | `ProfileController@update` | Mettre à jour les infos du profil |
| `/api/profile/ai-bio` | `POST` | `ProfileController@generateAiBiography`| Générer une biographie avec l'IA |
| `/api/posts` | `GET` | `PostController@index` | Récupérer les publications du flux |
| `/api/posts` | `POST` | `PostController@store` | Créer un post ou un article scientifique |
| `/api/posts/{post}/like` | `POST` | `PostController@toggleLike` | Ajouter/modifier une réaction |
| `/api/posts/{post}/comment`| `POST` | `PostController@comment` | Commenter une publication |
| `/api/posts/{post}/share` | `POST` | `PostController@share` | Repartager une publication |
| `/api/network/connections` | `GET` | `NetworkController@getConnections`| Liste des connexions actives |
| `/api/network/suggestions` | `GET` | `NetworkController@suggestions` | Liste de suggestions de membres |
| `/api/network/search` | `GET` | `NetworkController@search` | Rechercher des membres |
| `/api/network/request/{user}`| `POST`| `NetworkController@sendRequest` | Envoyer une demande de connexion |
| `/api/network/accept/{user}` | `POST`| `NetworkController@acceptRequest` | Accepter une demande de connexion |
| `/api/chat/channels` | `GET` | `ChatController@getChannels` | Récupérer les salons de discussion |
| `/api/chat/private/{otherUser}`| `POST`| `ChatController@startPrivateChat`| Lancer un chat privé 1-à-1 |
| `/api/projects` | `GET` | `ProjectController@index` | Liste des projets de l'utilisateur |
| `/api/projects` | `POST` | `ProjectController@store` | Créer un nouveau projet |
| `/api/projects/{project}/tasks`| `GET` | `ProjectController@getTasks` | Récupérer les tâches du projet |
| `/api/projects/{project}/tasks`| `POST`| `ProjectController@addTask` | Ajouter une tâche au projet |
| `/api/notifications` | `GET` | `NotificationController@index` | Récupérer les notifications |
| `/api/notifications/read-all`| `POST`| `NotificationController@markAllAsRead`| Marquer toutes les notifs comme lues |

---

## 🚀 Installation et Démarrage

### 📋 Prérequis
*   **PHP 8.2** ou supérieur (via XAMPP, Laragon, etc.)
*   **Composer**
*   **Node.js (v18+)** & **npm**
*   **MySQL / MariaDB**

---

### 💾 1. Configuration du Backend
1.  Allez dans le dossier `backend/` :
    ```bash
    cd backend
    ```
2.  Installez les dépendances Composer :
    ```bash
    composer install
    ```
3.  Installez les dépendances npm :
    ```bash
    npm install
    ```
4.  Créez un fichier `.env` à partir du `.env.example` et configurez la connexion à la base de données :
    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=miniii_link
    DB_USERNAME=root
    DB_PASSWORD=
    ```
5.  Générez la clé de sécurité Laravel :
    ```bash
    php artisan key:generate
    ```
6.  Lancez les migrations et chargez les données de test (seeds) :
    ```bash
    php artisan migrate --seed
    ```
7.  Créez le lien symbolique pour le stockage des fichiers :
    ```bash
    php artisan storage:link
    ```

---

### 💻 2. Configuration du Frontend
1.  Allez dans le dossier `frontend/` :
    ```bash
    cd ../frontend
    ```
2.  Installez les paquets npm :
    ```bash
    npm install
    ```
3.  Vérifiez le fichier `.env` pour que l'URL de l'API pointe bien vers `http://localhost:8000`.

---

### 🏃 3. Lancement Local

Vous pouvez lancer simultanément le backend et le frontend en utilisant le fichier de démarrage rapide présent à la racine :
1.  Revenez à la racine du projet.
2.  Double-cliquez sur le fichier `start.bat`.
3.  Le script va automatiquement lancer :
    *   Le serveur API Laravel sur [http://localhost:8000](http://localhost:8000)
    *   L'application React Vite sur [http://localhost:5173](http://localhost:5173)
    *   Et ouvrira votre navigateur directement sur la page de connexion.

---

## 👥 Comptes de Démo (Mots de passe : `password`)
Voici les comptes pré-créés en base de données pour tester les différents rôles :
*   **Administrateur** : `admin@iga.ma` (Accès complet à la modération et aux statistiques)
*   **Enseignant** : `omar@teacher.ma` (Peut publier des articles et participer aux projets)
*   **Chercheur** : `layla@researcher.ma` (Peut publier des articles et participer aux projets)
*   **Étudiants** : `karim@student.ma`, `yasmine@student.ma` (Discussions, projets, tâches)
