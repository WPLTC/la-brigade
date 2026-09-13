import { Router } from 'express'
import { getHome, listChefPicks } from '../controllers/home.controller.js'

export const homeRouter = Router()

homeRouter.get('/home', getHome)
homeRouter.get('/chef-picks', listChefPicks)
