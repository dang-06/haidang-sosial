import { Heart, Home, LogOut, MessageCircle, PlusSquare, Search, TrendingUp } from 'lucide-react'
import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { toast } from 'sonner'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser } from '@/redux/authSlice'
import CreatePost from './CreatePost'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'

const LeftSidebar = () => {
    const navigate = useNavigate();
    const { user } = useSelector(store => store.auth);
    const { likeNotification } = useSelector(store => store.realTimeNotification);
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [openNoti, setOpenNoti] = useState(false);


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
            console.log("Notifications")
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
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
            ),
            text: "Profile"
        },
        { icon: <LogOut />, text: "Logout" },
    ]
    return (
        <div className='flex'>
            <div className='fixed top-0 z-10 left-0 px-4 border-r border-gray-300  h-screen'>
                <div className='flex flex-col w-[240px]'>
                    <img src="/2.png" alt="" className='w-[40%] object-cover mt-6 mb-4 pl-3' />
                    <div>
                        {
                            sidebarItems.map((item, index) => {
                                return (
                                    <div onClick={() => sidebarHandler(item.text)} key={index} className='flex items-center gap-3 relative hover:bg-gray-100 cursor-pointer rounded-lg p-3 my-3'>
                                        {item.icon}
                                        <span>{item.text}</span>
                                        {
                                            item.text === "Notifications" && likeNotification.length > 0 && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button size='icon' className="rounded-full h-5 w-5 bg-red-600 hover:bg-red-600 absolute bottom-6 left-6">{likeNotification.length}</Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent>
                                                        <div>
                                                            {
                                                                likeNotification.length === 0 ? (<p>No new notification</p>) : (
                                                                    likeNotification.map((notification) => {
                                                                        return (
                                                                            <div key={notification.userId} className='flex items-center gap-2 my-2'>
                                                                                <Avatar>
                                                                                    <AvatarImage src={notification.userDetails?.profilePicture} />
                                                                                    <AvatarFallback>CN</AvatarFallback>
                                                                                </Avatar>
                                                                                <p className='text-sm'><span className='font-bold'>{notification.userDetails?.username}</span> liked your post</p>
                                                                            </div>
                                                                        )
                                                                    })
                                                                )
                                                            }
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>

                <CreatePost open={open} setOpen={setOpen} />

            </div>
            {openNoti && <Notifications likeNotification={likeNotification} />}
        </div>

    )
}

const Notifications = ({ likeNotification = [] }) => {
    return (
        <div   style={{
            transitionProperty: 'all',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDuration: '0.5s',
          }} className = 'z-20 top-0 left-[272px] fixed bg-white h-[100vh] border px-6 py-4 rounded-r-lg md:min-w-[300px] transition-transform duration-[300ms] ease-in-out transform translate-x-0 ' >
    <h1>Notification</h1>
{
    likeNotification.length === 0 ? (
        <p>No new notification</p>
    ) : (
        Array.isArray(likeNotification) && likeNotification.length > 0 ? (
            likeNotification.map((notification) => (
                <div key={notification.userId} className='flex items-center gap-2 my-2'>
                    <Avatar>
                        <AvatarImage src={notification.userDetails?.profilePicture} />
                        <AvatarFallback>CN</AvatarFallback>
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
        </div >
    );
};


export default LeftSidebar