import useGetSuggestedUsers from '@/hooks/useGetSuggestedUsers';
import React from 'react'
import { Outlet } from 'react-router-dom';
import RightSidebar from '../RightSidebar';
import Notification from './Notification.jsx';

const NotificationLayout = () => {
    useGetSuggestedUsers();
    return (
        <div className='flex w-[83%]  mt-2'>
            <div className='mr-2 w-[75%] rounded border border-gray-100 shadow-sm'>
                <Notification/>
            </div>
            <RightSidebar className='bg-white'/>
        </div>
    )
}

export default NotificationLayout
