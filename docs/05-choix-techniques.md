# 5. Choix techniques

Critères de décision, par ordre d'importance :

1. **Compatibilité avec la future application mobile** (exigence du client).
2. **Technologies déjà connues de l'équipe**, conformément au conseil du brief.
3. Productivité et qualité : typage, outillage, écosystème.
4. Coût d'hébergement et simplicité de déploiement.

## Récapitulatif

| Besoin | Choix | Alternatives étudiées |
|---|---|---|
| Langage | **TypeScript** (front et back) | JavaScript, Python, PHP |
| Interface | **React 19 + Vite** | Vue, Angular, Next.js |
| Style | **Tailwind CSS 4** | CSS modules, Bootstrap, MUI |
| API | **Node.js + Express 5** | NestJS, Fastify, Django, Laravel |
| Base de données | **PostgreSQL** | MySQL, MongoDB, SQLite |
| Accès aux données | **Prisma** | TypeORM, SQL brut, Sequelize |
| Validation | **zod** | Joi, express-validator |
| Authentification | **JWT + bcrypt** | Sessions + cookies, Auth0, Supabase Auth |
| Tests | **Vitest + Supertest** | Jest |

## Justifications

### TypeScript partout
Un seul langage pour toute l'équipe, front comme back. Le typage détecte les erreurs dès l'écriture : champs manquants, faute de frappe dans un statut, réponse d'API mal utilisée. Il sert aussi de documentation vivante. Le schéma Prisma génère automatiquement les types des tables.

### React + Vite
- React est la bibliothèque la plus répandue et la plus enseignée : l'équipe la connaît déjà.
- **Argument décisif pour le mobile** : React Native reprend les mêmes concepts (composants, hooks, contextes). Une partie de la logique (client API, types, formatage) est réutilisable.
- Vite offre un rechargement instantané en développement et un build optimisé.
- *Next.js écarté* : le rendu serveur n'est pas nécessaire pour ce projet, et il aurait couplé front et API alors que l'API doit rester indépendante pour le mobile.

### Tailwind CSS
Il permet de construire rapidement une interface **sur mesure** fidèle à la charte (couleurs crème / charbon / rouge / olive déclarées comme variables de thème). On évite l'aspect générique des bibliothèques de composants toutes faites, alors que le brief insiste sur une interface **belle** et singulière.

### Express 5
Minimaliste et connu de tous. La version 5 gère nativement les erreurs des fonctions asynchrones, ce qui simplifie le code des contrôleurs. *NestJS écarté* : plus structurant, mais plus long à apprendre pour la durée du projet.

### PostgreSQL + Prisma
- Les données sont **fortement relationnelles** (recettes, auteurs, notes, commentaires, favoris) et exigent des contraintes d'unicité (une note par membre, une recette du mois par mois) : une base relationnelle s'impose. *MongoDB écarté* pour cette raison.
- PostgreSQL : robuste, gratuit, gère la recherche insensible à la casse et est proposé par tous les hébergeurs (Supabase, Neon, Render, Railway…).
- Prisma : schéma lisible qui sert de documentation, **migrations versionnées** dans Git, requêtes typées, protection contre l'injection SQL, et Prisma Studio pour explorer les données.

### zod
Les règles de validation sont déclarées une seule fois, avec des **messages en français** directement affichables à l'utilisateur, et les types TypeScript en sont déduits.

### JWT plutôt que des sessions
Un token dans l'en-tête `Authorization` fonctionne **à l'identique pour un navigateur et une application mobile**, sans gestion de cookies ni état côté serveur, ce qui facilite aussi la montée en charge. Pour limiter le principal défaut des JWT (droits figés dans le token), le rôle est **relu en base** pour toutes les actions sensibles.

### Stockage des images sur disque
C'est la solution la plus simple pour le projet, avec un contrôle strict des fichiers. L'accès aux images passe par un unique module (`lib/upload.ts`), ce qui permet de basculer plus tard vers un stockage objet (S3, Cloudinary, Supabase Storage) sans toucher au reste du code.

### Docker Compose pour la base
Chaque développeur obtient la même base PostgreSQL avec une seule commande, sans installation locale, et la base de test est créée automatiquement.

## Application mobile

Deux trajectoires sont compatibles avec l'architecture actuelle :

| | Capacitor | React Native (Expo) |
|---|---|---|
| Principe | Emballe le front web existant dans une application native | Nouvelle interface native qui consomme la même API |
| Réutilisation | ~100 % du front | API, types, client HTTP, logique de formatage |
| Délai | Court | Plus long |
| Expérience | Proche du web | Native (gestes, performances, caméra) |
| Recommandation | Première version sur les stores | Version 2 si l'usage mobile devient majoritaire |

Dans les deux cas, **aucune modification de l'API n'est nécessaire**. Les seuls ajouts prévus sont les notifications push et le stockage objet des images.
