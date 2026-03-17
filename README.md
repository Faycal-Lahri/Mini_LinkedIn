# 🎓 Mini LinkedIn Académique

![Status](https://img.shields.io/badge/status-En%20développement-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=flat&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React.js-20232A?style=flat&logo=react&logoColor=61DAFB)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=flat&logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/license-Academic-blue)

---

## 🌐 Présentation

**Mini LinkedIn Académique** est une application web full-stack inspirée de LinkedIn,
entièrement dédiée au monde universitaire et scientifique.

Elle offre un espace collaboratif où étudiants, enseignants et chercheurs peuvent :

- 🎯 Créer et gérer un profil académique complet
- 📄 Publier des projets, articles et travaux scientifiques
- 🔗 Construire et développer leur réseau académique
- 🤝 Collaborer sur des projets universitaires et de recherche
- 🔔 Rester informés grâce aux notifications en temps réel
- 🛡️ Évoluer dans une plateforme sécurisée et modérée

> 💡 Projet réalisé dans le cadre des **Ateliers et Projet Tutoré en Développement Logiciel**
> — IGA · Équipe LMSRANA · 2025

---

## 👥 Utilisateurs & Rôles

| Rôle | Description | Particularité |
|------|-------------|---------------|
| 🎓 Étudiant | Valorise son parcours, cherche des stages et opportunités | Validation automatique à l'inscription |
| 👨‍🏫 Enseignant | Encadre des projets, partage cours et expériences | Validation manuelle par l'admin |
| 🔬 Chercheur | Publie des travaux scientifiques, propose des collaborations | Validation manuelle par l'admin |
| 🛡️ Administrateur | Gère et modère l'ensemble de la plateforme | Accès total au système |

---

## 🚀 Fonctionnalités

### 🔐 Authentification
- Inscription avec choix du rôle
- Confirmation par email
- Connexion sécurisée avec JWT
- Modification et réinitialisation du mot de passe
- Validation automatique (étudiant) ou manuelle par admin (enseignant / chercheur)

### 👤 Profil Académique
- Informations personnelles et académiques (établissement, filière, niveau)
- Photo de profil et biographie
- Compétences techniques et certifications
- Expériences selon le rôle (stages, cours, recherches)
- Publications scientifiques
- Portfolio académique
- Consultation du profil public d'un autre membre

### 📢 Publications & Fil d'Actualité
- Création de publications (texte, fichier, lien)
- Publication de projets universitaires et articles scientifiques
- Modification et suppression de ses publications
- Consultation du fil d'actualité en temps réel
- Likes et commentaires
- Suppression de ses propres commentaires

### 🔗 Réseau & Connexions
- Recherche d'utilisateurs par nom, rôle ou spécialité
- Consultation du profil public avec publications
- Envoi, acceptation et refus de demandes de connexion
- Consultation des demandes en attente
- Gestion et suppression de ses connexions

### 🤝 Collaboration Académique
- Proposition de projets académiques ou de recherche
- Rejoindre un projet existant
- Gestion des membres (accepter / refuser)
- Supervision et encadrement (enseignant / chercheur)
- Communication au sein du projet
- Publication de l'avancement et partage des résultats

### 🔔 Notifications
- Demande de connexion reçue / acceptée
- Like et commentaire sur une publication
- Invitation à rejoindre un projet
- Validation de compte par l'admin
- Marquage des notifications comme lues

### 🛡️ Administration
- Consultation et gestion de tous les comptes
- Validation / refus des comptes enseignants et chercheurs
- Activation / désactivation / suppression de comptes
- Modification du rôle d'un utilisateur
- Modération des publications inappropriées
- Blocage d'utilisateurs et envoi d'avertissements
- Consultation des contenus signalés
- Tableau de bord et statistiques globales

---

## 🛠️ Stack Technique

### Frontend
![React](https://img.shields.io/badge/React.js-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge)

### Backend
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Hibernate](https://img.shields.io/badge/Hibernate-59666C?style=for-the-badge&logo=hibernate&logoColor=white)

### Base de données
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

### Outils
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)
![Jira](https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white)
![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

---

## 🏗️ Architecture

L'application suit une architecture **3-tiers** :
```
┌─────────────────────────────────────────┐
│           Frontend (React.js)           │  ← Couche Présentation
├─────────────────────────────────────────┤
│         Backend (Spring Boot)           │  ← Couche Métier
│   Controllers │ Services │ Security     │
├─────────────────────────────────────────┤
│          Base de données (MySQL)        │  ← Couche Données
└─────────────────────────────────────────┘
```

---

## ⚙️ Installation

### Prérequis
- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8+
- Git

### Étapes
```bash
# 1. Cloner le projet
git clone https://github.com/your-username/mini-linkedin-academique.git
cd mini-linkedin-academique

# 2. Configurer la base de données
mysql -u root -p < database/mini_linkedin.sql

# 3. Configurer le backend
# Modifier backend/src/main/resources/application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/mini_linkedin
spring.datasource.username=root
spring.datasource.password=votre_mot_de_passe
spring.jpa.hibernate.ddl-auto=update

# 4. Lancer le backend
cd backend
./mvnw spring-boot:run

# 5. Installer et lancer le frontend
cd frontend
npm install
npm start
```

---

## 🗂️ Structure du Projet
```
mini-linkedin-academique/
│
├── frontend/                        # React.js
│   └── src/
│       ├── components/              # Composants réutilisables
│       ├── pages/                   # Pages de l'application
│       ├── services/                # Appels API (Axios)
│       └── context/                 # Gestion état global
│
├── backend/                         # Spring Boot
│   └── src/main/java/
│       ├── controllers/             # REST Controllers
│       ├── models/                  # Entités JPA
│       ├── repositories/            # Spring Data JPA
│       ├── services/                # Logique métier
│       ├── dto/                     # Data Transfer Objects
│       └── security/                # JWT + Spring Security
│
├── database/
│   └── mini_linkedin.sql            # Script de création BDD
│
└── README.md
```

---

## 🗃️ Base de Données — Tables principales

| Table | Description |
|-------|-------------|
| `utilisateurs` | Comptes de tous les membres |
| `profils` | Profils académiques détaillés |
| `publications` | Posts, articles et projets partagés |
| `commentaires` | Commentaires sur les publications |
| `connexions` | Relations entre membres |
| `projets` | Projets collaboratifs |
| `notifications` | Alertes et notifications en temps réel |

---

## 🔐 Sécurité

- Authentification via **JWT (JSON Web Token)**
- Gestion des rôles avec **Spring Security**
- Mots de passe chiffrés avec **BCrypt**
- Protection des endpoints selon le rôle de l'utilisateur

---

## 👨‍💻 Équipe

| Membre | Rôle |
|--------|------|
| Équipe LMSRANA | Conception, développement et tests |

---

## 📄 Licence

Ce projet est réalisé dans un cadre académique — **IGA 2025**.
Tous droits réservés à l'équipe **LMSRANA**.

---

<p align="center">
  Réalisé avec ❤️ par l'équipe <strong>LMSRANA</strong> — IGA 2025
</p>
