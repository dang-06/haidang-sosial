import React from 'react'
import Feed from './Feed'
import { Outlet } from 'react-router-dom'
import RightSidebar from './RightSidebar'
import useGetAllPost from '@/hooks/useGetAllPost'
import useGetSuggestedUsers from '@/hooks/useGetSuggestedUsers'

const Home = () => {
    useGetAllPost();
    useGetSuggestedUsers();
    return (
        <div className='flex w-[83%]  mt-2'>
            <div className='mr-2 w-[75%] rounded border border-gray-100 shadow-sm'>
                <Feed/>
                <Outlet />
            </div>
            <RightSidebar className='bg-white'/>
        </div>
    )
}

export default Home