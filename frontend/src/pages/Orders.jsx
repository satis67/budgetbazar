import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { StoreContext } from '../context/StoreContext';
import './Orders.css';

const Orders = () => {
  const { user } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/orders/myorders', config);
        setOrders(data);
      } catch (err) { console.error(err); }
    };
    fetchOrders();
  }, [user]);

  if (!user) return <div className="orders-container">Please login to view orders</div>;
  if (orders.length === 0) return <div className="orders-container"><h2>No orders found</h2></div>;

  return (
    <div className="orders-container">
       <h2>My Orders</h2>
       <div className="orders-list">
         {orders.map(order => (
           <div key={order._id} className="order-card">
              <div className="order-header">
                 <span><b>Order ID:</b> {order._id}</span>
                 <span><b>Total:</b> ₹{order.totalPrice}</span>
                 <span><b>Status:</b> <span className={`status-${order.status.toLowerCase().replace(' ','-')}`}>{order.status}</span></span>
              </div>
              <div className="order-items">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                     <span>{item.name} (x{item.quantity})</span>
                     <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="order-timeline">
                 <p className="delivery-date">Estimated Delivery: {new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>
                 <div className="timeline-track">
                    {['Ordered', 'Packed', 'Shipped', 'Delivered'].map((step, i) => {
                       const isCompleted = order.statusHistory?.some(h => h.status === step);
                       const isCancelled = order.status === 'Cancelled' || order.status === 'Return Pending';
                       const color = isCancelled ? 'var(--red)' : (isCompleted ? 'var(--green)' : 'var(--border-color)');
                       return (
                         <div key={i} className="timeline-step">
                            <div className="dot" style={{ backgroundColor: color }}></div>
                            <span>{step}</span>
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>
         ))}
       </div>
    </div>
  );
};
export default Orders;
