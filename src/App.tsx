
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import AnimeDetail from './pages/AnimeDetail'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'
import Forum from './pages/Forum'
import ForumPostDetail from './pages/ForumPostDetail'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/forum/post/:postId" element={<ForumPostDetail />} />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151'
            }
          }}
        />
      </div>
    </Router>
  )
}

export default App
