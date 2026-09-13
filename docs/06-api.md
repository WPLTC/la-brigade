# 6. API REST

- URL de base : `http://localhost:3001/api`
- Format : JSON (sauf l'envoi d'image en `multipart/form-data`)
- Authentification : en-tête `Authorization: Bearer <token>`, token obtenu à l'inscription ou à la connexion
- Erreurs : `{ "error": "message lisible en français" }` avec le code HTTP adapté (400 données invalides, 401 non connecté, 403 interdit, 404 introuvable, 409 conflit)

Légende de la colonne « Accès » : **public**, **membre** (connecté), **brigade** (rôle `CHEF_TEAM`).

## Authentification

| Méthode | Route | Accès | Corps | Réponse |
|---|---|---|---|---|
| POST | `/auth/register` | public | `{ name, email, password }` (mot de passe ≥ 8 caractères) | `201 { token, user }` |
| POST | `/auth/login` | public | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | membre | – | `{ token, user }` (token et rôle rafraîchis) |

## Accueil

| Méthode | Route | Accès | Réponse |
|---|---|---|---|
| GET | `/home` | public | `{ stats, categories, chefPick, featured, latest, monthlyRace }` |
| GET | `/chef-picks` | public | Historique des recettes du mois avec verdict |

## Recettes

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/recipes` | public | Recettes validées, paginées et filtrées (voir paramètres) |
| GET | `/recipes/:id` | public* | Détail complet. *Recette non validée : auteur ou brigade uniquement |
| POST | `/recipes` | membre | Proposer une recette (statut `PENDING`) |
| PUT (ou PATCH) | `/recipes/:id` | auteur | Modifier une recette en attente ou refusée ; elle repasse en `PENDING` |
| DELETE | `/recipes/:id` | auteur ou brigade | Supprimer (et son image) |
| POST | `/recipes/:id/image` | auteur | Envoyer la photo (champ `image`, jpeg/png/webp, 5 Mo) |
| POST | `/recipes/:id/ratings` | membre | `{ value: 1..5 }`, pas sur sa propre recette ; renvoie la nouvelle moyenne |
| POST | `/recipes/:id/comments` | membre | `{ content, kind: "AVIS" \| "CONSEIL" }` |
| PUT | `/recipes/:id/favorite` | membre | Ajouter aux favoris (idempotent) |
| DELETE | `/recipes/:id/favorite` | membre | Retirer des favoris |
| DELETE | `/comments/:id` | auteur du commentaire ou brigade | Supprimer un commentaire |

### Paramètres de `GET /recipes`

| Paramètre | Valeurs | Défaut |
|---|---|---|
| `search` | texte, cherché dans le titre, la description et les ingrédients | – |
| `category` | `ENTREE`, `PLAT`, `DESSERT` | – |
| `difficulty` | `FACILE`, `MOYEN`, `DIFFICILE` | – |
| `maxTime` | minutes (préparation + cuisson) | – |
| `bistronomic` | `true`, `false` | – |
| `sort` | `recent`, `rating`, `popular`, `quick` | `recent` |
| `page`, `pageSize` | entiers (`pageSize` ≤ 48) | `1`, `12` |

Exemple : `GET /api/recipes?category=PLAT&maxTime=60&bistronomic=true&sort=rating`

```json
{
  "items": [
    {
      "id": "cmtzq3eyz0008viss…",
      "title": "Onglet de bœuf, frites maison au persil",
      "category": "PLAT",
      "difficulty": "MOYEN",
      "totalTime": 55,
      "isBistronomic": true,
      "averageRating": 4.8,
      "ratingsCount": 5,
      "author": { "id": "…", "name": "Hugo Bernard", "role": "USER" },
      "chefPicks": [{ "month": "2026-08" }],
      "_count": { "comments": 3, "favorites": 3 }
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 12,
  "totalPages": 1
}
```

### Corps de `POST /recipes` et `PUT /recipes/:id`

```json
{
  "title": "Risotto crémeux aux cèpes",
  "description": "Un risotto nacré puis mouillé patiemment au bouillon…",
  "category": "PLAT",
  "difficulty": "MOYEN",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "ingredients": [{ "name": "Riz arborio", "quantity": "320 g" }],
  "steps": [{ "description": "Nacrer le riz 2 minutes." }]
}
```

### Réponse de `GET /recipes/:id` (extrait)

Elle contient, en plus des champs de la recette : `ingredients`, `steps`, `comments`, `reviewNote`, `reviewer`, `chefPicks` (avec le verdict), `ratingDistribution` (`{ "1": 0, …, "5": 4 }`), `myRating`, `isFavorite`, et un objet `permissions` (`canEdit`, `canDelete`, `canModerate`, `canRate`) calculé par le serveur, que le front utilise pour afficher les bons boutons.

## Membres

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/users/me` | membre | Profil complet : recettes (tous statuts, retour de la brigade), favoris, notes, commentaires |
| PATCH | `/users/me` | membre | `{ name, bio }` |
| GET | `/users/:id` | public | Profil public : recettes validées, derniers commentaires, compteurs |

## Espace brigade

Toutes ces routes exigent le rôle `CHEF_TEAM`, **relu en base** à chaque appel.

| Méthode | Route | Description |
|---|---|---|
| GET | `/moderation/stats` | Compteurs (en attente, validées, refusées, bistronomiques, membres…) |
| GET | `/moderation/recipes?status=PENDING` | File de test avec ingrédients et étapes (`PENDING` : les plus anciennes d'abord) |
| PATCH | `/moderation/recipes/:id` | `{ status: "VALIDATED" \| "REJECTED", reviewNote?, isBistronomic? }` ; `reviewNote` (≥ 5 caractères) obligatoire pour un refus |
| GET | `/moderation/monthly?month=AAAA-MM` | Classement de popularité du mois, recette élue, historique |
| PUT | `/moderation/monthly/:month` | `{ recipeId, verdict }` : désigne la recette du mois |
| DELETE | `/moderation/monthly/:month` | Retire la recette du mois |
| GET | `/moderation/users?search=` | Liste des membres avec compteurs |
| PATCH | `/moderation/users/:id/role` | `{ role: "USER" \| "CHEF_TEAM" }` (impossible sur soi-même) |

## Divers

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Vérification que l'API répond |
| GET | `/uploads/:fichier` | Images des recettes (fichiers statiques) |
