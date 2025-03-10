import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LiveFeed from './pages/LiveFeed';
import Dashboard from './pages/Dashboard';
import ReportsPage from './pages/Reports';
import About from './pages/About';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import NotificationsPanel from './components/NotificationsPanel';
import './App.css';

function App() {
  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ParticleBackground /> {/* behind everything */}
      <Navbar />
      <main style={{ flex: 1, position: 'relative', marginRight: '333px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<LiveFeed />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <NotificationsPanel />
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
