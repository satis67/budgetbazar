import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import io from 'socket.io-client';
import './Navbar.css';

const ENDPOINT = '/';
let socket;

const Navbar = () => {
  const { user, logout, cart } = useContext(StoreContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
   if (!socket) socket = io(ENDPOINT);
    if(user) {
      socket.emit('setup', user._id);
      socket.on('notification', (notif) => {
        setNotifications([notif, ...notifications]);
      });
    }
  }, [user, notifications]);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">BudgetBazar</Link>
        <div className="nav-search">
          <input type="text" placeholder="Search for products, brands and more" />
          <button>Search</button>
        </div>
        <div className="nav-links">
          {user ? (
            <div className="nav-profile">
              <span className="nav-username">{user.name}</span>
              <div className="notif-wrapper">
                 <button className="notif-btn" onClick={() => setShowNotif(!showNotif)}>
                    🔔 {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
                 </button>
                 {showNotif && (
                   <div className="notif-dropdown">
                     {notifications.length === 0 ? <p style={{padding:'10px',fontSize:'13px'}}>No new notifications</p> : 
                       notifications.map((n, idx) => <p key={idx} className="notif-item">{n.message}</p>)
                     }
                   </div>
                 )}
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="logout-btn">Logout</button>
            </div>
          ) : (<Link to="/login" className="login-btn">Login</Link>)}
          
          <Link to="/coders" className="nav-cart" style={{marginRight: '15px'}}>Coders</Link>

          <Link to="/cart" className="nav-cart">
            <span>Cart</span>
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
