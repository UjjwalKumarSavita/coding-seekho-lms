import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/assignments.css';

function Assignments() {
  const [activeSemester, setActiveSemester] = useState(1);
  const [assignments, setAssignments]       = useState([]);
  const [page, setPage]                     = useState(0);
  const pageSize = 5;

  useEffect(() => {
    fetch(`http://localhost:8080/api/assignments?semester=${activeSemester}`)
      .then(res => res.json())
      .then(data => {
        setAssignments(data);
        setPage(0);
      })
      .catch(err => console.error('Error fetching assignments:', err));
  }, [activeSemester]);

  const paginated = assignments.slice(page * pageSize, page * pageSize + pageSize);

  const statusColor = (status) => {
    if (status === 'Submitted')       return '#28a745';
    if (status === 'Late Submission') return '#dc3545';
    return '#6c757d';
  };

  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-title">Assignment</div>
        </div>

        {/* Semester Tabs */}
        <div className="semester-tabs">
          {[1, 2, 3, 4].map((sem) => (
            <div
              key={sem}
              className={`semester-tab ${activeSemester === sem ? 'active-tab' : ''}`}
              onClick={() => setActiveSemester(sem)}
            >
              Semester {String(sem).padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* Assignment Table */}
        <div className="assignment-table">
          <div className="table-header">
            <span>Unit</span>
            <span>Subject</span>
            <span>Issue Date</span>
            <span>Deadline</span>
            <span>Status</span>
          </div>

          {paginated.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              No assignments found for this semester.
            </div>
          ) : (
            paginated.map((assignment) => (
              <div className="table-row" key={assignment.id}>
                <span>{assignment.unit}</span>
                <span>{assignment.subject}</span>
                <span>{assignment.issueDate}</span>
                <span>{assignment.deadline}</span>
                <span style={{ color: statusColor(assignment.status), fontWeight: '600' }}>
                  {assignment.status}
                </span>
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
            disabled={(page + 1) * pageSize >= assignments.length}
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}

export default Assignments;