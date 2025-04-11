import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import LiveFeed from './pages/LiveFeed';
import Dashboard from './pages/Dashboard';
import ReportsPage from './pages/Reports';
import About from './pages/About';
import Missions from './pages/Missions';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import { useAuth } from './hooks/useAuth';
import './App.css';
import 'leaflet/dist/leaflet.css';

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ParticleBackground />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          {isAuthenticated ? (
            <>
              <Route path="/live" element={<LiveFeed />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/missions" element={<Missions />} />
              {user?.role === 'admin' && (
                <Route path="/admin" element={<AdminPanel />} />
              )}
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer style={{
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        textAlign: 'center',
        padding: '10px'
      }}>
        <p>© 2025 International Information Technology University</p>
      </footer>
    </div>
  );
}

export default App;
