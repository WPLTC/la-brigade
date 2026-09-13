# 2. Conception

## Diagramme de cas d'utilisation

```mermaid
flowchart LR
    V([Visiteur])
    M([Membre])
    B([Brigade / Chef])

    subgraph Plateforme La Brigade
        UC1(Consulter l'accueil et le concept)
        UC2(Rechercher et filtrer les recettes)
        UC3(Consulter le détail d'une recette)
        UC4(Consulter un profil public)
        UC5(S'inscrire / se connecter)
        UC6(Proposer une recette)
        UC7(Modifier / supprimer sa recette)
        UC8(Noter une recette)
        UC9(Commenter : avis ou conseil)
        UC10(Mettre en favori)
        UC11(Gérer son profil)
        UC12(Tester, valider ou refuser une recette)
        UC13(Composer la sélection bistronomique)
        UC14(Désigner la recette du mois)
        UC15(Gérer les rôles des membres)
        UC16(Supprimer un commentaire)
    end

    V --> UC1 & UC2 & UC3 & UC4 & UC5
    M --> UC6 & UC7 & UC8 & UC9 & UC10 & UC11
    B --> UC12 & UC13 & UC14 & UC15 & UC16
    M -. hérite de .-> V
    B -. hérite de .-> M
```

Un membre peut faire tout ce que fait un visiteur ; un membre de la brigade peut faire tout ce que fait un membre.

## Diagramme de classes (modèle métier)

```mermaid
classDiagram
    direction LR
    class User {
        +String id
        +String email
        +String password (haché)
        +String name
        +String? bio
        +Role role
        +DateTime createdAt
    }
    class Recipe {
        +String id
        +String title
        +String description
        +String? imageUrl
        +RecipeCategory category
        +RecipeDifficulty difficulty
        +Int prepTime
        +Int cookTime
        +Int totalTime
        +Int servings
        +RecipeStatus status
        +Boolean isBistronomic
        +String? reviewNote
        +DateTime? reviewedAt
        +Float averageRating
        +Int ratingsCount
    }
    class Ingredient {
        +String name
        +String quantity
        +Int position
    }
    class Step {
        +Int order
        +String description
    }
    class Comment {
        +String content
        +CommentKind kind
        +DateTime createdAt
    }
    class Rating {
        +Int value (1..5)
    }
    class Favorite {
        +DateTime createdAt
    }
    class ChefPick {
        +String month (AAAA-MM)
        +String verdict
        +Int score
    }
    class Role {
        <<enumeration>>
        USER
        CHEF_TEAM
    }
    class RecipeStatus {
        <<enumeration>>
        PENDING
        VALIDATED
        REJECTED
    }

    User "1" --> "*" Recipe : propose
    User "1" --> "*" Recipe : teste (reviewer)
    Recipe "1" *-- "1..*" Ingredient
    Recipe "1" *-- "1..*" Step
    User "1" --> "*" Comment : écrit
    Recipe "1" *-- "*" Comment
    User "1" --> "*" Rating : donne
    Recipe "1" *-- "*" Rating
    User "1" --> "*" Favorite
    Recipe "1" *-- "*" Favorite
    User "1" --> "*" ChefPick : rédige le verdict
    Recipe "1" --> "*" ChefPick : élue
```

Règles portées par le modèle :

- une note par membre et par recette (`Rating` unique sur `recipeId + authorId`) ;
- un favori par membre et par recette ;
- une seule recette du mois par mois (`ChefPick.month` unique) ;
- la suppression d'une recette supprime ses ingrédients, étapes, notes, commentaires, favoris et élections (composition).

## Cycle de vie d'une recette

```mermaid
stateDiagram-v2
    [*] --> PENDING : le membre propose
    PENDING --> VALIDATED : la brigade valide\n(+ sélection bistronomique possible)
    PENDING --> REJECTED : la brigade refuse\n(retour obligatoire)
    REJECTED --> PENDING : l'auteur corrige et resoumet
    PENDING --> PENDING : l'auteur modifie
    VALIDATED --> REJECTED : la brigade dépublie\n(retour obligatoire)
    VALIDATED --> VALIDATED : ajout / retrait de la sélection bistronomique
    PENDING --> [*] : suppression
    REJECTED --> [*] : suppression
    VALIDATED --> [*] : suppression
```

| Statut | Visible par | Modifiable par l'auteur | Interactions (notes, commentaires, favoris) |
|---|---|---|---|
| `PENDING` | auteur + brigade | oui | non |
| `REJECTED` | auteur + brigade | oui (renvoie en `PENDING`) | non |
| `VALIDATED` | tout le monde | non | oui |

## Diagrammes de séquence

### Proposer une recette avec une photo

```mermaid
sequenceDiagram
    actor M as Membre
    participant F as Front React
    participant A as API Express
    participant DB as PostgreSQL
    participant FS as Disque (uploads)

    M->>F: Remplit le formulaire et choisit une photo
    F->>F: Validation côté client (titre, catégorie, ingrédients…)
    F->>A: POST /api/recipes (JSON + token JWT)
    A->>A: requireAuth puis validation zod
    A->>DB: INSERT Recipe + Ingredient[] + Step[] (statut PENDING)
    DB-->>A: id de la recette
    A-->>F: 201 { id, status: PENDING }
    F->>A: POST /api/recipes/:id/image (multipart)
    A->>A: multer : type MIME et taille
    A->>FS: Enregistre uuid.jpg
    A->>DB: UPDATE Recipe.imageUrl
    A-->>F: 200 { imageUrl }
    F-->>M: Notification + redirection vers la recette (bandeau « en attente »)
```

### Validation par la brigade

```mermaid
sequenceDiagram
    actor B as Membre de la brigade
    participant F as Front React
    participant A as API Express
    participant DB as PostgreSQL

    B->>F: Ouvre l'espace brigade
    F->>A: GET /api/moderation/recipes?status=PENDING
    A->>DB: Rôle relu en base (requireChefTeam)
    A->>DB: Recettes en attente (plus anciennes d'abord)
    A-->>F: Liste avec ingrédients et étapes
    B->>F: Teste la recette, rédige un retour, coche « bistronomique »
    F->>A: PATCH /api/moderation/recipes/:id { status, reviewNote, isBistronomic }
    A->>A: zod : retour obligatoire si REJECTED
    A->>DB: UPDATE status, reviewNote, reviewerId, reviewedAt
    A-->>F: 200
    F-->>B: La recette sort de la file, compteurs mis à jour
```

### Noter une recette (moyenne pré-calculée)

```mermaid
sequenceDiagram
    actor M as Membre
    participant A as API Express
    participant DB as PostgreSQL

    M->>A: POST /api/recipes/:id/ratings { value: 4 }
    A->>DB: La recette est-elle validée ? L'auteur est-il différent ?
    A->>DB: BEGIN
    A->>DB: UPSERT Rating (recipeId, authorId)
    A->>DB: AVG(value), COUNT(*) des notes de la recette
    A->>DB: UPDATE Recipe.averageRating, ratingsCount
    A->>DB: COMMIT
    A-->>M: { myRating, averageRating, ratingsCount }
```

### Recette du mois

```mermaid
sequenceDiagram
    actor C as Chef
    participant A as API Express
    participant S as Service popularité
    participant DB as PostgreSQL

    C->>A: GET /api/moderation/monthly?month=2026-09
    A->>DB: COUNT favoris / notes / commentaires du mois, groupés par recette
    A->>S: rankByPopularity(compteurs)
    S-->>A: score = favoris×3 + notes×2 + commentaires×1, trié
    A-->>C: Classement
    C->>A: PUT /api/moderation/monthly/2026-09 { recipeId, verdict }
    A->>DB: UPSERT ChefPick (month unique)
    A-->>C: 200 : visible sur l'accueil et sur la recette
```
