import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.message === 'Login successful!') {
                localStorage.setItem('username', data.username);
                localStorage.setItem('email', data.email);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('joinedAt', data.joinedAt);
                localStorage.setItem('profilePhoto', data.profilePhoto);
                navigate('/dashboard');
            } else {
                alert(data.message);
            }
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
                <h2>Sign in Your Account</h2>
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
                <div className="remember-row">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" style={{ width: 'auto', marginBottom: '0' }} />
                        Remember my preference
                    </label>
                    <span style={{ cursor: 'pointer', color: '#555' }}>Forgot Password?</span>
                </div>
                <button onClick={handleLogin}>Sign In</button>
                <div className="auth-bottom">
                    Don't have an account? <Link to="/register">Sign up</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;





// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import '../styles/auth.css';


// function Login() {
//     const navigate = useNavigate();
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');

//     // const handleLogin = () => {
//     //     console.log('Login clicked', { email, password });
//     //     // We'll connect to backend in Phase 4
//     // };
//     const handleLogin = async () => {
//         try {
//             const response = await fetch('http://localhost:8080/api/auth/login', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email, password })
//             });

//             // const message = await response.text();
//             // console.log('Response message :', message);
//             // console.log('Message length :', message.length);
//             // alert(message); // shows "Login successful!" or error

//             const data = await response.json();


//             // if (message.trim() === 'Login successful!') { // ← added .trim()
//             if (data.message === 'Login successful!') {
//                 // localStorage.setItem('username', data.username); // save usernmae
//                 localStorage.setItem('username', data.username);
//                 localStorage.setItem('email', data.email);
//                 localStorage.setItem('userId', data.userId);
//                 localStorage.setItem('joinedAt', data.joinedAt);
//                 localStorage.setItem('profilePhoto', data.profilePhoto);
//                 navigate('/dashboard');
//             } else {
//                 alert(data.message);
//             }

//         }
//         catch (error) {
//             alert('Something went wrong!');
//         }
//     };

//     return (
//         <div className="auth-wrapper">
//             <div className="auth-logo">
//                 {/* Replace with your Oxford logo image later */}
//                 <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#0a1045' }}>Coding Seekho</span>
//             </div>

//             <h2>Sign in Your Account</h2>

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

//             {/* <div className="remember-row">
//         <label><input type="checkbox" /> Remember my preference</label>
//         <a href="#">Forgot Password?</a>
//       </div> */}
//             <div className="remember-row">
//                 <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                     <input type="checkbox" style={{ width: 'auto', marginBottom: '0' }} />
//                     Remember my preference
//                 </label>
//                 <span style={{ cursor: 'pointer', color: '#555' }}>Forgot Password?</span>
//             </div>


//             <button onClick={handleLogin}>Sign In</button>

//             <div className="auth-bottom">
//                 Don't have an account? <Link to="/register">Sign up</Link>
//             </div>

//         </div>
//     );
// }

// export default Login;