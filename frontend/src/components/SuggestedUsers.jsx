import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';

const SuggestedUsers = () => {
    const { suggestedUsers } = useSelector(store => store.auth);
    return (
        <div className='rounded-2xl px-4'>
            <div className='flex items-center justify-between text-sm'>
                <h1 className='font-semibold'>Gợi ý cho bạn</h1>
                <span className='font-medium cursor-pointer'>Xem tất cả</span>
            </div>
            {
                suggestedUsers.map((user) => {
                    return (
                        <div key={user._id} className='flex items-center justify-between my-5'>
                            <div className='flex items-center gap-2'>
                                <Link to={`/profile/${user?._id}`}>
                                    {/* <Avatar>
                                        <AvatarImage src={user?.profilePicture} alt="post_image" />
                                        <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar> */}
                                    <Avatar sx={{ width: 50, height: 50 }} alt="recommend_image" src={user?.profilePicture} />
                                </Link>
                                <div>
                                    <h1 className=' text-sm'><Link to={`/profile/${user?._id}`}>{user?.username}</Link></h1>
                                    <span className='text-gray-400 text-xs'>{user?.bio || 'Người mới...'}</span>
                                </div>
                            </div>
                            <span className='text-maincolor text-xs font-bold cursor-pointer hover:text-opacity-50 ml-7'>Theo dõi</span>
                        </div>
                    )
                })
            }

        </div>
    )
}

export default SuggestedUsers