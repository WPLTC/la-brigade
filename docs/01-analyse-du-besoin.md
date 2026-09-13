# 1. Analyse du besoin

## Contexte

Un célèbre cuisinier français souhaite lancer **La Brigade**, une plateforme collaborative de recettes centrée sur la cuisine **bistronomique** : une cuisine accessible, créative et inspirée de la gastronomie.

La particularité du projet est la **garantie de qualité** : une recette proposée par la communauté n'est mise en avant qu'après avoir été **testée et validée par l'équipe du chef** (la « brigade »). Chaque mois, le chef teste lui-même la recette la plus populaire.

Le client prévoit à terme une **application mobile** disponible sur les stores : les choix techniques doivent le permettre.

## Acteurs

| Acteur | Description | Droits |
|---|---|---|
| Visiteur | Personne non connectée | Consulter l'accueil, les recettes validées, les profils publics, le concept |
| Membre | Utilisateur inscrit (rôle `USER`) | + proposer / modifier / supprimer ses recettes, noter, commenter, mettre en favori, gérer son profil |
| Membre de la brigade | Équipe du chef (rôle `CHEF_TEAM`) | + tester, valider ou refuser les recettes, composer la sélection bistronomique, désigner la recette du mois, gérer les rôles, modérer les commentaires |
| Le chef | Membre de la brigade particulier | Rédige le verdict de la recette du mois (même rôle technique que la brigade) |

## Exigences fonctionnelles

### Publier du contenu
- **F1** Proposer une recette : titre, description, catégorie (entrée, plat, dessert), difficulté, temps de préparation et de cuisson, nombre de portions.
- **F2** Ajouter une liste ordonnée d'ingrédients (nom + quantité) et d'étapes de préparation.
- **F3** Illustrer la recette avec une image (JPEG, PNG, WebP, 5 Mo max).
- **F4** Une recette proposée est **en attente** et invisible du public jusqu'à sa validation.
- **F5** L'auteur peut modifier une recette en attente ou refusée ; la modification la renvoie en validation. Une recette validée est figée.

### Consulter du contenu
- **F6** Parcourir les recettes validées sous forme de cartes (image, titre, auteur, durée, difficulté, note).
- **F7** Rechercher (titre, description, ingrédient) et filtrer (catégorie, difficulté, durée maximale, sélection bistronomique), trier (récentes, mieux notées, plus aimées, plus rapides), paginer.
- **F8** Consulter le détail : informations, ingrédients, étapes, notes, commentaires, retour de la brigade, verdict du chef.
- **F9** Découvrir les recettes validées et la sélection bistronomique mises en avant sur l'accueil.

### Interagir
- **F10** Noter une recette de 1 à 5 (une note par membre, modifiable ; pas sur sa propre recette).
- **F11** Commenter : partager un **avis** ou un **conseil de préparation**. L'auteur du commentaire et la brigade peuvent le supprimer.
- **F12** Mettre une recette en favori.

### Brigade
- **F13** Consulter la file des recettes à tester (de la plus ancienne à la plus récente) avec tout leur contenu.
- **F14** Valider ou refuser une recette ; un **retour argumenté est obligatoire en cas de refus** et reste visible par l'auteur.
- **F15** Sélectionner les recettes **bistronomiques**.
- **F16** Consulter le classement de popularité du mois et désigner la **recette du mois** avec le verdict du chef.
- **F17** Donner ou retirer l'accès brigade à un membre.

### Comptes
- **F18** S'inscrire, se connecter, se déconnecter.
- **F19** Profil privé : recettes et leur statut, favoris, notes et commentaires ; modification du nom et de la bio.
- **F20** Profil public d'un membre : ses recettes validées et ses derniers échanges.

## Exigences non fonctionnelles

| Domaine | Exigence |
|---|---|
| Expérience utilisateur | Interface simple, claire, agréable et **belle** ; respect de la charte (crème, charbon, rouge, olive) ; retours immédiats (notifications, états de chargement, messages d'erreur en français) |
| Accessibilité | Contrastes suffisants, libellés de formulaires, navigation clavier, attributs ARIA sur les composants interactifs |
| Responsive | Utilisable sur mobile, tablette et ordinateur |
| Évolutivité mobile | API REST sans état (JWT) réutilisable par une application mobile |
| Sécurité | Mots de passe hachés, contrôle des droits côté serveur, validation de toutes les entrées, types d'images contrôlés |
| Qualité | Code TypeScript typé, tests automatisés, documentation |
| Performance | Pagination, filtres et tris exécutés en base, moyenne des notes pré-calculée |

## Suggestions faites au client

Au-delà du brief, nous proposons :

1. **Un retour obligatoire en cas de refus** : l'auteur comprend ce qu'il doit corriger et peut resoumettre, ce qui fait progresser la qualité des recettes plutôt que de décourager les membres.
2. **Une règle de popularité transparente** (favori ×3, note ×2, commentaire ×1), affichée publiquement, pour que la « recette la plus populaire du mois » soit objective et incite la communauté à interagir.
3. **Distinguer les avis des conseils** dans les commentaires, pour valoriser les astuces de préparation demandées dans le brief.
4. **Des favoris**, interaction simple qui alimente la popularité et sert de liste de courses personnelle.
5. **Une page « Le concept »** qui explique la bistronomie, le parcours d'une recette et les critères de la brigade.
6. **Un profil public** pour valoriser les auteurs.
