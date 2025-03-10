import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // We'll define this next
import NotificationsPanel from './NotificationsPanel'; // Import NotificationsPanel

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">UAV Detection</div>
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/live">Live Feed</Link>
        </li>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/reports">Reports</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
