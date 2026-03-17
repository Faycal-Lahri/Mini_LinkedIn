# 🎓 Mini LinkedIn Académique

![Status](https://img.shields.io/badge/status-En%20développement-orange)
![Made with](https://img.shields.io/badge/Made%20with-Java%20JEE-red)
![License](https://img.shields.io/badge/license-Academic-blue)

---

## 🌐 Présentation

**Mini LinkedIn Académique** est une application web inspirée de LinkedIn,
dédiée au monde universitaire et scientifique.
Elle permet aux étudiants, enseignants et chercheurs de créer un profil
académique, publier leurs travaux, développer leur réseau et collaborer
sur des projets communs.

> Projet réalisé dans le cadre des **Ateliers et Projet Tutoré**
> — IGA · Équipe LMSRANA · 2025

---

## 👥 Utilisateurs

| Rôle | Description |
|------|-------------|
| 🎓 Étudiant | Valorise son parcours, cherche des opportunités |
| 👨‍🏫 Enseignant | Encadre des projets, partage ses connaissances |
| 🔬 Chercheur | Publie des travaux, propose des collaborations |
| 🛡️ Admin | Gère et modère la plateforme |

---

## 🚀 Fonctionnalités

| Module | Description |
|--------|-------------|
| 🔐 Authentification | Inscription, connexion, réinitialisation MDP, validation admin |
| 👤 Profil | Infos académiques, compétences, expériences, portfolio |
| 📢 Publications | Créer, modifier, supprimer, liker, commenter |
| 🔗 Réseau | Recherche de profils, demandes de connexion |
| 🤝 Collaboration | Créer et rejoindre des projets, gestion des membres |
| 🔔 Notifications | Alertes en temps réel sur toutes les interactions |
| 🛡️ Administration | Gestion des comptes, modération, statistiques |

---

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React.js |
| Backend | Java JEE |
| Serveur | Apache Tomcat |
| Base de données | MySQL |
| Outils | Git, GitHub, Jira, Slack |

---

## ⚙️ Installation
```bash
# Cloner le projet
git clone https://github.com/your-username/mini-linkedin-academique.git

# Accéder au projet
cd mini-linkedin-academique

# Installer les dépendances frontend
cd frontend && npm install && npm start

# Importer la base de données
mysql -u root -p < database/mini_linkedin.sql

# Déployer le backend sur Tomcat
cp target/mini-linkedin.war /path/to/tomcat/webapps/
```

---

## 🗂️ Structure du Projet
```
mini-linkedin-academique/
├── frontend/          # React.js
├── backend/           # Java JEE (Servlets, DAO, Services)
├── database/          # Script SQL
└── uml/               # Diagrammes UML
```

---

## 👨‍💻 Équipe

Réalisé par l'équipe **LMSRANA** — IGA 2025

---

<p align="center">Réalisé avec ❤️ par l'équipe LMSRANA — IGA 2025</p>
