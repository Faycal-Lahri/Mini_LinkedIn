# Mini LinkedIn (Miniii Link) 🚀

Mini LinkedIn is a premium, high-fidelity professional networking and scientific collaboration platform. Styled with a modern, elegant macOS/Apple-inspired user interface, the application is designed to connect students, teachers, and researchers to share posts, publish articles, collaborate on projects, and message each other.

The application is structured as a monorepo consisting of a **React + Vite** frontend and a **Laravel API** backend.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React (Vite template with HMR)
- **State Management:** Zustand
- **Styling:** Vanilla CSS + Tailwind CSS (dynamic dark-mode/light-mode accents)
- **Icons:** Lucide React & Google Material Symbols
- **HTTP Client:** Axios (configured with interceptors for authorization headers)

### Backend
- **Framework:** Laravel (PHP 8.2+)
- **Authentication:** Laravel Sanctum (Token-based SPA auth)
- **Database:** MySQL (Eloquent ORM)
- **File Storage:** Local Laravel Storage disk (symlinked to public for media uploads)

---

## 🌟 Core Features & Functionalities

### 1. Authentication & Role-Based Access Control
- **Secure Registration/Login:** Powered by Laravel Sanctum.
- **User Roles:**
  - `STUDENT`: Normal networking, posting, project collaborations.
  - `TEACHER` / `RESEARCHER`: Elevated privileges to publish scientific articles/papers.
  - `ADMIN`: Access to the moderation suite and database analytics.

### 2. Social Feed & Engagement
- **Dynamic Feed:** View and share updates, images, and videos.
- **Scientific Articles Hub:** Teachers/Researchers can publish academic papers containing title, journal, abstract, DOI, keywords, and an attached PDF document.
- **LinkedIn-style Reactions:** Long-press or hover to choose from five customized reactions: *Like (👍)*, *Love (❤️)*, *Clap (👏)*, *Insightful (💡)*, or *Dislike (👎)*.
- **Comment Section:** Rich threaded discussions on posts and articles.
- **Share/Repost:** Share others' posts directly onto your own timeline with or without adding custom thoughts.

### 3. Professional Networking
- **Network Page:** Manage professional connections.
- **Connection Requests:** Send, accept, or decline invitations.
- **Smart Suggestions:** Get connection suggestions based on shared roles or interests.
- **Search:** Instant global user directory search to discover peers, teachers, or researchers.

### 4. Interactive Project Hub & Tasks
- **Collaborative Projects:** Create shared workspaces for university or industrial projects.
- **Team Management:** Invite peers, accept invitations, and approve or reject membership requests.
- **Project Tasks Board:** Manage project timelines with an integrated task management workflow (create, update, assign, and delete project tasks).

### 5. Chat Hub (Real-time Messaging)
- **Private Chats:** Start secure 1-to-1 chat sessions with any accepted connection.
- **Channels:** Global or admin-led announcements channels for broadcasting updates.

### 6. AI-Powered Assistants
- **AI Profile Biography:** Generate customized professional summaries using ChatGPT/AI based on your specified skills and experiences.
- **AI Post Generator:** Request AI assistance to write or refine post content prior to publishing.

### 7. Notification Center
- **Real-Time Alerts:** Receive push-style notifications for actions like profile views, connection approvals, incoming messages, post reactions/comments, and project invitations.

### 8. Admin Moderation Suite & Analytics
- **Dashboard Stats:** View total users, active accounts, post interactions, and system activity logs.
- **User Management:** Approve pending registrations, assign roles, issue warning notifications, ban/unban users, or delete accounts.
- **Content Moderation:** Access, monitor, and delete any reported/inappropriate posts.
- **Reports Resolution:** View, address, and close community reports.

---

## 📂 Project Structure

```
miniii_link/
├── backend/            # Laravel API backend
│   ├── app/            # Controllers, Models, Middleware
│   ├── database/       # Migrations and Seeders
│   ├── routes/         # API endpoints (api.php)
│   └── README.md       # Laravel-specific instructions
├── frontend/           # React + Vite frontend
│   ├── src/            # Components, Pages, Stores, Axios configs
│   └── README.md       # Frontend-specific instructions
├── laravel-backend/    # Empty directory / backup placeholder
├── start.bat           # Startup batch script for local hosting
└── README.md           # Root repository guide (This file)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **PHP 8.2** or higher
- **Composer**
- **Node.js** (v18+) & **npm**
- **MySQL / MariaDB** (via XAMPP, Laragon, or standalone)

### 2. Backend Setup
1. Open a terminal in the `/backend` directory.
2. Install dependencies:
   ```bash
   composer install
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your database settings:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=miniii_link
   DB_USERNAME=root
   DB_PASSWORD=
   ```
4. Run migrations and seed database:
   ```bash
   php artisan migrate --seed
   ```
5. Link the storage directory:
   ```bash
   php artisan storage:link
   ```

### 3. Frontend Setup
1. Open a terminal in the `/frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Check `.env` configuration (make sure the backend API URL matches the Laravel port, usually `http://localhost:8000`).

---

## 🏃 Running the Application

You can launch both the backend and frontend simultaneously using the startup script at the root:

1. Double-click the `start.bat` file in the root directory.
2. The script will boot:
   - Laravel Server on [http://localhost:8000](http://localhost:8000)
   - Vite React Server on [http://localhost:5173](http://localhost:5173)
3. It will automatically open your web browser to [http://localhost:5173](http://localhost:5173).
