import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import './Checkout.css';

const Checkout = () => {
  const { user, cart, setCart } = useContext(StoreContext);
  const navigate = useNavigate();
  
  const [address, setAddress] = useState({
    fullName: user?.name || '', street: '', city: '', postalCode: '', phone: ''
  });

  const totalPrice = cart.reduce((acc, item) => acc + (item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price) * item.quantity, 0);

  const placeOrderHandler = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Cart is empty');
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const orderData = {
        orderItems: cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price,
          product: item.product._id
        })),
        shippingAddress: address,
        paymentMethod: 'COD'
      };

      await axios.post('/api/orders', orderData, config);
      setCart([]); // clear local cart
      navigate('/orders'); // redirect
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    }
  };

  if (!user) return <div className="checkout-container">Please login first</div>;

  return (
    <div className="checkout-container">
      <div className="checkout-left">
        <h2>Delivery Address</h2>
        <form className="address-form" onSubmit={placeOrderHandler}>
           <input type="text" placeholder="Full Name" value={address.fullName} onChange={e=>setAddress({...address, fullName: e.target.value})} required/>
           <input type="text" placeholder="Street Address" value={address.street} onChange={e=>setAddress({...address, street: e.target.value})} required/>
           <input type="text" placeholder="City" value={address.city} onChange={e=>setAddress({...address, city: e.target.value})} required/>
           <input type="text" placeholder="Pincode" value={address.postalCode} onChange={e=>setAddress({...address, postalCode: e.target.value})} required/>
           <input type="number" placeholder="Phone Number" value={address.phone} onChange={e=>setAddress({...address, phone: e.target.value})} required/>
           
           <h3>Payment Method</h3>
           <div className="payment-method">
              <input type="radio" id="cod" name="payment" value="COD" checked readOnly/>
              <label htmlFor="cod">Cash on Delivery (COD)</label>
           </div>
           
           <button type="submit" className="confirm-btn">CONFIRM ORDER</button>
        </form>
      </div>
      
      <div className="checkout-right">
         <div className="price-summary">
            <h3>ORDER SUMMARY</h3>
            <hr/>
            <div className="summary-row"><span>Items ({cart.length})</span><span>₹{totalPrice}</span></div>
            <div className="summary-row"><span>Delivery</span><span className="free">Free</span></div>
            <hr/>
            <div className="summary-row total"><span>Total Payable</span><span>₹{totalPrice}</span></div>
         </div>
      </div>
    </div>
  );
};
export default Checkout;
