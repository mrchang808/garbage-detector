import React, { useState, useEffect } from 'react';
import { FaUserCog } from 'react-icons/fa';
import { GiDeliveryDrone } from "react-icons/gi";
import axios from 'axios';
import NotificationsPanel from '../components/NotificationsPanel';
import { ENDPOINTS } from '../api/endpoints';
import './AdminPanel.css';

interface User {
  id: number;
  email: string;  // Changed from name to email
  role: string;
  last_login: string | null;
  created_at: string;
}

interface Drone {
  id: string;
  name: string;
  status: string;
  lastMission: string;
}

interface DroneDetails {
  totalMissions: number;
  flightHours: number;
  lastMaintenance: string;
  batteryHealth: number;
}

const AdminPanel: React.FC = () => {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [droneDetails, setDroneDetails] = useState<DroneDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDrones();
    fetchUsers();
  }, []);

  const fetchDrones = async () => {
    try {
      const response = await axios.get<Drone[]>(`${ENDPOINTS.DRONES}`);
      setDrones(response.data);
    } catch (error) {
      console.error('Error fetching drones:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<User[]>(`${ENDPOINTS.USERS}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Users response:', response.data);  // Debug print
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDroneDetails = async (drone: Drone) => {
    try {
      const response = await axios.get<DroneDetails>(`${ENDPOINTS.DRONES}/${drone.id}/details`);
      setDroneDetails(response.data);
      setSelectedDrone(drone);
    } catch (error) {
      console.error('Error fetching drone details:', error);
    }
  };

  const handleEditDrone = async (drone: Drone) => {
    setSelectedDrone(drone);
    setIsEditModalOpen(true);
  };

  const handleDeleteDrone = async (droneId: string) => {
    if (window.confirm('Are you sure you want to delete this drone?')) {
      try {
        await axios.delete(`${ENDPOINTS.DRONES}/${droneId}`);
        setDrones(drones.filter(d => d.id !== droneId));
      } catch (error) {
        console.error('Error deleting drone:', error);
      }
    }
  };

  const handleUpdateDrone = async (updatedDrone: Partial<Drone>) => {
    try {
      await axios.put(`${ENDPOINTS.DRONES}/${selectedDrone?.id}`, updatedDrone);
      fetchDrones();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating drone:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserEditModalOpen(true);
  };

  const handleUpdateUser = async (updatedUser: Partial<User>) => {
    try {
      await axios.put(`${ENDPOINTS.USERS}/${selectedUser?.id}`, updatedUser);
      fetchUsers();
      setIsUserEditModalOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${ENDPOINTS.USERS}/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleError = (error: any) => {
    setError(error?.response?.data?.msg || 'An error occurred');
    setTimeout(() => setError(''), 5000);
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">
        <FaUserCog /> Administration Panel
      </h2>

      {/* Add NotificationsPanel here */}
      <NotificationsPanel />

      {error && <div className="error-message">{error}</div>}

      {isLoading && <div className="loading-spinner">Loading...</div>}

      {/* User Management Section */}
      <div className="admin-section">
        <h3>
          <FaUserCog /> User Management
        </h3>
        <div className="admin-table">
          <div className="admin-table-header">
            <div>Name</div>
            <div>Role</div>
            <div>Last Login</div>
            <div>Actions</div>
          </div>
          {users.map((user) => (
            <div className="admin-table-row" key={user.id}>
              <div>{user.email}</div>
              <div>{user.role}</div>
              <div>{user.last_login}</div>
              <div>
                <button 
                  className="edit-btn"
                  onClick={() => handleEditUser(user)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drone Fleet Section */}
      <div className="admin-section">
        <h3>
          <GiDeliveryDrone /> Drone Fleet
        </h3>
        <div className="admin-table">
          <div className="admin-table-header">
            <div>Drone ID</div>
            <div>Status</div>
            <div>Last Mission</div>
            <div>Actions</div>
          </div>
          {drones.map((drone) => (
            <div className="admin-table-row" key={drone.id}>
              <div>{drone.id}</div>
              <div>
                <span className={`status-dot ${drone.status.toLowerCase()}`}></span>
                {drone.status}
              </div>
              <div>{drone.lastMission}</div>
              <div className="action-buttons">
                <button 
                  className="details-btn"
                  onClick={() => handleDroneDetails(drone)}
                >
                  Details
                </button>
                <button 
                  className="edit-btn"
                  onClick={() => handleEditDrone(drone)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteDrone(drone.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drone Details Modal */}
      {selectedDrone && droneDetails && (
        <div className="modal">
          <div className="modal-content">
            <h3>Drone Details - {selectedDrone.name}</h3>
            <div className="drone-details">
              <p>Total Missions: {droneDetails.totalMissions}</p>
              <p>Flight Hours: {droneDetails.flightHours}</p>
              <p>Last Maintenance: {droneDetails.lastMaintenance}</p>
              <p>Battery Health: {droneDetails.batteryHealth}%</p>
            </div>
            <button onClick={() => setSelectedDrone(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Edit Drone Modal */}
      {isEditModalOpen && selectedDrone && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Drone</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateDrone({
                name: formData.get('name') as string,
                status: formData.get('status') as string,
              });
            }}>
              <div className="form-group">
                <label>Name:</label>
                <input 
                  name="name"
                  defaultValue={selectedDrone.name}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select name="status" defaultValue={selectedDrone.status}>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="idle">Idle</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isUserEditModalOpen && selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit User</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateUser({
                email: formData.get('email') as string,  // Changed from 'name' to 'email'
                role: formData.get('role') as string,
              });
            }}>
              <div className="form-group">
                <label>Email:</label>  {/* Changed label from 'Name' to 'Email' */}
                <input 
                  name="email"        // Changed from 'name' to 'email'
                  defaultValue={selectedUser.email}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select name="role" defaultValue={selectedUser.role}>
                  <option value="admin">Admin</option>     // Changed values to match backend
                  <option value="user">User</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setIsUserEditModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;