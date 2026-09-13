# La Brigade

Plateforme collaborative de recettes **bistronomiques** : les membres proposent leurs recettes, **l'équipe du chef les teste et les valide**, puis la communauté les découvre, les note, les commente et les met en favoris. Chaque mois, le chef goûte **la recette la plus populaire** et publie son verdict.

![Page d'accueil](docs/captures/accueil.png)

## Fonctionnalités

| Besoin du brief | Réalisation |
|---|---|
| Publier une recette (ingrédients, étapes, image) | Formulaire guidé avec catégorie, difficulté, temps, portions, glisser-déposer de la photo, réordonnancement des lignes et aperçu en direct de la carte |
| Parcourir les recettes, filtres | Recherche (titre, description, ingrédients), filtres catégorie / difficulté / durée / sélection bistronomique, 4 tris, pagination, filtres conservés dans l'URL |
| Consulter le détail | Photo, infos clés, ingrédients à cocher, étapes à valider, mot de la brigade, verdict du chef |
| Découvrir les recettes validées par le chef | Seules les recettes validées sont publiques ; badge et filtre « Bistronomique » ; badge « Recette du mois » |
| Commenter, noter, partager ses conseils | Notes de 1 à 5 avec répartition, commentaires de type *Avis* ou *Conseil*, favoris, partage |
| Valider / refuser les recettes (accès spécial) | Rôle `CHEF_TEAM`, **espace brigade** : file de test, retour obligatoire en cas de refus, sélection bistronomique, gestion des membres |
| Recette la plus populaire du mois testée par le chef | Classement automatique (favori ×3, note ×2, commentaire ×1) et désignation avec verdict |
| Page profil | Profil privé (mes recettes et leur statut, retours de la brigade, favoris, interactions, édition) et profil public |
| Inscription / connexion | JWT, mots de passe hachés (bcrypt), retour automatique sur la page demandée |
| Future application mobile | API REST sans état consommable telle quelle par une app React Native / Capacitor, manifeste PWA, interface responsive |

## Stack technique

- **Frontend** : React 19 + Vite + TypeScript, Tailwind CSS 4, React Router, lucide-react
- **Backend** : Node.js + Express 5 + TypeScript, validation zod, upload multer
- **Base de données** : PostgreSQL 16 via Prisma (ORM + migrations)
- **Auth** : JWT + bcryptjs
- **Tests** : Vitest + Supertest (tests unitaires et tests d'intégration de l'API)

## Démarrage rapide

Prérequis : Node.js 20+ et Docker (ou un PostgreSQL local).

```bash
# 1. Dépendances (racine, server, client)
npm run install:all

# 2. Base de données PostgreSQL (port 5434)
npm run db:up
cp server/.env.example server/.env

# 3. Tables + jeu de données de démonstration
npm run db:setup

# 4. API (http://localhost:3001) + front (http://localhost:5173)
npm run dev
```

### Comptes de démonstration

Mot de passe commun : `Brigade2026!`

| Compte | Rôle |
|---|---|
| `chef@labrigade.fr` | Équipe du chef (accès à l'espace brigade) |
| `brigade@labrigade.fr` | Équipe du chef |
| `lea@example.com`, `hugo@example.com`, `ines@example.com`, `thomas@example.com`, `sarah@example.com` | Membres |

### Autres commandes

```bash
npm test                              # tests unitaires + intégration (server)
npm run build                         # compilation server + client
npm run prisma:studio --prefix server # explorer la base dans le navigateur
npm run db:reset --prefix server      # repartir d'une base vide (+ seed)
```

> Sans Docker : créer une base PostgreSQL et adapter `DATABASE_URL` dans `server/.env`.

## Structure du dépôt

```
la-brigade/
├── client/                    # Application React (Vite)
│   ├── public/                # favicon, manifeste PWA, images
│   └── src/
│       ├── components/        # Layout, Navbar, RecipeCard, ui, moderation/…
│       ├── context/           # AuthContext (session), ToastContext (notifications)
│       ├── hooks/
│       ├── lib/               # api (fetch), types, format
│       └── pages/             # une page par route
├── server/                    # API Express
│   ├── prisma/                # schema.prisma, migrations, seed + images de démo
│   ├── src/
│   │   ├── controllers/       # logique HTTP par ressource
│   │   ├── middleware/        # auth (JWT, rôles), gestion d'erreurs
│   │   ├── routes/            # déclaration des routes
│   │   ├── schemas/           # validation zod des entrées
│   │   ├── services/          # règles métier pures (filtres, popularité)
│   │   ├── lib/               # prisma, upload, erreurs HTTP
│   │   ├── app.ts             # construction de l'application
│   │   └── index.ts           # démarrage du serveur
│   └── tests/                 # Vitest + Supertest
├── docs/                      # dossier de conception et documentation
└── docker-compose.yml         # PostgreSQL de développement
```

## Documentation

Tout le dossier est dans [`docs/`](docs/README.md) : analyse du besoin, conception (UML), base de données, architecture, choix techniques, API, maquettes, organisation et planning, guide utilisateur, difficultés et évolutions, ainsi que le [dossier technique](docs/DOSSIER_TECHNIQUE.md).
