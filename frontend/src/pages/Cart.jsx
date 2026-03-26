import { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Cart.css';

const Cart = () => {
  const { cart, setCart, user } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleUpdateQty = async (productId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return handleRemove(productId);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put('/api/cart', { productId, quantity: newQty }, config);
      const { data } = await axios.get('/api/cart', config);
      setCart(data.cartItems);
    } catch(err) { console.error(err); }
  };

  const handleRemove = async (productId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/cart/${productId}`, config);
      const { data } = await axios.get('/api/cart', config);
      setCart(data.cartItems);
    } catch(err) { console.error(err); }
  };

  const totalPrice = cart.reduce((acc, item) => acc + (item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price) * item.quantity, 0);

  if (!user) return <div className="cart-container"><h2>Please login to view your cart</h2></div>;
  if (cart.length === 0) return <div className="cart-container"><h2>Your Cart is Empty!</h2><Link to="/">Shop Now</Link></div>;

  return (
    <div className="cart-container">
      <div className="cart-left">
        <div className="cart-header"><h2>My Cart ({cart.length})</h2></div>
        {cart.map((item, index) => (
          <div key={index} className="cart-item">
             <div className="cart-img">
               <img src={item.product.images?.length > 0 ? item.product.images[0] : 'https://via.placeholder.com/100'} alt={item.product.name} />
             </div>
             <div className="cart-details">
               <Link to={`/product/${item.product._id}`} className="cart-title">{item.product.name}</Link>
               <div className="cart-price">₹{item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price} 
                   {item.product.discountPrice > 0 && <span className="cart-mrp">₹{item.product.price}</span>}
               </div>
               <div className="cart-actions">
                 <button onClick={() => handleUpdateQty(item.product._id, item.quantity, -1)}>-</button>
                 <span className="qty-box">{item.quantity}</span>
                 <button onClick={() => handleUpdateQty(item.product._id, item.quantity, 1)}>+</button>
                 <button className="remove-btn" onClick={() => handleRemove(item.product._id)}>REMOVE</button>
               </div>
             </div>
          </div>
        ))}
      </div>
      <div className="cart-right">
        <div className="price-details-card">
          <h3>PRICE DETAILS</h3>
          <hr />
          <div className="price-row"><span>Price ({cart.length} items)</span><span>₹{totalPrice}</span></div>
          <div className="price-row"><span>Delivery Charges</span><span className="free">Free</span></div>
          <hr />
          <div className="price-row total"><span>Total Amount</span><span>₹{totalPrice}</span></div>
          <button className="place-order-btn" onClick={() => navigate('/checkout')}>PLACE ORDER</button>
        </div>
      </div>
    </div>
  );
};
export default Cart;
