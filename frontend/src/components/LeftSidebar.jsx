import { Heart, Home, LogOut, MessageCircle, PlusSquare, Search, TrendingUp } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { toast } from 'sonner'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser } from '@/redux/authSlice'
import CreatePost from './CreatePost'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { setCurrentPage } from '@/redux/currentSlice'

const LeftSidebar = ({sidebarOpen,toggleSidebar}) => {
    const navigate = useNavigate();
    const { user } = useSelector(store => store.auth);
    const { likeNotification } = useSelector(store => store.realTimeNotification);
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [openNoti, setOpenNoti] = useState(false);
    const { currentPage } = useSelector(store => store.current)

    const location = useLocation();
    const path = location.pathname;
    const notificationRef = useRef(null);
    const notificationRef1 = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target) && notificationRef1 && !notificationRef1.current.contains(event.target)) {
          setOpenNoti(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [notificationRef,notificationRef1]);
  

    useEffect(() => {
        let page = '';
        if (path === '/') {
            page = 'Home';
        } else if (path === '/chat') {
            page = 'Messages';
        } else if (path === '/login') {
            page = 'Login';
        } else if (path === '/signup') {
            page = 'Signup';
        }
        dispatch(setCurrentPage(page));
        if(window.innerWidth < 768){
            toggleSidebar(false)
        }
    }, [dispatch, path]);

    const logoutHandler = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URI}/user/logout`, { withCredentials: true });
            if (res.data.success) {
                dispatch(setAuthUser(null));
                dispatch(setSelectedPost(null));
                dispatch(setPosts([]));
                navigate("/login");
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    }

    const sidebarHandler = (textType) => {
        if (textType === 'Logout') {
            logoutHandler();
        } else if (textType === "Create") {
            setOpen(true);
        } else if (textType === "Profile") {
            navigate(`/profile/${user?._id}`);
        } else if (textType === "Home") {
            navigate("/");
        } else if (textType === 'Messages') {
            navigate("/chat");
        } else if (textType === 'Notifications') {
            setOpenNoti(!openNoti);
        }
    }

    const sidebarItems = [
        { icon: <Home />, text: "Home" },
        { icon: <Search />, text: "Search" },
        { icon: <TrendingUp />, text: "Explore" },
        { icon: <MessageCircle />, text: "Messages" },
        { icon: <Heart />, text: "Notifications" },
        { icon: <PlusSquare />, text: "Create" },
        {
            icon: (
                <Avatar className='w-6 h-6'>
                    <AvatarImage src={user?.profilePicture} alt="@shadcn" />
                    <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            ),
            text: "Profile"
        },
        { icon: <LogOut />, text: "Logout" },
    ]
    return (
        <div className='flex'>
            <div className=' overflow-x-hidden z-10 md:px-4'>
                <div className='flex flex-col w-[210px] h-[90vh]'>
                    <div>
                        {
                            sidebarItems.map((item, index) => {
                                const isActive = currentPage === item.text;
                                return (
                                    <div key={index}>
                                        {index == 6 && (
                                            <hr></hr>
                                        )}
                                        <div ref={notificationRef1}  onClick={() => sidebarHandler(item.text)} className={`${isActive ? 'bg-gray-200' : 'hover:bg-gray-100'} flex items-center gap-4 relative hover:bg-gray-100 cursor-pointer rounded-lg p-3 my-1`}>
                                            {item.icon}
                                            <span>{item.text}</span>
                                            {
                                                item.text === "Notifications" && likeNotification.length > 0 && (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button size='icon' className="rounded-full h-5 w-5 bg-red-600 hover:bg-red-600 absolute bottom-6 left-6">{likeNotification.length}</Button>
                                                        </PopoverTrigger>
                                                        {/* <PopoverContent>
                                                            <div>
                                                                {
                                                                    likeNotification.length === 0 ? (<p>No new notification</p>) : (
                                                                        likeNotification.map((notification) => {
                                                                            return (
                                                                                <div key={notification.userId} className='flex items-center gap-2 my-2'>
                                                                                    <Avatar>
                                                                                        <AvatarImage src={notification.userDetails?.profilePicture} />
                                                                                        <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                                                                    </Avatar>
                                                                                    <p className='text-sm'><span className='font-bold'>{notification.userDetails?.username}</span> liked your post</p>
                                                                                </div>
                                                                            )
                                                                        })
                                                                    )
                                                                }
                                                            </div>
                                                        </PopoverContent> */}
                                                    </Popover>
                                                )
                                            }
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>

                <CreatePost open={open} setOpen={setOpen} />

            </div>
            {openNoti && <div
                ref={notificationRef} 
                style={{
                    transitionProperty: 'all',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDuration: '0.5s',
                }} className={`${sidebarOpen ? "md:left-[250px]" : "md:left-[85px]"} left-[210px] z-20 top-[60px] fixed bg-white h-[100vh] border px-6 py-4 rounded-r-lg md:min-w-[300px] transition-transform ease-in-out transform translate-x-0`} >
                <h1>Notification</h1>
                {
                    likeNotification.length === 0 ? (
                        <p>No new notification</p>
                    ) : (
                        Array.isArray(likeNotification) && likeNotification.length > 0 ? (
                            likeNotification.map((notification, index) => (
                                <div key={index} className='flex items-center gap-2 my-2'>
                                    <Avatar>
                                        <AvatarImage src={notification.userDetails?.profilePicture} />
                                        <AvatarFallback>{notification.userDetails?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <p className='text-sm'>
                                        <span className='font-bold'>{notification.userDetails?.username}</span> liked your post
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p>No new notification</p>
                        )
                    )
                }
            </div >}
        </div>

    )
}

export default LeftSidebar