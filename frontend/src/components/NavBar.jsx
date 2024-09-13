import React, { useEffect } from 'react'
import { RiMenuLine } from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useSelector } from 'react-redux';




const NavBar = ({ sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation()
  const { user } = useSelector(store => store.auth);
  const routeChange = () => {
    navigate('path');
  }
  return (
    <div className='v2 bg-neutral-background pointer-events-auto border-solid border-0 border-b border-neutral-border px-md h-[60px]'>
      <div className="flex justify-between item-center" onClick={() => toggleSidebar(false)}>
        <div className="text-center bg-white flex">
          <RiMenuLine className="text-danger h-[59px] min-w-[21px] ml-3 md:ml-9 mr-[20px] z-10 cursor-pointer" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
          }} />
          <img
            className="ml-3 block h-[59px] w-auto"
            src="/2.png"
            alt="logo"
            onClick={routeChange}
          />
        </div>
        <div className="searchSection flex items-center justify-center w-1/3 hidden md:flex">
          <div className=" relative flex items-center h-[35px] w-full" >
            <IoSearch className="absolute h-6 w-6 mr-8 left-[12px] top-[7px] text-[#666]" aria-hidden="true" />
            <input type="search" placeholder={`Search`} className="text-[#666] overflow-hidden rounded-3xl h-[40px] pl-[50px] pr-3 flex-1 bg-gray-100 outline-none border-0 bg-[#f7f7f7] focus:bg-[#fff] focus:shadow" />
          </div>
        </div>
        <div className="avatar flex items-center justify-center pr-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profilePicture} alt="post_image" />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  )
}

export default NavBar
