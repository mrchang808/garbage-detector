import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaFilter, FaCalendar } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Missions.css';
import { ENDPOINTS } from '../api/endpoints';

interface Mission {
  id: number;
  start_time: string;  // Changed from date to start_time to match backend
  end_time: string | null;
  status: 'completed' | 'in_progress';
  detected_objects: { [key: string]: number };  // Changed from detectedObjects
  drone_id: number;
  details?: MissionDetails;
}

interface MissionDetails {
  startLocation: string;
  endLocation: string;
  objectTypes: { [key: string]: number };
  route: string[];
}

const Missions: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    search: '',
    dateRange: {
      start: null as Date | null,
      end: null as Date | null
    }
  });

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const response = await axios.get<Mission[]>(ENDPOINTS.MISSIONS);
        setMissions(response.data);
      } catch (error) {
        console.error('Error fetching missions:', error);
      }
    };
    fetchMissions();
  }, []);

  const handleViewDetails = async (mission: Mission) => {
    try {
      const response = await axios.get<MissionDetails>(
        ENDPOINTS.MISSION_DETAILS(mission.id)
      );
      setSelectedMission({ ...mission, details: response.data });
    } catch (error) {
      console.error('Error fetching mission details:', error);
    }
  };

  const filteredMissions = missions.filter((mission) => {
    if (!mission || !mission.start_time) return false;  // Add null check
    
    const matchesStatus = filter.status ? mission.status === filter.status : true;
    const matchesSearch = mission.start_time.toLowerCase().includes(filter.search.toLowerCase());
    const matchesDateRange = filter.dateRange.start && filter.dateRange.end ? 
      new Date(mission.start_time) >= filter.dateRange.start && 
      new Date(mission.start_time) <= filter.dateRange.end : true;
    
    return matchesStatus && matchesSearch && matchesDateRange;
  });

  return (
    <div className="missions-container">
      <h2 className="page-title">Mission History</h2>

      <div className="filters-container">
        <div className="search-input">
          <FaSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Search missions..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>

        <div className="date-range-picker">
          <FaCalendar className="filter-icon" />
          <DatePicker
            selectsRange
            startDate={filter.dateRange.start}
            endDate={filter.dateRange.end}
            onChange={(dates) => setFilter({
              ...filter,
              dateRange: {
                start: dates[0],
                end: dates[1]
              }
            })}
            placeholderText="Select date range"
            className="date-picker"
          />
        </div>

        <div className="filter-select">
          <FaFilter className="filter-icon" />
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      <div className="missions-table">
        <div className="table-header">
          <div>Mission Date</div>
          <div>Status</div>
          <div>Objects Found</div>
          <div>Duration</div>
          <div>Actions</div>
        </div>

        {filteredMissions.map((mission) => (
          <React.Fragment key={mission.id}>
            <div className="table-row">
              <div data-label="Date">
                {new Date(mission.start_time).toLocaleDateString()}
              </div>
              <div data-label="Status">
                <span className={`status-badge ${mission.status}`}>
                  {mission.status === 'in_progress' ? 'In Progress' : 'Completed'}
                </span>
              </div>
              <div data-label="Objects Found">
                {Object.values(mission.detected_objects || {}).reduce((a, b) => a + b, 0)} objects
              </div>
              <div data-label="Duration">
                {mission.end_time ? 
                  getDuration(new Date(mission.start_time), new Date(mission.end_time)) : 
                  'In Progress'}
              </div>
              <div data-label="Actions">
                <button 
                  className="details-btn"
                  onClick={() => handleViewDetails(mission)}
                >
                  View Details
                </button>
              </div>
            </div>

            {selectedMission?.id === mission.id && selectedMission.details && (
              <div className="mission-details">
                <h3>Mission Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Start Time:</strong>
                    <span>{new Date(mission.start_time).toLocaleString()}</span>
                  </div>
                  {mission.end_time && (
                    <div className="detail-item">
                      <strong>End Time:</strong>
                      <span>{new Date(mission.end_time).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Objects Detected:</strong>
                    <div className="object-types">
                      {Object.entries(mission.detected_objects || {}).map(([type, count]) => (
                        <span key={type} className="object-type-badge">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Add helper function for duration calculation
const getDuration = (start: Date, end: Date): string => {
  const diff = end.getTime() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export default Missions;