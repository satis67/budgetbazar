import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import './Marketplace.css';

const Marketplace = () => {
  const [coders, setCoders] = useState([]);
  const { user } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoders = async () => {
      try {
        const { data } = await axios.get('/api/coders');
        setCoders(data);
      } catch (err) { console.error(err); }
    };
    fetchCoders();
  }, []);

  const handleHire = async (coderId) => {
    if (!user) return navigate('/login');
    const workDetails = prompt('Describe the work details:');
    if (!workDetails) return;
    const budget = prompt('Enter your budget (₹):');
    if (!budget) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/hire', { coderId, workDetails, budget }, config);
      alert('Hire Request Sent Successfully!');
    } catch(err) { alert('Failed to send hire request'); }
  };

  const handleChat = (coderUserObjId) => {
    if (!user) return navigate('/login');
    navigate(`/chat?user=${coderUserObjId}`);
  };

  return (
    <div className="marketplace-container">
      <h2>Coder Marketplace</h2>
      <div className="coder-grid">
        {coders.map(coder => (
          <div key={coder._id} className="coder-card">
             <h3>{coder.name}</h3>
             <div className="coder-rating">★ {coder.rating} ({coder.numReviews})</div>
             <p className="coder-price">₹{coder.price} / hr</p>
             <p className="coder-desc">{coder.description}</p>
             <div className="coder-skills">
                {coder.skills.map((skill, i) => <span key={i}>{skill}</span>)}
             </div>
             <div className="coder-actions">
               <button className="chat-btn" onClick={() => handleChat(coder.user)}>CHAT</button>
               <button className="hire-btn" onClick={() => handleHire(coder._id)}>HIRE NOW</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Marketplace;
