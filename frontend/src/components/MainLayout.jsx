import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'
import Navbar from './NavBar.jsx'
import { useDispatch } from 'react-redux'
import { setIsSidebarOpen } from '@/redux/currentSlice'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // const sideBar = React.useMemo(() => <LeftSidebar sidebarOpen={sidebarOpen} toggleSidebar={updateSideBarState}/>, [sidebarOpen]);
  const dispatch = useDispatch()

  const updateSideBarState = (isOpen) => {
    if (isOpen == false) {
      if (window.innerWidth < 768) {
        setSidebarOpen(isOpen)
      }
      return
    } else {
      let state = sidebarOpen
      setSidebarOpen(!state)
    }
  }

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [window.innerWidth])

  useEffect(() => {
    dispatch(setIsSidebarOpen(sidebarOpen));
  }, [sidebarOpen])

  return (
    <div className="transition bg-[#f1f2f5]">
      <header className="fixed top-0 left-0 w-full z-20 bg-white">
        <Navbar sidebarOpen={sidebarOpen} toggleSidebar={updateSideBarState} />

      </header>

      <main className={`px-[11%]  duration-[300ms] transition-all pt-[60px] min-h-screen flex`} onClick={handleClick}>
        <div className={`w-[17%] sticky top-[60px]  mt-2 mr-2 bg-white rounded border border-gray-100 shadow-sm md:pb-[65px] md:p-1 duration-[300ms] transition-all h-[100vh]`}>
          <LeftSidebar sidebarOpen={sidebarOpen} toggleSidebar={updateSideBarState} />
        </div>
        <Outlet/>
      </main>
    </div>
  )
}

export default MainLayout