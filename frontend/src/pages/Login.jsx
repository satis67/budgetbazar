import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(StoreContext);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      login(data);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-left">
          <h2>Login</h2>
          <p>Get access to your Orders, Wishlist and Recommendations</p>
        </div>
        <div className="auth-right">
          <form onSubmit={submitHandler}>
            <input type="email" placeholder="Enter Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Enter Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="auth-btn">Login</button>
          </form>
          <div className="auth-links">
            <Link to="/signup">New to BudgetBazar? Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
