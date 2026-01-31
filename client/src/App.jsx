import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MatchesPage from './pages/MatchesPage'
import MatchDetailPage from './pages/MatchDetailPage'
import TeamBuilderPage from './pages/TeamBuilderPage'
import PredictionsPage from './pages/PredictionsPage'
import MyTeamPage from './pages/MyTeamPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'

// Components
import BottomNav from './components/common/BottomNav'
import Header from './components/common/Header'
import Loading from './components/common/Loading'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <MatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match/:matchId"
            element={
              <ProtectedRoute>
                <MatchDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match/:matchId/team-builder"
            element={
              <ProtectedRoute>
                <TeamBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match/:matchId/predictions"
            element={
              <ProtectedRoute>
                <PredictionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match/:matchId/my-team"
            element={
              <ProtectedRoute>
                <MyTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard/:matchId"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
