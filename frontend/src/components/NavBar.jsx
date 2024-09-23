import React, { useEffect, useState } from 'react'
import { RiMenuLine } from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { IoHome, IoHomeOutline, IoSearch } from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useDispatch, useSelector } from 'react-redux';
import SearchOptions from './ui/searchOptions'
import { Box, Tooltip, Typography, Avatar as AVT } from '@mui/material';
import { IoIosNotificationsOutline, IoIosSettings, IoLogoGameControllerA, IoMdHome, IoMdNotifications } from 'react-icons/io';
import { FaHotjar } from 'react-icons/fa';
import { PiVideoDuotone, PiVideoLight } from "react-icons/pi";
import { setCurrentPage, setMode } from '@/redux/currentSlice'
import { MdExplore, MdNightsStay, MdOutlineExplore } from "react-icons/md";
import { LuPenSquare } from "react-icons/lu";
import { TrendingUp } from 'lucide-react';
import useGetAllUsers from '@/hooks/useGetAllUsers';
import { toast } from 'sonner';
import axios from 'axios';
import { setAuthUser } from '@/redux/authSlice';
import { setPosts, setSelectedPost } from '@/redux/postSlice';
import CreatePost from './CreatePost';




const NavBar = ({ sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation()
  const { user } = useSelector(store => store.auth);
  const { currentPage, mode } = useSelector(store => store.current)
  const path = location.pathname;
  const dispatch = useDispatch()
  const [openCratePost, setOpenCreatePost] = useState(false)

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
      console.log(error)
      toast.error(error.response.data.message);
    }
  }
  const changeMode = () => {
    dispatch(setMode(mode == "light" ? "dark" : "light"))
  }
  const routeChange = () => {
    navigate('/');
  }
  useEffect(() => {
    let page = '';
    if (path === '/') {
      page = 'Trang chủ';
    } else if (path === '/chat') {
      page = 'Xu hướng';
    } else if (path === '/Video') {
      page = 'Video';
    } else if (path === '/Notification') {
      page = 'Thông báo';
    } else if (path === `/profile/${user._id}`) {
      page = 'Trang cá nhân';
    }
    dispatch(setCurrentPage(page));
  }, [dispatch, path]);
  const options = [
    user, user, user, user, user, user, user
  ];
  const sidebarItems = [
    { icon: <IoHomeOutline className='h-7 w-7' />, iconActive: <IoHome className='text-maincolor h-7 w-7' />, text: "Trang chủ" },
    { icon: <MdOutlineExplore className='h-7 w-7' />, iconActive: <MdExplore className='text-maincolor h-7 w-7' />, text: "Xu hướng" },
    { icon: <PiVideoLight className='h-7 w-7' />, iconActive: <PiVideoDuotone className='text-maincolor h-7 w-7' />, text: "Video" },
    { icon: <IoIosNotificationsOutline className='h-7 w-7' />, iconActive: <IoMdNotifications className='text-maincolor h-7 w-7' />, text: "Thông báo" },
    {
      icon: <Tooltip title="Account"><AVT src={user.profilePicture} sx={{ width: 27, height: 27 }}></AVT></Tooltip>,
      iconActive: <Tooltip title="Account"><AVT className='text-maincolor' src={user.profilePicture} sx={{ width: 30, height: 30 }}></AVT></Tooltip>, text: "Trang cá nhân"
    },
  ]
  const sidebarHandler = (textType) => {
    if (textType === 'Trang chủ') {
      navigate("/");
    } else if (textType === "Xu hướng") {
      navigate("/");
    } else if (textType === "Video") {
      navigate(`/`);
    } else if (textType === "Thông báo") {
      navigate("/");
    } else if (textType === 'Trang cá nhân') {
      navigate(`/profile/${user?._id}`);
    }
  }
  return (
    <div className='v2 bg-neutral-background pointer-events-auto px-md h-[60px] duration-[300ms] transition-all'>
      <div className="flex justify-center items-center  border-t-2 border-maincolor h-full" onClick={() => toggleSidebar(false)}>
        <div className="text-center bg-white flex w-[8%]">
          <RiMenuLine className=" md:hidden text-danger h-[58px] min-w-[21px] ml-3 md:ml-9 mr-[20px] z-10 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSidebar();
            }} />
          <img
            className="block h-[55px] w-full p-2  "
            src="/newLogo.png"
            alt="logo"
            onClick={routeChange}
          />
        </div>
        <div className='flex items-center justify-between w-[82%] h-[59px] py-3'>
          <div className=" searchSection flex items-center justify-center hidden xl:flex w-[20%]">
            <SearchOptions />
          </div>
          <div className="flex items-center justify-around w-[70%] xl:w-[50%] pl-5">
            {
              sidebarItems.map((item, index) => {
                const isActive = currentPage === item.text;
                return (
                  <>
                    {isActive ? (
                      <div key={index} className='flex-col'>
                        <div
                          onClick={() => sidebarHandler(item.text)}
                          className="relative flex items-center gap-4 relative cursor-pointer rounded-lg px-6 py-2 my-1 hover:bg-gray-200 duration-[300ms]"
                        >
                          {item.iconActive}
                        </div>
                        <div className="absolute border-b-2 mt-0.5 w-[76px] border-maincolor ">
                        </div>
                      </div>
                    ) : (
                      <div
                        key={index * 10}
                        onClick={() => sidebarHandler(item.text)}
                        className="flex items-center gap-4 relative cursor-pointer rounded-lg px-6 py-2 hover:bg-gray-100 duration-[300ms]"
                      >
                        {item.icon}
                      </div>
                    )}
                  </>

                )
              })
            }

          </div>
          <div className='w-[30%] flex items-center justify-end'>
            <div className="p-1 rounded-full h-7 w-7 bg-slate-200 flex items-center justify-center hover:bg-slate-300 mr-7"><IoLogoGameControllerA className='h-7 w-7' /></div>
            <div className="p-1 rounded-full h-7 w-7 bg-slate-200 flex items-center justify-center hover:bg-slate-300 mr-7"><IoIosSettings className='h-6 w-6' /></div>
            <div className="p-1 rounded-full h-7 w-7 bg-slate-200 flex items-center justify-center hover:bg-slate-300 mr-7" onClick={changeMode}><MdNightsStay className='h-6 w-6' /></div>
            <div
              onClick={()=>{
                setOpenCreatePost(true)
              }}
              className="p-2 rounded-full h-7 w-7 flex items-center justify-center mr-7 text-white bg-maincolor hover:bg-maincolor/70"><LuPenSquare className='h-6 w-6' /></div>
            <div className='h-10 border-r border-slate-100'></div>
          </div>
        </div>
        <div className="avatar flex items-center justify-center  w-[7%]">
          <span className='rounded-full bg-slate-200 py-1 px-2 hover:bg-slate-300 cursor-pointer text-xs' onClick={logoutHandler}>Đăng xuất</span>
        </div>
      </div>
      <CreatePost open={openCratePost} setOpen={setOpenCreatePost}/>
    </div>
  )
}

export default NavBar
