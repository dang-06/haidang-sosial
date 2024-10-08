import { useEffect, useRef } from 'react';
import ChatPage from './components/ChatPage';
import EditProfile from './components/EditProfile';
import Home from './components/Home';
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import Profile from './components/Profile';
import Signup from './components/Signup';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import { io } from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux';
import { setOnlineUsers } from './redux/chatSlice';
import { setLikeNotification } from './redux/rtnSlice';
import ProtectedRoutes from './components/ProtectedRoutes';
import { setCurrentPage } from './redux/currentSlice';
import { MentionProvider } from './lib/utils/MentionContext';
import './App.css';

const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoutes><MainLayout /></ProtectedRoutes>,
    children: [
      {
        path: '/',
        element: <ProtectedRoutes><Home /></ProtectedRoutes>
      },
      {
        path: '/:text',
        element: <ProtectedRoutes><Home /></ProtectedRoutes>
      },
      {
        path: '/hot/:text',
        element: <ProtectedRoutes><Home /></ProtectedRoutes>
      },
      {
        path: '/profile/:id',
        element: <ProtectedRoutes> <Profile /></ProtectedRoutes>
      },
      {
        path: '/account/edit',
        element: <ProtectedRoutes><EditProfile /></ProtectedRoutes>
      },
      {
        path: '/chat',
        element: <ProtectedRoutes><ChatPage /></ProtectedRoutes>
      },
    ]
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
]);

function App() {
  const { user } = useSelector(store => store.auth);
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const socketio = io(import.meta.env.VITE_SOCKET_URI, {
        query: {
          userId: user?._id
        },
        transports: ['websocket']
      });

      socketRef.current = socketio;

      // Listen for events
      socketio.on('getOnlineUsers', (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers));
      });

      socketio.on('notification', (notification) => {
        dispatch(setLikeNotification(notification));
      });

      // Clean up on component unmount
      return () => {
        socketio.close();
        socketRef.current = null;
      };
    } else if (socketRef.current) {
      // Close socket if user is not available
      socketRef.current.close();
      socketRef.current = null;
    }
  }, [user, dispatch]);

  return (
    <>
      <MentionProvider>
        <RouterProvider router={browserRouter} />
      </MentionProvider>
    </>
  );
}

export default App;
