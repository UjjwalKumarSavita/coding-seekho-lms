import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/timetable.css';

function TimeTable() {
  const [activeTab, setActiveTab] = useState('Live');
  const [classes, setClasses]     = useState([]);
  const [page, setPage]           = useState(0);
  const pageSize = 5;

  useEffect(() => {
    fetch(`http://localhost:8080/api/timetable?classType=${activeTab}`)
      .then(res => res.json())
      .then(data => {
        setClasses(data);
        setPage(0);
      })
      .catch(err => console.error('Error fetching timetable:', err));
  }, [activeTab]);

  const paginated = classes.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-title">Time Table</div>
        </div>

        {/* Live / Recorded Tabs */}
        <div className="class-tabs">
          <div
            className={`class-tab ${activeTab === 'Live' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('Live')}
          >
            Live Class
          </div>
          <div
            className={`class-tab ${activeTab === 'Recorded' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('Recorded')}
          >
            Recorded Class
          </div>
        </div>

        {/* Timetable Table */}
        <div className="timetable-table">
          <div className="table-header">
            <span>Lecture Name</span>
            <span>Subject</span>
            <span>Start Time</span>
            <span>End Time</span>
            <span>Date</span>
          </div>

          {paginated.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              No classes found.
            </div>
          ) : (
            paginated.map((item) => (
              <div className="table-row" key={item.id}>
                <span>
                  <div className="lecture-name">{item.lectureName}</div>
                  <div className="lecture-email">{item.email}</div>
                </span>
                <span>{item.subject}</span>
                <span>{item.startTime}</span>
                <span>{item.endTime}</span>
                <span>{item.date}</span>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * pageSize >= classes.length}
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}

export default TimeTable;