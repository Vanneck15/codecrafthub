# CodeCraftHub - Plateforme d'apprentissage personnalisée

CodeCraftHub est une API REST d'apprentissage simple développée avec Python et le framework Flask. Elle permet aux développeurs de gérer les cours qu'ils souhaitent suivre en stockant les informations directement dans un fichier JSON, sans avoir besoin d'une base de données complexe.

## 🚀 Fonctionnalités
- **CRUD complet** pour la gestion des cours (Créer, Lire, Mettre à jour, Supprimer).
- **Persistance des données** automatique dans un fichier local `courses.json`.
- **Validation stricte** des données entrantes (champs obligatoires, statuts autorisés).
- **Point de terminaison Bonus** pour consulter les statistiques de progression.

## 📁 Structure du Projet
```text
codecrafthub/
├── app.py              # Application Flask principale (contenant l'API)
├── courses.json        # Fichier de stockage de données (généré automatiquement)
├── requirements.txt    # Dépendances Python du projet
└── README.md           # Documentation du projet