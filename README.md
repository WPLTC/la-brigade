# La Brigade

Plateforme collaborative de recettes bistronomiques : les utilisateurs proposent des recettes, l'équipe du chef les valide, et la communauté les découvre, les note et les commente.

## Stack technique

- **Frontend** : React + Vite + TypeScript, Tailwind CSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL via Prisma (ORM)
- **Auth** : JWT + bcryptjs

## Structure du repo

```
la-brigade/
├── client/          # Application React (Vite)
└── server/          # API Express + Prisma
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── controllers/
        ├── middleware/
        ├── routes/
        └── lib/
```

## Démarrer le projet

### Prérequis

- Node.js 20+
- Une base PostgreSQL locale (ou via Docker)

### Backend

```bash
cd server
cp .env.example .env   # renseigner DATABASE_URL et JWT_SECRET
npm install
npm run prisma:migrate
npm run dev             # http://localhost:3001
```

### Frontend

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

Le frontend proxy les appels `/api` vers `http://localhost:3001` (voir `client/vite.config.ts`).

### Voir la base de données (Prisma Studio)

```bash
cd server
npm run prisma:studio    # http://localhost:5555
```

Ouvre une interface web pour consulter et éditer les tables (User, Recipe, Ingredient, Step, Comment, Rating) directement dans le navigateur.

## API

| Méthode | Route                       | Description                              | Auth requise      |
|---------|------------------------------|-------------------------------------------|--------------------|
| POST    | `/api/auth/register`         | Créer un compte                          | -                  |
| POST    | `/api/auth/login`            | Se connecter                             | -                  |
| GET     | `/api/recipes`               | Lister les recettes (validées, ou toutes pour l'équipe du chef) | optionnelle |
| GET     | `/api/recipes/:id`           | Détail d'une recette                     | -                  |
| POST    | `/api/recipes`               | Proposer une recette                      | oui                |
| PATCH   | `/api/recipes/:id/status`    | Valider / refuser une recette             | oui (équipe du chef) |
| POST    | `/api/recipes/:id/comments`  | Commenter une recette                     | oui                |
| POST    | `/api/recipes/:id/ratings`   | Noter une recette                        | oui                |
