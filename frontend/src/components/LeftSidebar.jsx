import { Heart, Home, InboxIcon, LogOut, MailIcon, MessageCircle, PlusSquare, Search, SendIcon, TrendingUp } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { LuDot } from 'react-icons/lu'
import { FaRegSave, FaRegShareSquare, FaRegStar } from 'react-icons/fa'
import { MdOutlineWatchLater } from 'react-icons/md'

const LeftSidebar = ({ sidebarOpen, toggleSidebar }) => {
    const navigate = useNavigate();
    const { user, userProfile } = useSelector(store => store.auth);
    const { likeNotification } = useSelector(store => store.realTimeNotification);
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const { currentPage } = useSelector(store => store.current)

    const location = useLocation();
    const path = location.pathname;
    const handleClick = () => {
        setOpen(!open);
    };

    useEffect(() => {
        console.log(userProfile);

    })


    const sidebarItems = [
        { icon: <FaRegStar />, text: "Nhiều tương tác" },
        { icon: <MdOutlineWatchLater />, text: "Mới nhất" },
        { icon: <FaRegSave />, text: "Đã lưu" },
        { icon: <FaRegShareSquare />, text: "Chia sẻ lại" },
    ]

    const group = [
        { img: userProfile?.profilePicture, text: "Gym tại nhà" },
        { img: userProfile?.profilePicture, text: "Bài tập Công nghệ thông tin" },
        { img: userProfile?.profilePicture, text: "Công đồng lập trình Web Việt Nam" },
        { img: userProfile?.profilePicture, text: "Tìm việc làm IT" },
    ]


    return (
        <>
            <div className=''>
                <div className='px-1 py-3'>
                    <span className='py-2 text-xl font-semibold'>Dành cho bạn</span>
                </div>
                {sidebarItems.map((item, index) => {
                    return (
                        <div key={index} className='cursor-pointer rounded py-2 pr-1 pl-2 flex items-center gap-3 text-lg text-gray-800 hover:bg-slate-200 hover:bg-opacity-50'>
                            {item.icon}
                            <span className="truncate max-w-[150px] text-sm">
                                {item.text}
                            </span>
                        </div>
                    )
                })}
                <hr className='my-3' />
                {/* <div className='px-1 py-2'>
                    <span className='py-2 text-lg font-medium text-gray-800'>Nhóm của bạn</span>

                </div>
                {group.map((item, index) => {
                    return (
                        <div key={index} className='cursor-pointer rounded py-1 px-1 max-h-20 flex items-center gap-3 text-base text-gray-800 hover:bg-slate-200 hover:bg-opacity-50'>
                            <img src={item.img} alt="" className='rounded-lg h-6 w-6' />
                            <span className="line-clamp-2 text-sm">
                                {item.text}
                            </span>
                        </div>
                    )
                })} */}
            </div>
        </>
    )
}

export default LeftSidebar