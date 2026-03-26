const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/coders', require('./routes/coderRoutes'));
app.use('/api/hire', require('./routes/hireRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Socket.io Config for Chat & Notifications
io.on('connection', (socket) => {
  console.log('Socket Connected: ', socket.id);

  socket.on('setup', (userId) => {
    socket.join(userId);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => socket.join(room));

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (message) => {
    socket.in(message.receiver).emit('message received', message);
    socket.in(message.receiver).emit('notification', { message: 'New message received!' });
  });

  socket.on('hire update', (hireData) => {
    socket.in(hireData.userId).emit('notification', { message: `Hire request was ${hireData.status}` });
  });

  socket.on('disconnect', () => { console.log('Socket Disconnected'); });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
