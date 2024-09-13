import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { setSelectedUser } from '@/redux/authSlice';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Icon, MessageCircleCode } from 'lucide-react';
import Messages from './Messages';
import axios from 'axios';
import { setMessages } from '@/redux/chatSlice';
import { IoIosArrowBack } from "react-icons/io";

const ChatPage = () => {
    const [textMessage, setTextMessage] = useState("");
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const { user, suggestedUsers, selectedUser } = useSelector(store => store.auth);
    const { onlineUsers, messages } = useSelector(store => store.chat);
    const dispatch = useDispatch();

    const sendMessageHandler = async (receiverId) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URI}/message/send/${receiverId}`, { textMessage }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                dispatch(setMessages([...messages, res.data.newMessage]));
                setTextMessage("");
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        return () => {
            dispatch(setSelectedUser(null));
        }
    }, []);

    return (
        <div className='flex' style={{ height: 'calc(100vh - 60px)' }}>
            <section className='w-[100vw] md:w-1/4 py-4 border-r z-10'>
                <h1 className='mb-2 px-3 text-xl'>{user?.username}</h1>
                <hr className='mb-4 border-gray-300' />
                <div className='overflow-y-auto h-[80vh] w-[100vw]'>
                    {
                        suggestedUsers.map((suggestedUser) => {
                            const isOnline = onlineUsers.includes(suggestedUser?._id);
                            return (
                                <div key={suggestedUser?._id} onClick={() => dispatch(setSelectedUser(suggestedUser))} className='flex gap-3 items-center p-3 hover:bg-gray-50 cursor-pointer'>
                                    <Avatar className='w-14 h-14'>
                                        <AvatarImage src={suggestedUser?.profilePicture} />
                                        <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className='flex flex-col'>
                                        <span className=''>{suggestedUser?.username}</span>
                                        <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'} `}>{isOnline ? 'online' : 'offline'}</span>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>

            </section>
            {
                selectedUser ? (
                    <section className='z-20 fixed top-0 botom-0 md:static bg-white flex-1 border-l border-l-gray-300 flex flex-col h-[100vh] md:h-full w-full'>
                        <div className='flex gap-3 items-center px-3 py-2 border-b border-gray-300 sticky top-0 bg-white z-10'>
                            <IoIosArrowBack className='md:hidden w-6 h-6' onClick={() => {
                                dispatch(setSelectedUser(null));
                            }}/>
                            <Avatar>
                                <AvatarImage src={selectedUser?.profilePicture} alt='profile' />
                                <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col'>
                                <span>{selectedUser?.username}</span>
                            </div>
                        </div>
                        <Messages selectedUser={selectedUser} />
                        <div className='flex items-center p-4 border-t border-t-gray-300 relative'>
                            <Input value={textMessage} onChange={(e) => setTextMessage(e.target.value)} type="text" className='focus-visible:ring-transparent' placeholder="Messages..." />
                            <span className={`absolute right-8 test-sm cursor-pointer ${textMessage ? "text-blue-600" : "text-blue-500/75"}`}  onClick={() => sendMessageHandler(selectedUser?._id)}>Send</span>
                        </div>
                    </section>
                ) : (
                    <div className='flex flex-col items-center justify-center mx-auto'>
                        <MessageCircleCode className='w-32 h-32 my-4' />
                        <h1 className='font-medium'>Your messages</h1>
                        <span>Send a message to start a chat.</span>
                    </div>
                )
            }
        </div>
    )
}

export default ChatPage