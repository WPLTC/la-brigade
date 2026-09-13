import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ConceptPage } from './pages/ConceptPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ModerationPage } from './pages/ModerationPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProposeRecipePage } from './pages/ProposeRecipePage'
import { PublicProfilePage } from './pages/PublicProfilePage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipesListPage } from './pages/RecipesListPage'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/concept" element={<ConceptPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recipes" element={<RecipesListPage />} />
        <Route
          path="/recipes/new"
          element={
            <ProtectedRoute>
              <ProposeRecipePage />
            </ProtectedRoute>
          }
        />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route
          path="/recipes/:id/edit"
          element={
            <ProtectedRoute>
              <ProposeRecipePage />
            </ProtectedRoute>
          }
        />
        <Route path="/users/:id" element={<PublicProfilePage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moderation"
          element={
            <ProtectedRoute role="CHEF_TEAM">
              <ModerationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
