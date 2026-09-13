# 10. Difficultés rencontrées et évolutions

## Difficultés et solutions

| Difficulté | Solution apportée |
|---|---|
| **Reprise d'un projet commencé par un autre membre** : socle fonctionnel, mais modèle de données trop limité (pas de catégorie, de temps ni de difficulté) et validation réduite à « valider / refuser » | Analyse de l'existant, puis évolution **par migration Prisma** plutôt que par réécriture : les données existantes restent compatibles grâce à des valeurs par défaut |
| **Trier par note moyenne** : Prisma ne permet pas de trier sur un agrégat, et charger toutes les recettes pour trier en mémoire aurait cassé la pagination | Dénormalisation de `averageRating` et `ratingsCount`, recalculés dans une **transaction** à chaque note |
| **Filtrer par durée totale** (« 30 min max ») : impossible de comparer la somme de deux colonnes avec Prisma | Colonne `totalTime` calculée à l'écriture |
| **Définir objectivement « la recette la plus populaire du mois »** | Score pondéré public (favori ×3, note ×2, commentaire ×1) calculé sur les interactions **datées du mois**, dans un service pur testé unitairement |
| **Erreurs d'API illisibles** : l'ancien code renvoyait l'objet d'erreur brut de zod, affiché « Une erreur est survenue » | Fonction `parse()` qui renvoie le premier message, rédigé en français dans les schémas, et middleware d'erreurs centralisé |
| **Erreurs asynchrones non capturées** avec Express 4 : une recette introuvable pouvait faire planter une requête | Passage à **Express 5**, qui transmet les rejets de promesses au gestionnaire d'erreurs, et conversion des erreurs Prisma en 404 / 409 |
| **Droits figés dans le JWT** : un membre retiré de la brigade gardait ses droits jusqu'à l'expiration du token | Rôle **relu en base** pour les actions de modération, et token rafraîchi au chargement de l'application (`/auth/me`) |
| **Envoi de la recette et de l'image** : l'image ne peut être rattachée qu'à une recette existante | Création en JSON puis envoi de l'image ; si l'image échoue, la recette est conservée et l'utilisateur est prévenu. Côté serveur, un fichier orphelin est supprimé en cas d'erreur |
| **Recettes non validées accessibles par URL** | Réponse 404 pour toute personne autre que l'auteur et la brigade |
| **Tests d'API sans polluer la base de développement** | Base PostgreSQL de test dédiée, migrations appliquées automatiquement avant les tests, tables vidées au début de la suite |
| **Recherche qui se relançait à chaque frappe et effaçait la saisie** | Délai de 350 ms avant la mise à jour de l'URL et mémorisation de la dernière valeur envoyée pour éviter d'écraser la saisie en cours |

## Tests réalisés

- **31 tests automatisés** (`npm test`) :
  - tests unitaires des règles métier : score de popularité, gestion des mois, construction des filtres et tris, schémas de validation ;
  - tests d'intégration de l'API sur une vraie base PostgreSQL, qui déroulent tout le parcours : inscription, doublon d'email, proposition invisible du public, refus sans retour interdit, refus puis correction, validation bistronomique, verrouillage d'une recette validée, notes (dont interdiction de noter sa recette), commentaires, favoris, classement du mois, désignation par le chef, gestion des rôles.
- **Parcours de bout en bout dans le navigateur** (Playwright) : redirection vers la connexion, inscription, formulaire avec photo, validation par la brigade, recherche et filtres, note, conseil, favori.
- **Vérification visuelle** sur ordinateur et sur mobile (captures dans [les maquettes](07-maquettes.md)).
- **Compilation TypeScript sans erreur** côté client et serveur.

## Pistes d'amélioration

### Court terme
- **Notifications** (email ou dans l'application) quand une recette est validée, refusée ou élue recette du mois.
- **Réinitialisation du mot de passe** par email et vérification de l'adresse à l'inscription.
- **Limitation du nombre de requêtes** (rate limiting) sur la connexion et la création de contenu.
- **Recalcul des quantités** selon le nombre de portions (nécessite de stocker quantité et unité séparément).
- **Signalement** d'un commentaire inapproprié par les membres.

### Moyen terme
- **Stockage des images dans le cloud** (S3, Cloudinary) avec redimensionnement et formats modernes.
- **Recherche plein texte** PostgreSQL (`tsvector`) avec tolérance aux fautes.
- **Tags** (végétarien, sans gluten, de saison) et filtres associés.
- **Mode cuisine** : affichage étape par étape en plein écran, écran maintenu allumé, minuteurs.
- **Tests de composants** React (Testing Library) et intégration continue (GitHub Actions : typage, tests, build à chaque pull request).
- **Déploiement** : front et API sur un service PaaS (Render, Railway), base managée (Neon, Supabase).

### Long terme
- **Application mobile** (voir [choix techniques](05-choix-techniques.md#application-mobile)) : liste de courses générée à partir des favoris, notifications push, photo prise directement depuis l'application.
- **Abonnement à des auteurs** et fil d'actualité.
- **Vidéos** des gestes techniques, et vidéo du chef pour la recette du mois.
- **Tableau de bord** de la brigade : délai moyen de validation, taux d'acceptation, recettes les plus consultées.
