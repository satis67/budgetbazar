import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('/api/products');
        setProducts(data.products);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="home-container">
      <div className="product-grid">
        {products.map(product => (
          <Link to={`/product/${product._id}`} key={product._id} className="product-card">
            <div className="product-img">
              <img src={product.images[0] || 'https://via.placeholder.com/150'} alt={product.name} />
            </div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <div className="product-rating">
                <span className="rating-badge">{product.rating} ★</span>
                <span className="rating-count">({product.numReviews})</span>
              </div>
              <div className="product-price">
                <span className="discount-price">₹{product.discountPrice > 0 ? product.discountPrice : product.price}</span>
                {product.discountPrice > 0 && <span className="original-price">₹{product.price}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default Home;
