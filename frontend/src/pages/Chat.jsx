import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import { StoreContext } from '../context/StoreContext';
import './Chat.css';

const ENDPOINT = '/'; 
let socket;

const Chat = () => {
  const { user } = useContext(StoreContext);
  const [searchParams] = useSearchParams();
  const receiverId = searchParams.get('user');

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    socket = io(ENDPOINT);
    if(user) {
      socket.emit('setup', user._id);
      socket.on('connected', () => setSocketConnected(true));
      socket.on('typing', () => setIsTyping(true));
      socket.on('stop typing', () => setIsTyping(false));
    }
  }, [user]);

  useEffect(() => {
    if(!user || !receiverId) return;
    const fetchMessages = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`/api/chat/${receiverId}`, config);
        setMessages(data);
        socket.emit('join chat', receiverId);
      } catch (err) { console.error(err); }
    };
    fetchMessages();
  }, [user, receiverId]);

  useEffect(() => {
    socket.on('message received', (newMessageRecieved) => {
      if (receiverId === newMessageRecieved.sender) {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage) return;
    socket.emit('stop typing', receiverId);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/chat', { receiverId, content: newMessage }, config);
      setNewMessage('');
      socket.emit('new message', data);
      setMessages([...messages, data]);
    } catch(err) { console.error(err); }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', receiverId);
    }
    let lastTypingTime = new Date().getTime();
    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= 3000 && typing) {
        socket.emit('stop typing', receiverId);
        setTyping(false);
      }
    }, 3000);
  };

  if(!user) return <div className="chat-container">Please login.</div>;
  if(!receiverId) return <div className="chat-container">Select a user to chat.</div>;

  return (
    <div className="chat-container">
      <div className="chat-box">
        <div className="chat-header"><h3>Live Chat</h3></div>
        <div className="chat-messages">
          {messages.map((m, i) => (
             <div key={i} className={`message ${m.sender === user._id ? 'sent' : 'received'}`}>
               <span className="msg-text">{m.content}</span>
             </div>
          ))}
          {isTyping && <div className="message received typing-indicator">typing...</div>}
        </div>
        <form className="chat-input" onSubmit={sendMessage}>
          <input type="text" placeholder="Type a message..." value={newMessage} onChange={typingHandler} />
          <button type="submit">SEND</button>
        </form>
      </div>
    </div>
  );
};
export default Chat;
