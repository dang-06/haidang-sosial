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





const NavBar = ({ sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation()
  const { user } = useSelector(store => store.auth);
  const { currentPage, mode } = useSelector(store => store.current)
  const path = location.pathname;
  const dispatch = useDispatch()

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
    { icon: <IoHomeOutline className='h-9 w-9' />, iconActive: <IoHome className='text-maincolor h-9 w-9' />, text: "Trang chủ" },
    { icon: <MdOutlineExplore className='h-9 w-9' />, iconActive: <MdExplore className='text-maincolor h-9 w-9' />, text: "Xu hướng" },
    { icon: <PiVideoLight className='h-10 w-10' />, iconActive: <PiVideoDuotone className='text-maincolor h-10 w-10' />, text: "Video" },
    { icon: <IoIosNotificationsOutline className='h-10 w-10' />, iconActive: <IoMdNotifications className='text-maincolor h-10 w-10' />, text: "Thông báo" },
    {
      icon: <Tooltip title="Account"><AVT sx={{ width: 38, height: 38 }}>N</AVT></Tooltip>,
      iconActive: <Tooltip title="Account"><AVT className='text-maincolor' sx={{ width: 38, height: 38 }}>N</AVT></Tooltip>, text: "Trang cá nhân"
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
    <div className='v2 bg-neutral-background pointer-events-auto px-md h-[75px] duration-[300ms] transition-all'>
      <div className="flex justify-center items-center px-[10%] 2xl:px-[85px]  border-t-2 border-maincolor h-full" onClick={() => toggleSidebar(false)}>
        <div className="text-center bg-white flex mx-6 w-[10%]">
          <RiMenuLine className=" md:hidden text-danger h-[73px] min-w-[21px] ml-3 md:ml-9 mr-[20px] z-10 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSidebar();
            }} />
          <img
            className="ml-3 block h-[72px] w-auto py-3 px-1"
            src="/newLogo.png"
            alt="logo"
            onClick={routeChange}
          />
        </div>
        <div className='flex items-center justify-between w-[80%] h-[74px] py-3'>
          <div className=" mx-8 searchSection flex items-center justify-center hidden lg:flex w-[20%]">
            <SearchOptions />
          </div>
          <div className="flex items-center justify-around w-[50%] pl-5">
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
                        <div className="absolute border-b-4 mt-1 w-[84px] border-maincolor ">
                        </div>
                      </div>
                    ) : (
                      <div
                        key={index*10}
                        onClick={() => sidebarHandler(item.text)}
                        className="flex items-center gap-4 relative cursor-pointer rounded-lg px-6 py-2 my-1 hover:bg-gray-100 duration-[300ms]"
                      >
                        {item.icon}
                      </div>
                    )}
                  </>

                )
              })
            }

          </div>
          <div className='w-[30%] flex items-center justify-end mr-10'>
            <div className="p-1 rounded-full h-10 w-10 bg-slate-200 flex items-center justify-center hover:bg-slate-300 mr-7"><IoLogoGameControllerA className='h-7 w-7' /></div>
            <div className="p-1 rounded-full h-10 w-10 bg-slate-200 flex items-center justify-center hover:bg-slate-300 mr-7"><IoIosSettings className='h-6 w-6' /></div>
            <div className="p-1 rounded-full h-10 w-10 bg-slate-200 flex items-center justify-center hover:bg-slate-300 mr-7" onClick={changeMode}><MdNightsStay className='h-6 w-6' /></div>
            <div className="p-1 rounded-full h-10 w-10 flex items-center justify-center mr-7 text-white bg-maincolor hover:bg-maincolor/70"><LuPenSquare className='h-6 w-6' /></div>
            <div className='h-10 border-r border-slate-100'></div>
          </div>
        </div>
        <div className="avatar flex items-center justify-center  w-[10%]">
          <span className='rounded-full bg-slate-200 py-2 px-4 hover:bg-slate-300 cursor-pointer' onClick={logoutHandler}>Đăng xuất</span>
        </div>
      </div>
    </div>
  )
}

export default NavBar
