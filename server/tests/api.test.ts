import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Tests d'intégration du parcours complet :
 * inscription -> proposition -> validation par la brigade -> interactions -> recette du mois.
 * Nécessite DATABASE_URL_TEST (voir server/.env.example).
 */
const hasTestDatabase = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasTestDatabase)('API La Brigade', async () => {
  const { createApp } = await import('../src/app.js')
  const { prisma } = await import('../src/lib/prisma.js')
  const { monthKey } = await import('../src/services/popularity.js')
  const app = createApp()

  let authorToken = ''
  let fanToken = ''
  let chefToken = ''
  let fanId = ''
  let recipeId = ''

  const recipe = {
    title: 'Onglet de bœuf, échalotes confites',
    description: 'Un classique de bistrot revisité, cuisson minute et jus corsé.',
    category: 'PLAT',
    difficulty: 'MOYEN',
    prepTime: 20,
    cookTime: 15,
    servings: 2,
    ingredients: [
      { name: 'Onglet de bœuf', quantity: '400 g' },
      { name: 'Échalotes', quantity: '4' },
    ],
    steps: [{ description: 'Confire les échalotes.' }, { description: 'Saisir la viande.' }],
  }

  async function registerUser(name: string, email: string) {
    const res = await request(app).post('/api/auth/register').send({ name, email, password: 'motdepasse123' })
    expect(res.status).toBe(201)
    return res.body as { token: string; user: { id: string } }
  }

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "ChefPick", "Favorite", "Rating", "Comment", "Step", "Ingredient", "Recipe", "User" CASCADE',
    )

    authorToken = (await registerUser('Auteur', 'auteur@test.fr')).token
    const fan = await registerUser('Fan', 'fan@test.fr')
    fanToken = fan.token
    fanId = fan.user.id
    const chef = await registerUser('Chef', 'chef@test.fr')
    await prisma.user.update({ where: { id: chef.user.id }, data: { role: 'CHEF_TEAM' } })
    chefToken = chef.token
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('refuse une inscription avec un email déjà utilisé', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Doublon', email: 'AUTEUR@test.fr', password: 'motdepasse123' })
    expect(res.status).toBe(409)
  })

  it('renvoie des erreurs de validation lisibles', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ ...recipe, steps: [] })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Ajoute au moins une étape')
  })

  it('crée une recette en attente, invisible du public', async () => {
    const res = await request(app).post('/api/recipes').set('Authorization', `Bearer ${authorToken}`).send(recipe)
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('PENDING')
    recipeId = res.body.id

    const list = await request(app).get('/api/recipes')
    expect(list.body.total).toBe(0)

    expect((await request(app).get(`/api/recipes/${recipeId}`)).status).toBe(404)
    const asAuthor = await request(app).get(`/api/recipes/${recipeId}`).set('Authorization', `Bearer ${authorToken}`)
    expect(asAuthor.status).toBe(200)
    expect(asAuthor.body.permissions.canEdit).toBe(true)
  })

  it('réserve la modération à la brigade', async () => {
    const res = await request(app)
      .patch(`/api/moderation/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${fanToken}`)
      .send({ status: 'VALIDATED' })
    expect(res.status).toBe(403)
  })

  it('exige un retour pour refuser, puis permet de corriger et resoumettre', async () => {
    const withoutNote = await request(app)
      .patch(`/api/moderation/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ status: 'REJECTED' })
    expect(withoutNote.status).toBe(400)

    const rejected = await request(app)
      .patch(`/api/moderation/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ status: 'REJECTED', reviewNote: 'Précise la cuisson de la viande.' })
    expect(rejected.body.status).toBe('REJECTED')

    const updated = await request(app)
      .put(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ ...recipe, steps: [...recipe.steps, { description: 'Cuire 3 minutes par face.' }] })
    expect(updated.status).toBe(200)
    expect(updated.body.status).toBe('PENDING')
  })

  it('valide la recette et la place dans la sélection bistronomique', async () => {
    const res = await request(app)
      .patch(`/api/moderation/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ status: 'VALIDATED', isBistronomic: true, reviewNote: 'Testée et approuvée !' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'VALIDATED', isBistronomic: true })

    const list = await request(app).get('/api/recipes?bistronomic=true&category=PLAT&maxTime=60')
    expect(list.body.total).toBe(1)

    const locked = await request(app)
      .put(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send(recipe)
    expect(locked.status).toBe(409)
  })

  it('gère notes, commentaires et favoris', async () => {
    const ownRating = await request(app)
      .post(`/api/recipes/${recipeId}/ratings`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ value: 5 })
    expect(ownRating.status).toBe(403)

    await request(app).post(`/api/recipes/${recipeId}/ratings`).set('Authorization', `Bearer ${fanToken}`).send({ value: 3 })
    const rating = await request(app)
      .post(`/api/recipes/${recipeId}/ratings`)
      .set('Authorization', `Bearer ${fanToken}`)
      .send({ value: 5 })
    expect(rating.body).toMatchObject({ averageRating: 5, ratingsCount: 1 })

    const comment = await request(app)
      .post(`/api/recipes/${recipeId}/comments`)
      .set('Authorization', `Bearer ${fanToken}`)
      .send({ content: 'Laisser reposer la viande 5 minutes.', kind: 'CONSEIL' })
    expect(comment.status).toBe(201)
    expect(comment.body.kind).toBe('CONSEIL')

    const favorite = await request(app).put(`/api/recipes/${recipeId}/favorite`).set('Authorization', `Bearer ${fanToken}`)
    expect(favorite.body).toEqual({ isFavorite: true, favoritesCount: 1 })

    const forbiddenDelete = await request(app)
      .delete(`/api/comments/${comment.body.id}`)
      .set('Authorization', `Bearer ${authorToken}`)
    expect(forbiddenDelete.status).toBe(403)

    const detail = await request(app).get(`/api/recipes/${recipeId}`).set('Authorization', `Bearer ${fanToken}`)
    expect(detail.body).toMatchObject({ myRating: 5, isFavorite: true })
    expect(detail.body.ratingDistribution['5']).toBe(1)
  })

  it('classe la recette dans la course du mois et permet au chef de la désigner', async () => {
    const month = monthKey()
    const monthly = await request(app).get('/api/moderation/monthly').set('Authorization', `Bearer ${chefToken}`)
    expect(monthly.body.ranking[0]).toMatchObject({ favorites: 1, ratings: 1, comments: 1, score: 6 })

    const pick = await request(app)
      .put(`/api/moderation/monthly/${month}`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ recipeId, verdict: 'Une cuisson parfaite, un jus remarquable.' })
    expect(pick.status).toBe(200)

    const home = await request(app).get('/api/home')
    expect(home.body.chefPick.recipe.id).toBe(recipeId)
    expect(home.body.stats).toMatchObject({ recipes: 1, bistronomic: 1, members: 3 })
  })

  it('protège les rôles', async () => {
    const res = await request(app)
      .patch(`/api/moderation/users/${fanId}/role`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ role: 'CHEF_TEAM' })
    expect(res.body.role).toBe('CHEF_TEAM')
  })
})
