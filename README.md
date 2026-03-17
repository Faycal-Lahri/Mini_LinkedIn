# 🎓 Mini LinkedIn Académique

![GitHub repo size](https://img.shields.io/github/repo-size/your-username/mini-linkedin-academique)
![GitHub stars](https://img.shields.io/github/stars/your-username/mini-linkedin-academique?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/mini-linkedin-academique?style=social)
![License](https://img.shields.io/badge/license-Academic-blue)
![Status](https://img.shields.io/badge/status-En%20développement-orange)
![Made with](https://img.shields.io/badge/Made%20with-Java%20JEE-red)

---

## 🌐 Présentation

**Mini LinkedIn Académique** est une application web inspirée des réseaux professionnels comme LinkedIn,
mais entièrement dédiée au monde universitaire et scientifique.

Elle permet aux étudiants, enseignants et chercheurs de :

- 🎯 Créer un profil académique complet et personnalisé
- 📄 Publier des projets, articles et travaux scientifiques
- 🔗 Développer leur réseau académique
- 🤝 Collaborer sur des projets communs
- 🔔 Recevoir des notifications en temps réel
- 🛡️ Bénéficier d'une plateforme modérée et sécurisée

> Projet réalisé dans le cadre des **Ateliers et Projet Tutoré en Développement Logiciel**
> — IGA · Équipe LMSRANA · 2025

---

## 🚀 Fonctionnalités Principales

| Module | Fonctionnalité |
|--------|---------------|
| 🔐 Authentification | Inscription, connexion, réinitialisation MDP, validation admin |
| 👤 Profil | Infos académiques, compétences, expériences, portfolio |
| 📢 Publications | Créer, modifier, supprimer, liker, commenter |
| 🔗 Réseau | Recherche, demandes de connexion, gestion des relations |
| 🤝 Collaboration | Créer et rejoindre des projets, gestion des membres |
| 🔔 Notifications | Alertes en temps réel sur toutes les interactions |
| 🛡️ Administration | Gestion utilisateurs, modération, statistiques |

---

## 👥 Utilisateurs & Rôles

| Rôle | Description | Accès |
|------|-------------|-------|
| 🎓 Étudiant | Valorise son parcours, cherche des stages et opportunités | Profil, publications, réseau, projets |
| 👨‍🏫 Enseignant | Encadre des projets, partage ses cours et expériences | Profil, publications, encadrement, réseau |
| 🔬 Chercheur | Publie des travaux scientifiques, propose des collaborations | Profil, publications scientifiques, projets de recherche |
| 🛡️ Admin | Gère et modère l'ensemble de la plateforme | Accès total |

---

## 🧩 Modules du Système

### 🔐 Module 1 — Authentification
> Gère l'accès à la plateforme et la sécurité des comptes.

- Inscription avec choix du rôle (étudiant / enseignant / chercheur)
- Confirmation par email
- Connexion sécurisée avec gestion de session
- Modification et réinitialisation du mot de passe
- Validation automatique (étudiant) ou manuelle par admin (enseignant / chercheur)

---

### 👤 Module 2 — Gestion du Profil Académique
> Permet à chaque membre de construire son identité académique.

- Informations personnelles et académiques (établissement, filière, niveau)
- Photo de profil et biographie
- Compétences techniques et certifications
- Expériences : stages (étudiant), cours (enseignant), recherches (chercheur)
- Publications scientifiques (enseignant / chercheur)
- Portfolio académique
- Consultation du profil public d'un autre membre

---

### 📢 Module 3 — Publications & Fil d'Actualité
> Permet de partager du contenu académique avec la communauté.

- Création de publications (texte, fichier, lien)
- Publication de projets universitaires (étudiant / enseignant)
- Publication d'articles scientifiques (enseignant / chercheur)
- Modification et suppression de publications
- Consultation du fil d'actualité en temps réel
- Likes et commentaires
- Suppression de ses propres commentaires

---

### 🔗 Module 4 — Réseau & Connexions
> Permet de construire et gérer son réseau académique.

- Recherche d'utilisateurs par nom, rôle ou spécialité
- Consultation du profil public avec ses publications
- Envoi de demandes de connexion
- Acceptation ou refus d'une demande
- Consultation des demandes en attente
- Gestion de la liste des connexions
- Suppression d'une connexion

---

### 🤝 Module 5 — Collaboration Académique
> Permet de travailler ensemble sur des projets communs.

- Proposition d'un projet académique (tous rôles)
- Proposition d'un projet de recherche (enseignant / chercheur)
- Rejoindre un projet existant
- Gestion des membres (accepter / refuser une participation)
- Supervision et encadrement d'un projet (enseignant / chercheur)
- Communication au sein du projet
- Publication de l'avancement et partage des résultats

---

### 🔔 Module 6 — Notifications
> Informe les utilisateurs en temps réel de toute activité.

- Notification de demande de connexion reçue
- Notification de demande de connexion acceptée
- Notification de like reçu sur une publication
- Notification de commentaire reçu
- Notification d'invitation à un projet
- Notification de validation de compte (enseignant / chercheur)
- Consultation et marquage des notifications comme lues

---

### 🛡️ Module 7 — Administration
> Donne à l'administrateur le contrôle total de la plateforme.

- Consultation de la liste de tous les utilisateurs
- Validation / refus des comptes enseignants et chercheurs
- Activation / désactivation d'un compte
- Suppression définitive d'un compte
- Modification du rôle d'un utilisateur
- Consultation et suppression des publications inappropriées
- Signalement / blocage d'un utilisateur
- Envoi d'avertissements
- Consultation des contenus signalés
- Consultation des statistiques globales et tableau de bord

---

## 🏗️ Conception UML

### 📌 Diagrammes réalisés

| Diagramme | Description |
|-----------|-------------|
| 📋 Use Case Global | Vue d'ensemble des 7 modules et 4 acteurs |
| 🔐 Use Case M1 | Authentification |
| 👤 Use Case M2 | Profil Académique |
| 📢 Use Case M3 | Publications |
| 🔗 Use Case M4 | Réseau & Connexions |
| 🤝 Use Case M5 | Collaboration |
| 🔔 Use Case M6 | Notifications |
| 🛡️ Use Case M7 | Administration |
| 📦 Diagramme de classes simplifié | Vue essentielle du système |
| 📦 Diagramme de classes complet | Vue exhaustive avec tous les attributs et méthodes |

### 🧠 Classes principales
