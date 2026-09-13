-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('ENTREE', 'PLAT', 'DESSERT');

-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('FACILE', 'MOYEN', 'DIFFICILE');

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "category" "RecipeCategory" NOT NULL DEFAULT 'PLAT',
ADD COLUMN     "difficulty" "RecipeDifficulty" NOT NULL DEFAULT 'FACILE',
ADD COLUMN     "prepTime" INTEGER NOT NULL DEFAULT 30;
