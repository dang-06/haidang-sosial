import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'
import Navbar from './NavBar.jsx'
import { useDispatch } from 'react-redux'
import { setIsSidebarOpen} from '@/redux/currentSlice'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // const sideBar = React.useMemo(() => <LeftSidebar sidebarOpen={sidebarOpen} toggleSidebar={updateSideBarState}/>, [sidebarOpen]);
  const dispatch = useDispatch()

  const updateSideBarState = (isOpen) => {
    if (isOpen ==false) {
      if (window.innerWidth < 768){
        setSidebarOpen(isOpen)
      }
      return
    } else{
      let state = sidebarOpen
      setSidebarOpen(!state)
    }
  }

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(()=>{
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  },[window.innerWidth])

  useEffect(()=>{
    dispatch(setIsSidebarOpen(sidebarOpen));
  },[sidebarOpen])

  return (
    <div className="transition overflow-hidden bg-[#f1f2f5]">
      <header className="fixed top-0 left-0 w-full z-20 bg-white">
        <Navbar sidebarOpen={sidebarOpen} toggleSidebar={updateSideBarState} />
        {/* <div className={`${sidebarOpen ? "md:w-[250px]" : "md:w-[85px] w-0"} top-[60px] md:pb-[65px] bottom-0 md:p-2 bg-white fixed left-0 h-full overflow-x-hidden overflow-y-auto duration-[300ms] transition-all border-r border-gray-300`}>
          <LeftSidebar sidebarOpen={sidebarOpen} toggleSidebar={updateSideBarState}/>
        </div> */}
      </header>

      <main className={`${sidebarOpen ? "md:ml-[85px] lg:ml-[250px]" : "md:ml-[85px] lg:ml-[85px]"} duration-[300ms] transition-all pt-[75px] min-h-screen`} onClick={handleClick}>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout