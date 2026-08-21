# CodeCraftHub — Suivez votre progression d'apprentissage

CodeCraftHub est une application web pour organiser ses cours, suivre sa progression et garder le
cap sur ses échéances d'apprentissage.

**🔗 Démo en ligne :** https://vanneck15.github.io/codecrafthub/

## Application web (frontend)

Le frontend est une application entièrement autonome (HTML/CSS/JS vanilla, sans build ni
dépendance) qui stocke les cours dans le `localStorage` du navigateur — elle fonctionne donc en
ouvrant simplement `index.html`, ou déployée sur GitHub Pages sans aucune configuration serveur.

### Fonctionnalités

- Tableau de bord avec statistiques en temps réel (total, par statut, taux de complétion)
- Ajout, modification et suppression de cours via une modale
- Recherche et filtrage par statut
- Alerte visuelle sur les échéances (jours restants / retard)
- Thème clair/sombre (respecte la préférence système, bascule manuelle mémorisée)
- Interface entièrement en français, responsive (mobile → desktop)

### Lancer en local

Aucune installation requise :

```bash
# Python
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

ou ouvrez simplement `index.html` dans votre navigateur.

## API REST (backend Flask, optionnel)

Une API Flask (`app.py`) est fournie en complément, pour qui veut un vrai backend avec persistance
serveur plutôt que le `localStorage` du frontend.

```bash
pip install -r requirements.txt
python app.py
# API disponible sur http://localhost:5000
```

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/courses` | Liste tous les cours |
| GET | `/api/courses/<id>` | Détail d'un cours |
| POST | `/api/courses` | Créer un cours |
| PUT | `/api/courses/<id>` | Modifier un cours |
| DELETE | `/api/courses/<id>` | Supprimer un cours |
| GET | `/api/courses/stats` | Statistiques de progression |

Statuts valides : `Non commencé`, `En cours`, `Terminé`.

> Le frontend et l'API sont actuellement indépendants (le frontend utilise `localStorage`, pas
> l'API) — c'est un choix délibéré pour permettre un déploiement statique gratuit sur GitHub Pages
> sans dépendre d'un serveur Python en ligne. Pour connecter les deux, remplacez les fonctions de
> stockage dans `assets/js/app.js` par des appels `fetch()` vers l'API.

## Structure du projet

```
codecrafthub/
├── index.html              # Application web
├── assets/
│   ├── css/style.css        # Design system (thème clair/sombre, responsive)
│   └── js/app.js             # Logique applicative (CRUD, filtres, stockage)
├── app.py                   # API REST Flask (optionnelle)
├── requirements.txt          # Dépendances Python de l'API
└── .github/workflows/
    └── deploy.yml             # Déploiement automatique sur GitHub Pages
```
