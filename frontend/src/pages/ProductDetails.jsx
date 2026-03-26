import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import './ProductDetails.css';

const ProductDetails = () => {
  const [product, setProduct] = useState({});
  const { id } = useParams();
  const { user, setCart } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/cart', { productId: id, quantity: 1 }, config);
      const { data } = await axios.get('/api/cart', config);
      setCart(data.cartItems);
      alert('Added to Cart');
    } catch (err) { alert('Failed to add to cart'); }
  };

  const handleBuyNow = () => {
    handleAddToCart().then(() => navigate('/checkout'));
  };

  if (!product.name) return <div>Loading...</div>;

  return (
    <div className="product-details-container">
      <div className="details-box">
        <div className="details-images">
          <img src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400'} alt={product.name} />
          <div className="details-actions">
            <button className="btn-cart" onClick={handleAddToCart} disabled={product.stock === 0}>ADD TO CART</button>
            <button className="btn-buy" onClick={handleBuyNow} disabled={product.stock === 0}>BUY NOW</button>
          </div>
        </div>
        <div className="details-info">
          <h2>{product.name}</h2>
          <div className="rating-block">
            <span className="badge">{product.rating} ★</span>
            <span className="reviews-count">{product.numReviews} Ratings</span>
          </div>
          <div className="price-block">
            <span className="current-price">₹{product.discountPrice > 0 ? product.discountPrice : product.price}</span>
            {product.discountPrice > 0 && <span className="mrp">₹{product.price}</span>}
          </div>
          <div className="stock-status" style={{ color: product.stock > 0 ? 'var(--green)' : 'var(--red)' }}>
            {product.stock > 0 ? `In Stock (${product.stock} items left)` : 'Out of Stock'}
          </div>
          
          <div className="variants-section">
            <h3>Available Variants</h3>
            {product.variants?.map((v, i) => (
              <span key={i} className="variant-pill">{v.color} - {v.size}</span>
            ))}
          </div>

          <div className="description-section">
            <h3>Product Description</h3>
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductDetails;
