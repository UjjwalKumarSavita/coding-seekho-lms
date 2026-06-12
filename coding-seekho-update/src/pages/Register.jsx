import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const message = await response.text();
            alert(message);
        } catch (error) {
            alert('Something went wrong!');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-wrapper">
                <div className="auth-logo">
                    <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#0a1045' }}>Coding Seekho</span>
                </div>
                <h2>Signup Your Account</h2>
                <label>Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                />
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                />
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                />
                <button onClick={handleRegister}>Sign Up</button>
                <div className="auth-bottom">
                    Already have an account? <Link to="/">Sign in</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;



// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import '../styles/auth.css';

// function Register() {
//     const [username, setUsername] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');

//     //   const handleRegister = () => {
//     //     console.log('Register clicked', { username, email, password });
//     //     // We'll connect to backend in Phase 4
//     //   };
//     const handleRegister = async () => {
//         try {
//             const response = await fetch('http://localhost:8080/api/auth/register', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ username, email, password })
//             });

//             const message = await response.text();
//             alert(message); // shows "User registered successfully!" or error
//         } catch (error) {
//             alert('Something went wrong!');
//         }
//     };

//     return (
//         <div className="auth-wrapper">
//             <div className="auth-logo">
//                 <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#0a1045' }}>Coding Seekho</span>
//             </div>

//             <h2>Signup Your Account</h2>

//             <label>Username</label>
//             <input
//                 type="text"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 placeholder="Enter your username"
//             />

//             <label>Email</label>
//             <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Enter your email"
//             />

//             <label>Password</label>
//             <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter your password"
//             />

//             <button onClick={handleRegister}>Sign Up</button>

//             <div className="auth-bottom">
//                 Already have an account? <Link to="/">Sign in</Link>
//             </div>
//         </div>
//     );
// }

// export default Register;
