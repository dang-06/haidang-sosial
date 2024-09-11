import React from 'react'
import { Outlet } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

const MainLayout = () => {
  return (
    <div>
         <LeftSidebar/>
        <div className='ml-[272px]'>
            <Outlet/>
        </div>
    </div>
  )
}

export default MainLayout