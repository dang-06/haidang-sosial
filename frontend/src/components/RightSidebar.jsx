import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import SuggestedUsers from './SuggestedUsers';

const RightSidebar = () => {
  const { user } = useSelector(store => store.auth);
  return (
    <div className='pt-2 hidden xl:block bg-white w-[27%] rounded h-fit border border-gray-100 shadow-sm sticky top-[60px]'>
      {/* <div className='flex items-center gap-2'>
        <Link to={`/profile/${user?._id}`}>
          <Avatar>
            <AvatarImage src={user?.profilePicture} alt="post_image" />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <h1 className='font-semibold text-sm'><Link to={`/profile/${user?._id}`}>{user?.username}</Link></h1>
          <span className='text-gray-600 text-xs'>{user?.bio || '...'}</span>
        </div>
      </div> */}
      <SuggestedUsers/>
    </div>
  )
}

export default RightSidebar