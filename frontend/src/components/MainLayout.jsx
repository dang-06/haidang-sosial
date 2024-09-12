import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'
import Navbar from './NavBar.jsx'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sideBar = React.useMemo(() => <LeftSidebar sidebarOpen={sidebarOpen} />, [sidebarOpen]);

  const updateSideBarState = () => {
      let state = sidebarOpen
      setSidebarOpen(!state)
  }

  return (
    <div className="bg-0 transition overflow-hidden">
      <header className="fixed top-0 left-0 w-full z-20 bg-white">
        <Navbar sidebarOpen={sidebarOpen} toggleSidebar={updateSideBarState} />
        <div className={`${sidebarOpen ? "w-[250px]" : "w-[85px]"} top-[60px] pb-[65px] bottom-0 p-2 bg-white fixed left-0 h-full overflow-x-hidden overflow-y-auto duration-[300ms] transition-all border-r border-gray-300`}>
          {sideBar}
        </div>
      </header>

      <main className="ml-[250px] duration-[300ms] transition-all pt-[60px] min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout