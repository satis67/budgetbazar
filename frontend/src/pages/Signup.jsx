import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import './Auth.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(StoreContext);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      login(data);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-left">
          <h2>Looks like you're new here!</h2>
          <p>Sign up with your details to get started</p>
        </div>
        <div className="auth-right">
          <form onSubmit={submitHandler}>
            <input type="text" placeholder="Enter Name" value={name} onChange={e => setName(e.target.value)} required />
            <input type="email" placeholder="Enter Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Enter Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="auth-btn">Continue</button>
          </form>
          <div className="auth-links">
            <Link to="/login">Existing User? Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Signup;
