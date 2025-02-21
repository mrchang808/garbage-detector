import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LiveFeed from './pages/LiveFeed';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import './App.css';

function App() {
  return (
    <div className="App">
      <ParticleBackground /> {/* behind everything */}
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<LiveFeed />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <footer style={{ position: 'relative', zIndex: 1 }}>
        <p>© 2025 International Information Technology University</p>
      </footer>
    </div>
  );
}

export default App;
