import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import { followOrUnfollow } from '@/api/apiService';
import { setSuggestedUsers } from '@/redux/authSlice';

const SuggestedUsers = () => {
    const { suggestedUsers } = useSelector(store => store.auth);
    const [followed, setFollowed] = useState([])
    const dispatch = useDispatch()

    const followHandle = async (userId) => {
        try {
            setFollowed((prev) => [...prev,userId])
            const res = await followOrUnfollow(userId)
        } catch (error) {
            console.log(error);
            setFollowed((prev) => prev.filter((_id) => _id != userId))
        }
    }

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
                                    <Avatar sx={{ width: 45, height: 45 }} alt="recommend_image" src={user?.profilePicture} />
                                </Link>
                                <div>
                                    <h1 className=' text-sm'><Link to={`/profile/${user?._id}`}>{user?.username}</Link></h1>
                                    <span className='text-gray-400 text-xs line-clamp-1'>{user?.bio || 'Người mới...'}</span>
                                </div>
                            </div>
                            { followed.includes(user?._id) ? 
                            <span className='text-gray-600 text-xs font-bold cursor-pointer'>Đã theo dõi</span>
                            :
                            <span onClick={() => followHandle(user?._id)} className='text-maincolor text-xs font-bold cursor-pointer hover:text-opacity-50'>Theo dõi</span>
                            }
                        </div>
                    )
                })
            }

        </div>
    )
}

export default SuggestedUsers