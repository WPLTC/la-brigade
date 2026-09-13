/**
 * Jeu de données de démonstration : npm run db:seed
 *
 * ATTENTION : vide entièrement la base avant de la remplir.
 * Comptes créés (mot de passe commun : Brigade2026!) :
 *   - chef@labrigade.fr      -> équipe du chef (accès à la validation)
 *   - brigade@labrigade.fr   -> équipe du chef
 *   - lea@example.com, hugo@example.com, ines@example.com, thomas@example.com, sarah@example.com
 */
import { PrismaClient, type Category, type CommentKind, type Difficulty, type RecipeStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const IMAGES_DIR = fileURLToPath(new URL('./seed-images', import.meta.url))
const UPLOADS_DIR = fileURLToPath(new URL('../uploads', import.meta.url))
const PASSWORD = 'Brigade2026!'

const DAY = 24 * 60 * 60 * 1000
const daysAgo = (days: number) => new Date(Date.now() - days * DAY)

/** Date située dans le mois courant, n jours après le début du mois (sans dépasser aujourd'hui) */
function inCurrentMonth(dayOffset: number) {
  const now = new Date()
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 10)
  return new Date(Math.min(start + dayOffset * DAY, now.getTime() - 60 * 1000))
}

function previousMonthKey() {
  const now = new Date()
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

interface SeedRecipe {
  key: string
  title: string
  description: string
  image: string
  category: Category
  difficulty: Difficulty
  prepTime: number
  cookTime: number
  servings: number
  status: RecipeStatus
  isBistronomic?: boolean
  reviewNote?: string
  author: string
  createdDaysAgo: number
  ingredients: [string, string][]
  steps: string[]
}

const USERS = [
  { key: 'chef', name: 'Chef Auguste', email: 'chef@labrigade.fr', role: 'CHEF_TEAM', bio: 'Chef fondateur de La Brigade. Je goûte chaque mois la recette préférée de la communauté.' },
  { key: 'brigade', name: 'Camille de la Brigade', email: 'brigade@labrigade.fr', role: 'CHEF_TEAM', bio: 'Second de cuisine. Je teste vos recettes en conditions réelles avant publication.' },
  { key: 'lea', name: 'Léa Martin', email: 'lea@example.com', role: 'USER', bio: 'Passionnée de cuisine de saison et de marchés bretons.' },
  { key: 'hugo', name: 'Hugo Bernard', email: 'hugo@example.com', role: 'USER', bio: 'Ancien commis, aujourd\'hui cuisinier du dimanche exigeant.' },
  { key: 'ines', name: 'Inès Robert', email: 'ines@example.com', role: 'USER', bio: 'Pâtissière amatrice, fan de desserts à l\'assiette.' },
  { key: 'thomas', name: 'Thomas Petit', email: 'thomas@example.com', role: 'USER', bio: null },
  { key: 'sarah', name: 'Sarah Durand', email: 'sarah@example.com', role: 'USER', bio: 'Je cuisine vite, mais bien.' },
] as const

const RECIPES: SeedRecipe[] = [
  {
    key: 'onglet',
    title: 'Onglet de bœuf, frites maison au persil',
    description:
      "Le grand classique du bistrot parisien : un onglet saisi à feu vif, reposé comme il se doit, servi avec des frites taillées à la main et cuites en deux bains. Une sauce à l'échalote pour la gourmandise.",
    image: 'onglet-frites.jpg',
    category: 'PLAT',
    difficulty: 'MOYEN',
    prepTime: 30,
    cookTime: 25,
    servings: 2,
    status: 'VALIDATED',
    isBistronomic: true,
    reviewNote: 'Cuisson de la viande parfaitement expliquée. Le double bain des frites fait toute la différence.',
    author: 'hugo',
    createdDaysAgo: 48,
    ingredients: [
      ['Onglet de bœuf', '2 pièces de 200 g'],
      ['Pommes de terre Bintje', '800 g'],
      ['Échalotes', '3'],
      ['Beurre demi-sel', '40 g'],
      ['Vin rouge', '10 cl'],
      ['Persil plat', '1/2 botte'],
      ['Huile de friture', '1 L'],
      ['Fleur de sel, poivre', ''],
    ],
    steps: [
      'Sortir la viande du réfrigérateur 30 minutes avant la cuisson.',
      'Tailler les pommes de terre en frites épaisses, les rincer puis bien les sécher.',
      'Premier bain : cuire les frites 6 minutes à 150 °C, égoutter et laisser reposer.',
      "Ciseler les échalotes, les faire suer dans 10 g de beurre, déglacer au vin rouge et réduire de moitié.",
      "Saisir l'onglet 2 à 3 minutes par face dans une poêle très chaude avec le reste du beurre.",
      'Laisser reposer la viande 5 minutes sous une feuille de papier aluminium.',
      'Second bain : plonger les frites 2 minutes à 180 °C, saler et parsemer de persil haché.',
      'Trancher la viande, napper de sauce aux échalotes et servir aussitôt.',
    ],
  },
  {
    key: 'risotto',
    title: 'Risotto crémeux aux cèpes et copeaux de parmesan',
    description:
      'Un risotto nacré puis mouillé patiemment au bouillon, relevé de cèpes poêlés et monté au beurre en fin de cuisson. Le plat réconfort de l\'automne, dans sa version la plus élégante.',
    image: 'risotto-cepes.jpg',
    category: 'PLAT',
    difficulty: 'MOYEN',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    status: 'VALIDATED',
    isBistronomic: true,
    reviewNote: 'Texture crémeuse obtenue sans crème : exactement ce qu\'on attend. Validée par toute la brigade.',
    author: 'lea',
    createdDaysAgo: 40,
    ingredients: [
      ['Riz arborio', '320 g'],
      ['Cèpes frais', '300 g'],
      ['Bouillon de volaille', '1,2 L'],
      ['Échalote', '1'],
      ['Vin blanc sec', '10 cl'],
      ['Parmesan', '80 g'],
      ['Beurre froid', '50 g'],
      ['Basilic', 'quelques feuilles'],
    ],
    steps: [
      'Porter le bouillon à frémissement et le garder chaud.',
      'Nettoyer les cèpes, les couper en lamelles et les poêler 5 minutes. Réserver.',
      "Faire suer l'échalote ciselée, ajouter le riz et le nacrer 2 minutes jusqu'à ce qu'il soit translucide.",
      'Déglacer au vin blanc et laisser absorber.',
      'Ajouter le bouillon louche par louche en remuant, pendant 18 minutes environ.',
      'Hors du feu, incorporer le beurre froid et le parmesan râpé : c\'est la mantecatura.',
      'Ajouter les cèpes, dresser et terminer par des copeaux de parmesan et du basilic ciselé.',
    ],
  },
  {
    key: 'saumon',
    title: 'Pavé de saumon laqué, tagliatelles de légumes',
    description:
      'Un saumon à la peau croustillante laqué au miel et au citron vert, posé sur des tagliatelles de courgette et de carotte à peine saisies. Frais, rapide et très graphique dans l\'assiette.',
    image: 'saumon-laque.jpg',
    category: 'PLAT',
    difficulty: 'FACILE',
    prepTime: 15,
    cookTime: 12,
    servings: 2,
    status: 'VALIDATED',
    isBistronomic: true,
    reviewNote: 'Recette accessible au résultat digne d\'un restaurant. Bravo pour la cuisson unilatérale.',
    author: 'sarah',
    createdDaysAgo: 30,
    ingredients: [
      ['Pavés de saumon avec peau', '2'],
      ['Courgette', '1'],
      ['Carottes', '2'],
      ['Pousses d\'épinard', '1 poignée'],
      ['Miel', '1 c. à soupe'],
      ['Sauce soja', '2 c. à soupe'],
      ['Citron vert', '1'],
      ['Huile d\'olive', '2 c. à soupe'],
    ],
    steps: [
      'Tailler courgette et carottes en tagliatelles à l\'aide d\'un économe.',
      'Mélanger miel, sauce soja et le jus d\'un demi citron vert.',
      'Cuire le saumon côté peau 8 minutes à feu moyen sans le retourner.',
      'Badigeonner de laque et poursuivre 2 minutes à couvert.',
      'Saisir les légumes 2 minutes à l\'huile d\'olive avec les pousses d\'épinard.',
      'Dresser le saumon sur les légumes, avec un quartier de citron vert.',
    ],
  },
  {
    key: 'agneau',
    title: 'Côtelettes d\'agneau caramélisées, roquette et framboises',
    description:
      'Des côtelettes laquées au vinaigre balsamique et au miel, des oignons confits et une salade de roquette relevée par l\'acidité des framboises. L\'accord sucré-acidulé qui surprend.',
    image: 'agneau-framboises.jpg',
    category: 'PLAT',
    difficulty: 'MOYEN',
    prepTime: 20,
    cookTime: 20,
    servings: 2,
    status: 'VALIDATED',
    isBistronomic: true,
    reviewNote: 'Accord audacieux et maîtrisé, typiquement bistronomique.',
    author: 'thomas',
    createdDaysAgo: 22,
    ingredients: [
      ['Côtelettes d\'agneau', '6'],
      ['Oignons jaunes', '2'],
      ['Vinaigre balsamique', '4 c. à soupe'],
      ['Miel', '1 c. à soupe'],
      ['Roquette', '100 g'],
      ['Framboises', '125 g'],
      ['Poire', '1/2'],
      ['Thym', '2 branches'],
    ],
    steps: [
      'Émincer les oignons et les confire 15 minutes à feu doux avec une pincée de sucre.',
      'Saisir les côtelettes 2 minutes par face avec le thym.',
      'Déglacer au vinaigre balsamique, ajouter le miel et laquer la viande en l\'arrosant.',
      'Tailler la poire en bâtonnets et mélanger à la roquette.',
      'Dresser la salade, les côtelettes, les oignons confits et parsemer de framboises.',
    ],
  },
  {
    key: 'panna',
    title: 'Panna cotta vanille, fraises au romarin',
    description:
      'Une panna cotta tremblotante à la vanille de Madagascar, surmontée de fraises macérées au sirop de romarin. Un dessert simple que la touche herbacée rend inoubliable.',
    image: 'panna-cotta-fraises.jpg',
    category: 'DESSERT',
    difficulty: 'FACILE',
    prepTime: 20,
    cookTime: 5,
    servings: 6,
    status: 'VALIDATED',
    isBistronomic: true,
    reviewNote: 'Dosage de gélatine juste parfait. Le romarin apporte la signature.',
    author: 'ines',
    createdDaysAgo: 35,
    ingredients: [
      ['Crème liquide entière', '50 cl'],
      ['Lait entier', '10 cl'],
      ['Sucre', '60 g'],
      ['Gousse de vanille', '1'],
      ['Feuilles de gélatine', '3'],
      ['Fraises', '300 g'],
      ['Romarin frais', '1 branche'],
    ],
    steps: [
      'Faire tremper la gélatine dans l\'eau froide.',
      'Chauffer crème, lait, 40 g de sucre et la vanille grattée sans faire bouillir.',
      'Hors du feu, incorporer la gélatine essorée puis répartir dans des verrines.',
      'Réserver au moins 4 heures au réfrigérateur.',
      'Porter 20 g de sucre et 5 cl d\'eau à ébullition avec le romarin, laisser infuser 10 minutes.',
      'Couper les fraises, les arroser du sirop filtré et en garnir les panna cotta au moment de servir.',
    ],
  },
  {
    key: 'tartine',
    title: 'Tartine œuf mollet, avocat et pousses d\'épinard',
    description:
      'Pain de campagne grillé, avocat assaisonné au citron, œuf mollet à la coque fondante et pousses d\'épinard. L\'entrée de brunch qui se donne des airs de grande table.',
    image: 'tartine-oeuf-avocat.jpg',
    category: 'ENTREE',
    difficulty: 'FACILE',
    prepTime: 10,
    cookTime: 6,
    servings: 2,
    status: 'VALIDATED',
    reviewNote: 'Simple et efficace, la cuisson de l\'œuf est bien précisée.',
    author: 'sarah',
    createdDaysAgo: 26,
    ingredients: [
      ['Pain de campagne', '2 grandes tranches'],
      ['Œufs extra-frais', '2'],
      ['Avocat mûr', '1'],
      ['Pousses d\'épinard', '1 poignée'],
      ['Citron', '1/2'],
      ['Piment d\'Espelette', '1 pincée'],
    ],
    steps: [
      'Plonger les œufs 6 minutes dans l\'eau bouillante puis les refroidir dans l\'eau glacée.',
      'Griller les tranches de pain.',
      'Trancher l\'avocat, l\'arroser de citron et l\'assaisonner.',
      'Garnir le pain de pousses d\'épinard, d\'avocat et des œufs écalés coupés en deux.',
      'Terminer avec fleur de sel et piment d\'Espelette.',
    ],
  },
  {
    key: 'porc',
    title: 'Côte de porc rôtie, pommes caramélisées au thym',
    description:
      'Une épaisse côte de porc fermier rôtie au beurre moussant, des dés de pomme caramélisés au thym et des brocolis croquants. Le mariage normand revisité.',
    image: 'cote-porc-pommes.jpg',
    category: 'PLAT',
    difficulty: 'MOYEN',
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    status: 'VALIDATED',
    reviewNote: 'Très bonne recette familiale. Il manque un petit twist pour la sélection bistronomique.',
    author: 'hugo',
    createdDaysAgo: 18,
    ingredients: [
      ['Côtes de porc épaisses', '2'],
      ['Pommes Boskoop', '2'],
      ['Beurre', '40 g'],
      ['Thym frais', '4 branches'],
      ['Bouquets de brocoli', '200 g'],
      ['Cidre brut', '10 cl'],
    ],
    steps: [
      'Saisir les côtes 3 minutes par face dans le beurre moussant.',
      'Enfourner 12 minutes à 180 °C en arrosant à mi-cuisson.',
      'Pendant ce temps, caraméliser les dés de pomme avec le thym.',
      'Déglacer la poêle de cuisson au cidre pour obtenir un jus.',
      'Cuire les brocolis 4 minutes à l\'eau salée.',
      'Dresser la côte, les pommes et napper de jus au cidre.',
    ],
  },
  {
    key: 'fondant',
    title: 'Fondant au chocolat noir, filet de ganache',
    description:
      'Un fondant dense et intense à 70 % de cacao, arrosé d\'une ganache tiède. À servir en carrés généreux avec une pointe de fleur de sel.',
    image: 'fondant-chocolat.jpg',
    category: 'DESSERT',
    difficulty: 'FACILE',
    prepTime: 15,
    cookTime: 25,
    servings: 8,
    status: 'VALIDATED',
    reviewNote: 'Validée : texture fondante garantie en respectant le temps de cuisson.',
    author: 'ines',
    createdDaysAgo: 12,
    ingredients: [
      ['Chocolat noir 70 %', '250 g'],
      ['Beurre', '180 g'],
      ['Sucre', '150 g'],
      ['Œufs', '4'],
      ['Farine', '50 g'],
      ['Crème liquide', '10 cl'],
      ['Fleur de sel', '1 pincée'],
    ],
    steps: [
      'Faire fondre 200 g de chocolat avec le beurre au bain-marie.',
      'Fouetter les œufs et le sucre, ajouter le chocolat fondu puis la farine.',
      'Verser dans un moule chemisé et cuire 22 minutes à 180 °C : le cœur doit rester tremblotant.',
      'Chauffer la crème et la verser sur le reste du chocolat pour obtenir la ganache.',
      'Laisser tiédir le fondant, découper et napper de ganache.',
    ],
  },
  {
    key: 'saumon-cf',
    title: 'Saumon grillé, taboulé de chou-fleur et pesto',
    description:
      'Un taboulé cru de chou-fleur aux herbes, des haricots verts croquants, des tomates anciennes et un saumon grillé relevé d\'un pesto aux pignons.',
    image: 'saumon-chou-fleur.jpg',
    category: 'ENTREE',
    difficulty: 'FACILE',
    prepTime: 25,
    cookTime: 10,
    servings: 2,
    status: 'VALIDATED',
    reviewNote: 'Fraîche et colorée, parfaite en entrée pour quatre ou en plat pour deux.',
    author: 'lea',
    createdDaysAgo: 8,
    ingredients: [
      ['Chou-fleur', '1/2'],
      ['Pavé de saumon', '1'],
      ['Haricots verts', '150 g'],
      ['Tomates cerises anciennes', '200 g'],
      ['Pesto au basilic', '3 c. à soupe'],
      ['Pignons de pin', '20 g'],
      ['Menthe, persil', '1/2 botte de chaque'],
    ],
    steps: [
      'Mixer le chou-fleur cru en semoule et l\'assaisonner avec citron, huile d\'olive et herbes ciselées.',
      'Cuire les haricots verts 5 minutes et les refroidir.',
      'Griller le saumon 3 minutes par face.',
      'Torréfier les pignons à sec.',
      'Dresser le taboulé, les légumes, le saumon et terminer par le pesto et les pignons.',
    ],
  },
  {
    key: 'mignardises',
    title: 'Tartelettes citron meringuées et choux framboise',
    description:
      'Un assortiment de mignardises pour finir le repas en beauté : tartelettes au citron meringuées au chalumeau et petits choux craquelin à la framboise.',
    image: 'mignardises.jpg',
    category: 'DESSERT',
    difficulty: 'DIFFICILE',
    prepTime: 90,
    cookTime: 40,
    servings: 12,
    status: 'PENDING',
    author: 'ines',
    createdDaysAgo: 3,
    ingredients: [
      ['Pâte sucrée', '300 g'],
      ['Citrons jaunes', '3'],
      ['Œufs', '5'],
      ['Sucre', '250 g'],
      ['Pâte à choux', '250 g'],
      ['Framboises', '200 g'],
      ['Crème pâtissière', '300 g'],
    ],
    steps: [
      'Foncer les moules à tartelettes et cuire à blanc 15 minutes.',
      'Préparer le crémeux citron et garnir les fonds.',
      'Pocher les choux, les recouvrir de craquelin et cuire 25 minutes.',
      'Garnir les choux de crème pâtissière à la framboise.',
      'Réaliser une meringue italienne, pocher sur les tartelettes et caraméliser au chalumeau.',
    ],
  },
  {
    key: 'farfalle',
    title: 'Farfalle au pesto de basilic et tomates cerises',
    description:
      'Des pâtes papillon enrobées d\'un pesto maison au basilic et parmesan, avec des tomates cerises et de jeunes pousses. Le plat du soir prêt en 20 minutes.',
    image: 'farfalle-pesto.jpg',
    category: 'PLAT',
    difficulty: 'FACILE',
    prepTime: 10,
    cookTime: 10,
    servings: 4,
    status: 'PENDING',
    author: 'thomas',
    createdDaysAgo: 2,
    ingredients: [
      ['Farfalle', '400 g'],
      ['Basilic frais', '2 bottes'],
      ['Parmesan', '60 g'],
      ['Pignons de pin', '40 g'],
      ['Ail', '1 gousse'],
      ['Huile d\'olive', '10 cl'],
      ['Tomates cerises', '250 g'],
    ],
    steps: [
      'Mixer basilic, parmesan, pignons, ail et huile d\'olive pour obtenir le pesto.',
      'Cuire les pâtes al dente dans une grande eau salée.',
      'Égoutter en gardant une louche d\'eau de cuisson.',
      'Mélanger pâtes, pesto et un peu d\'eau de cuisson pour lier.',
      'Ajouter les tomates cerises coupées et les jeunes pousses.',
    ],
  },
  {
    key: 'cookies',
    title: 'Cookies chocolat noir et fleur de sel',
    description: 'Des cookies au cœur moelleux, gros éclats de chocolat noir et fleur de sel de Guérande.',
    image: 'cookies-fleur-de-sel.jpg',
    category: 'DESSERT',
    difficulty: 'FACILE',
    prepTime: 15,
    cookTime: 11,
    servings: 12,
    status: 'PENDING',
    author: 'sarah',
    createdDaysAgo: 1,
    ingredients: [
      ['Beurre demi-sel', '120 g'],
      ['Sucre roux', '150 g'],
      ['Œuf', '1'],
      ['Farine', '200 g'],
      ['Chocolat noir', '150 g'],
      ['Fleur de sel', '1 pincée'],
    ],
    steps: [
      'Crémer le beurre mou et le sucre roux.',
      'Ajouter l\'œuf, puis la farine et le chocolat concassé.',
      'Former des boules et les réfrigérer 30 minutes.',
      'Cuire 11 minutes à 180 °C et parsemer de fleur de sel à la sortie du four.',
    ],
  },
  {
    key: 'verrine',
    title: 'Verrine mousse chocolat et biscuits',
    description: 'Une verrine gourmande : mousse au chocolat, crème fouettée et biscuits concassés.',
    image: 'verrine-chocolat.jpg',
    category: 'DESSERT',
    difficulty: 'FACILE',
    prepTime: 20,
    cookTime: 0,
    servings: 4,
    status: 'REJECTED',
    reviewNote:
      'Gourmand, mais les biscuits industriels et la crème en bombe éloignent la recette de l\'esprit bistronomique. Essaie un sablé maison et une chantilly vanillée, puis resoumets-la !',
    author: 'thomas',
    createdDaysAgo: 15,
    ingredients: [
      ['Chocolat au lait', '150 g'],
      ['Œufs', '3'],
      ['Biscuits au cacao fourrés', '8'],
      ['Crème fouettée', '1 bombe'],
    ],
    steps: [
      'Faire fondre le chocolat et incorporer les jaunes.',
      'Monter les blancs en neige et les incorporer délicatement.',
      'Alterner mousse, biscuits concassés et crème fouettée dans les verrines.',
    ],
  },
  {
    key: 'bowl',
    title: 'Bowl croustillant de tofu mariné',
    description: 'Tofu mariné et rôti, edamame, maïs, chou rouge et œufs de caille, sauce sésame.',
    image: 'bowl-tofu.jpg',
    category: 'ENTREE',
    difficulty: 'FACILE',
    prepTime: 20,
    cookTime: 15,
    servings: 2,
    status: 'PENDING',
    author: 'lea',
    createdDaysAgo: 0,
    ingredients: [
      ['Tofu ferme', '200 g'],
      ['Edamame', '100 g'],
      ['Maïs', '100 g'],
      ['Chou rouge', '1/4'],
      ['Œufs de caille', '4'],
      ['Sauce soja, sésame', ''],
    ],
    steps: [
      'Mariner le tofu en cubes 15 minutes dans la sauce soja.',
      'Le rôtir 15 minutes à 200 °C.',
      'Cuire les œufs de caille 2 minutes 30.',
      'Assembler le bowl et arroser de sauce sésame.',
    ],
  },
]

const COMMENTS: { recipe: string; author: string; kind: CommentKind; content: string; thisMonth?: boolean }[] = [
  { recipe: 'onglet', author: 'lea', kind: 'AVIS', content: 'Testé samedi soir : mes invités ont cru que j\'avais commandé au bistrot du coin !', thisMonth: true },
  { recipe: 'onglet', author: 'sarah', kind: 'CONSEIL', content: 'Pour des frites encore plus croustillantes, laissez-les refroidir complètement entre les deux bains.' },
  { recipe: 'onglet', author: 'ines', kind: 'AVIS', content: 'La sauce à l\'échalote est une tuerie. J\'en ai fait le double.', thisMonth: true },
  { recipe: 'risotto', author: 'hugo', kind: 'CONSEIL', content: 'Avec des cèpes séchés réhydratés, gardez l\'eau de trempage filtrée pour le bouillon : incroyable.', thisMonth: true },
  { recipe: 'risotto', author: 'thomas', kind: 'AVIS', content: 'Enfin un risotto réussi du premier coup grâce aux explications.', thisMonth: true },
  { recipe: 'risotto', author: 'sarah', kind: 'AVIS', content: 'Crémeux à souhait, toute la famille a adoré.', thisMonth: true },
  { recipe: 'saumon', author: 'hugo', kind: 'AVIS', content: 'Rapide, beau et bon. Parfait en semaine.', thisMonth: true },
  { recipe: 'saumon', author: 'ines', kind: 'CONSEIL', content: 'Une pincée de gingembre frais râpé dans la laque, c\'est top.' },
  { recipe: 'agneau', author: 'lea', kind: 'AVIS', content: 'J\'étais sceptique pour les framboises… je retire tout, c\'est génial.', thisMonth: true },
  { recipe: 'panna', author: 'thomas', kind: 'AVIS', content: 'Le sirop au romarin, quelle idée ! Dessert de fête validé.', thisMonth: true },
  { recipe: 'panna', author: 'sarah', kind: 'CONSEIL', content: 'Préparez-les la veille, la texture est encore meilleure.' },
  { recipe: 'fondant', author: 'hugo', kind: 'CONSEIL', content: '20 minutes suffisent dans mon four à chaleur tournante.', thisMonth: true },
  { recipe: 'tartine', author: 'lea', kind: 'AVIS', content: 'Mon nouveau brunch du dimanche.' },
  { recipe: 'porc', author: 'ines', kind: 'AVIS', content: 'Le jus au cidre est parfait avec la pomme.', thisMonth: true },
]

/** [recette, membre, note, ce mois-ci ?] */
const RATINGS: [string, string, number, boolean][] = [
  ['onglet', 'lea', 5, true], ['onglet', 'sarah', 5, false], ['onglet', 'ines', 4, true], ['onglet', 'thomas', 5, false], ['onglet', 'brigade', 5, false],
  ['risotto', 'hugo', 5, true], ['risotto', 'thomas', 5, true], ['risotto', 'sarah', 4, true], ['risotto', 'ines', 5, true], ['risotto', 'chef', 5, true],
  ['saumon', 'hugo', 4, true], ['saumon', 'ines', 5, false], ['saumon', 'lea', 4, true],
  ['agneau', 'lea', 5, true], ['agneau', 'hugo', 4, true], ['agneau', 'sarah', 4, false],
  ['panna', 'thomas', 5, true], ['panna', 'sarah', 5, false], ['panna', 'lea', 4, false], ['panna', 'hugo', 5, true],
  ['tartine', 'lea', 4, false], ['tartine', 'thomas', 3, true],
  ['porc', 'ines', 4, true], ['porc', 'lea', 4, false], ['porc', 'sarah', 3, true],
  ['fondant', 'hugo', 5, true], ['fondant', 'thomas', 4, true],
  ['saumon-cf', 'hugo', 4, true], ['saumon-cf', 'ines', 4, true],
]

/** [recette, membre, ce mois-ci ?] */
const FAVORITES: [string, string, boolean][] = [
  ['risotto', 'hugo', true], ['risotto', 'thomas', true], ['risotto', 'sarah', true], ['risotto', 'ines', true],
  ['onglet', 'lea', true], ['onglet', 'sarah', false], ['onglet', 'ines', true],
  ['panna', 'thomas', true], ['panna', 'lea', true],
  ['agneau', 'lea', true], ['saumon', 'hugo', true], ['fondant', 'thomas', true], ['saumon-cf', 'ines', false],
]

async function main() {
  console.log('Nettoyage de la base…')
  await prisma.$transaction([
    prisma.chefPick.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.rating.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.step.deleteMany(),
    prisma.ingredient.deleteMany(),
    prisma.recipe.deleteMany(),
    prisma.user.deleteMany(),
  ])

  console.log('Création des membres…')
  const password = await bcrypt.hash(PASSWORD, 10)
  const users: Record<string, string> = {}
  for (const [index, user] of USERS.entries()) {
    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        password,
        createdAt: daysAgo(90 - index * 5),
      },
    })
    users[user.key] = created.id
  }

  console.log('Création des recettes…')
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  const recipes: Record<string, string> = {}
  for (const recipe of RECIPES) {
    fs.copyFileSync(path.join(IMAGES_DIR, recipe.image), path.join(UPLOADS_DIR, `seed-${recipe.image}`))
    const createdAt = daysAgo(recipe.createdDaysAgo)
    const reviewed = recipe.status !== 'PENDING'

    const created = await prisma.recipe.create({
      data: {
        title: recipe.title,
        description: recipe.description,
        imageUrl: `/uploads/seed-${recipe.image}`,
        category: recipe.category,
        difficulty: recipe.difficulty,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: recipe.prepTime + recipe.cookTime,
        servings: recipe.servings,
        status: recipe.status,
        isBistronomic: recipe.isBistronomic ?? false,
        reviewNote: recipe.reviewNote,
        reviewedAt: reviewed ? new Date(createdAt.getTime() + 2 * DAY) : null,
        reviewerId: reviewed ? users.brigade : null,
        authorId: users[recipe.author],
        createdAt,
        ingredients: {
          create: recipe.ingredients.map(([name, quantity], position) => ({ name, quantity, position })),
        },
        steps: {
          create: recipe.steps.map((description, index) => ({ order: index + 1, description })),
        },
      },
    })
    recipes[recipe.key] = created.id
  }

  console.log('Interactions de la communauté…')
  for (const [index, comment] of COMMENTS.entries()) {
    await prisma.comment.create({
      data: {
        content: comment.content,
        kind: comment.kind,
        recipeId: recipes[comment.recipe],
        authorId: users[comment.author],
        createdAt: comment.thisMonth ? inCurrentMonth(index % 12) : daysAgo(25 + index),
      },
    })
  }

  for (const [index, [recipe, author, value, thisMonth]] of RATINGS.entries()) {
    const date = thisMonth ? inCurrentMonth(index % 12) : daysAgo(28 + (index % 5))
    await prisma.rating.create({
      data: { recipeId: recipes[recipe], authorId: users[author], value, createdAt: date, updatedAt: date },
    })
  }

  for (const [index, [recipe, user, thisMonth]] of FAVORITES.entries()) {
    await prisma.favorite.create({
      data: {
        recipeId: recipes[recipe],
        userId: users[user],
        createdAt: thisMonth ? inCurrentMonth(index % 12) : daysAgo(30 + index),
      },
    })
  }

  // Moyennes dénormalisées sur chaque recette
  for (const id of Object.values(recipes)) {
    const aggregate = await prisma.rating.aggregate({ where: { recipeId: id }, _avg: { value: true }, _count: { _all: true } })
    await prisma.recipe.update({
      where: { id },
      data: {
        averageRating: Math.round((aggregate._avg.value ?? 0) * 100) / 100,
        ratingsCount: aggregate._count._all,
      },
    })
  }

  console.log('Recette du mois précédent…')
  await prisma.chefPick.create({
    data: {
      month: previousMonthKey(),
      recipeId: recipes.onglet,
      chefId: users.chef,
      score: 27,
      verdict:
        "Une cuisson au cordeau et des frites comme je les aime : croustillantes dehors, fondantes dedans. La sauce à l'échalote est digne d'une carte de bistrot. Bravo Hugo, c'est exactement l'esprit de la Brigade !",
    },
  })

  console.log(`Terminé : ${USERS.length} membres, ${RECIPES.length} recettes.`)
  console.log(`Comptes de démo : chef@labrigade.fr / ${PASSWORD} (brigade) — lea@example.com / ${PASSWORD} (membre)`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
