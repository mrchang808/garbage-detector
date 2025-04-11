import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaSignOutAlt, FaUserCircle, FaUserPlus, FaBars, FaTimes, FaUserCog } from 'react-icons/fa';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">UAV Detection</Link>
      </div>
      
      <button className="menu-toggle" onClick={toggleMenu}>
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      <div className={`navbar-content ${isMenuOpen ? 'active' : ''}`}>
        <ul className="navbar-links">
          <li><Link to="/" onClick={closeMenu}>Home</Link></li>
          <li><Link to="/about" onClick={closeMenu}>About</Link></li>
          
          {isAuthenticated && (
            <>
              <li><Link to="/live" onClick={closeMenu}>Live Feed</Link></li>
              <li><Link to="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
              <li><Link to="/reports" onClick={closeMenu}>Reports</Link></li>
              <li><Link to="/missions" onClick={closeMenu}>Missions</Link></li>
            </>
          )}
          
          {isAdmin && (
            <li className="admin-link-container">
              <Link to="/admin" onClick={closeMenu} className="admin-link">
                <FaUserCog /> Admin Panel
              </Link>
            </li>
          )}
        </ul>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-section">
              <span className="user-email">
                <FaUserCircle /> {user?.email}
              </span>
              <button onClick={() => { logout(); closeMenu(); }} className="logout-btn">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-btn login-btn" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="auth-btn register-btn" onClick={closeMenu}>
                <FaUserPlus /> Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
