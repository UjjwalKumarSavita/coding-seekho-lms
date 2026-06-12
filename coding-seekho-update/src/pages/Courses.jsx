import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/courses.css';

// const semesterModules = {
//     1: [
//         { id: 1, name: 'Module 01', subject: 'Programming', unit: 'Unit 01', status: 'Completed' },
//         { id: 2, name: 'Module 02', subject: 'Networking', unit: 'Unit 01', status: 'Ongoing' },
//         { id: 3, name: 'Module 03', subject: 'Database', unit: 'Unit 01', status: 'Pending' },
//         { id: 4, name: 'Module 04', subject: 'Professional Practice', unit: 'Unit 01', status: 'Pending' },
//     ],
//     2: [
//         { id: 5, name: 'Module 01', subject: 'Web Development', unit: 'Unit 01', status: 'Pending' },
//         { id: 6, name: 'Module 02', subject: 'UI/UX Design', unit: 'Unit 01', status: 'Pending' },
//     ],
//     3: [
//         { id: 7, name: 'Module 01', subject: 'Cloud Computing', unit: 'Unit 01', status: 'Pending' },
//         { id: 8, name: 'Module 02', subject: 'Cyber Security', unit: 'Unit 01', status: 'Pending' },
//     ],
//     4: [
//         { id: 9, name: 'Module 01', subject: 'AI & Machine Learning', unit: 'Unit 01', status: 'Pending' },
//         { id: 10, name: 'Module 02', subject: 'Final Project', unit: 'Unit 01', status: 'Pending' },
//     ],
// };

// const courses = [
//     { code: 'OXF/ENG/01', name: 'Diploma in English' },
//     { code: 'OXF/DIT/01', name: 'Diploma in IT' },
//     { code: 'OXF/HND/01', name: 'HND in Computing' },
// ];

function Courses() {
    const [activeSemester, setActiveSemester] = useState(1);
    //   const [activeCourse, setActiveCourse]       = useState(0);
    const [activeCourse, setActiveCourse] = useState(null);
    const [courses, setCourses] = useState([]);
    const [modules, setModules] = useState([]);
    const [page, setPage] = useState(0);
    const pageSize = 4;

    // useEffect(() => {
    //     // later we'll fetch from backend here
    //     setModules(semesterModules[activeSemester] || []);
    //     setPage(0);
    // }, [activeSemester]);
    // Fetch all courses on load
    useEffect(() => {
        fetch('http://localhost:8080/api/courses')
            .then(res => res.json())
            .then(data => {
                setCourses(data);
                if (data.length > 0) {
                    setActiveCourse(data[0]); // select first course by default
                }
            })
            .catch(err => console.error('Error fetching courses:', err));
    }, []);

    // Fetch modules when course or semester changes
    useEffect(() => {
        if (!activeCourse) return;

        fetch(`http://localhost:8080/api/courses/${activeCourse.id}/modules?semester=${activeSemester}`)
            .then(res => res.json())
            .then(data => {
                setModules(data);
                setPage(0);
            })
            .catch(err => console.error('Error fetching modules:', err));
    }, [activeCourse, activeSemester]);




    const paginated = modules.slice(page * pageSize, page * pageSize + pageSize);

    const statusColor = (status) => {
        if (status === 'Completed') return '#28a745';
        if (status === 'Ongoing') return '#ffc107';
        return '#6c757d';
    };

    return (
        <div className="app-container">
            <Sidebar />

            <div className="main-content">

                {/* Topbar */}
                <div className="topbar">
                    <div className="topbar-title">My Courses</div>
                </div>

                {/* Course Cards */}
                <div className="course-cards">
                    {/* {courses.map((course, index) => (
                        <div
                            key={index}
                            className={`course-card ${activeCourse === index ? 'active-card' : ''}`}
                            onClick={() => setActiveCourse(index)}
                        >
                            📄 {course.name}
                            <br />
                            <small>{course.code}</small>
                        </div>
                    ))} */}
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className={`course-card ${activeCourse?.id === course.id ? 'active-card' : ''}`}
                            onClick={() => setActiveCourse(course)}
                        >
                            📄 {course.name}
                            <br />
                            <small>{course.code}</small>
                        </div>
                    ))}
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

                {/* Module Table */}
                <div className="module-table">
                    <div className="table-header">
                        <span>Module</span>
                        <span>Subject</span>
                        <span>Unit</span>
                        <span>Status</span>
                    </div>

                    {/* {paginated.map((mod) => (
                        <div className="table-row" key={mod.id}>
                            <span>
                                <span className="check">✅</span> {mod.name}
                            </span>
                            <span>{mod.subject}</span>
                            <span>{mod.unit}</span>
                            <span style={{ color: statusColor(mod.status), fontWeight: '600' }}>
                                {mod.status}
                            </span>
                        </div>
                    ))} */}
                    {paginated.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            No modules found for this semester.
                        </div>
                    ) : (
                        paginated.map((mod) => (
                            <div className="table-row" key={mod.id}>
                                <span>✅ {mod.name}</span>
                                <span>{mod.subject}</span>
                                <span>{mod.unit}</span>
                                <span style={{ color: statusColor(mod.status), fontWeight: '600' }}>
                                    {mod.status}
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
                        disabled={(page + 1) * pageSize >= modules.length}
                    >
                        Next
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Courses;