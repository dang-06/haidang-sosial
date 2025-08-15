import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { setSelectedUser } from '@/redux/authSlice';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ArrowLeft, Icon, MessageCircle, MessageCircleCode, MessageCircleHeart, MoreVertical, Search, Send } from 'lucide-react';
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
    const [userSuggestions, setUserSuggestions] = useState([]);

    useEffect(() => {
        const fetchUserSuggestions = async () => {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URI}/user/message`,
                {},
                { withCredentials: true }
            );
            setUserSuggestions(res.data.users || []);
        };
        fetchUserSuggestions();
    }, []);

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
        <div className="flex h-screen w-full bg-slate-50">
            {/* Sidebar */}
            <section
                className={`${selectedUser ? "hidden md:flex" : "flex"} w-full md:w-80 bg-white border-r border-slate-200 flex-col`}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-10 h-10 ring-2 ring-blue-100">
                            <AvatarImage src={user?.profilePicture || "/placeholder.svg"} />
                            <AvatarFallback className="bg-blue-500 text-white font-display font-semibold">
                                {user?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="font-display font-semibold text-slate-900">{user?.username}</h1>
                            <p className="text-sm text-slate-500">Active now</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Search */}
                    {/* <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-300 focus:ring-blue-100"
                        />
                    </div> */}
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-2">
                        {userSuggestions.map((suggestedUser) => {
                            const isOnline = onlineUsers.includes(suggestedUser?._id)
                            return (
                                <div
                                    key={suggestedUser?._id}
                                    onClick={() => dispatch(setSelectedUser(suggestedUser))}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                                >
                                    <div className="relative">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={suggestedUser?.profilePicture || "/placeholder.svg"} />
                                            <AvatarFallback className="bg-slate-200 text-slate-700 font-medium">
                                                {suggestedUser?.username?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-900 truncate">{suggestedUser?.username}</span>
                                            <span className="text-xs text-slate-500 flex-shrink-0">{suggestedUser?.timestamp}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-500 truncate">{suggestedUser?.lastMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Chat Area */}
            {selectedUser ? (
                <section className="flex-1 flex flex-col bg-white">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
                        <Button variant="ghost" size="sm" className="md:hidden -ml-2" onClick={() => setSelectedUser(null)}>
                            <ArrowLeft onClick={() => {
                                dispatch(setSelectedUser(null))
                            }} className="w-5 h-5" />
                        </Button>

                        {/* <div className="relative">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={selectedUser?.profilePicture || "/placeholder.svg"} />
                                <AvatarFallback className="bg-slate-200 text-slate-700 font-medium">
                                    {selectedUser?.username?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {onlineUsers.includes(selectedUser?._id) && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                        </div> */}

                        <div className="flex-1">
                            <h2 className="font-display font-semibold text-slate-900">{selectedUser?.username}</h2>
                            <p className="text-sm text-slate-500">
                                {onlineUsers.includes(selectedUser?._id) ? "Active now" : "Last seen recently"}
                            </p>
                        </div>

                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-6 bg-slate-50">
                        {/* <div className="flex flex-col items-center justify-center h-full text-center"> */}
                        {/* <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="font-display font-semibold text-slate-900 mb-2">Start a conversation</h3>
                            <p className="text-slate-500 max-w-sm">Send a message to {selectedUser?.username} to begin your chat.</p> */}
                        <Messages selectedUser={selectedUser} />
                        {/* </div> */}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    value={textMessage}
                                    onChange={(e) => setTextMessage(e.target.value)}
                                    placeholder={`Message ${selectedUser?.username}...`}
                                    className="pr-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-300 focus:ring-blue-100"
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            sendMessageHandler(selectedUser?._id)
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${textMessage.trim() ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50" : "text-slate-400"
                                        }`}
                                    onClick={() => sendMessageHandler(selectedUser?._id)}
                                    disabled={!textMessage.trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50 text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                        <MessageCircle className="w-12 h-12 text-blue-500" />
                    </div>
                    <h2 className="font-display font-semibold text-xl text-slate-900 mb-2">Your Messages</h2>
                    <p className="text-slate-500 max-w-sm">
                        Select a conversation from the sidebar to start chatting with your contacts.
                    </p>
                </div>
            )}
        </div>
    )
}

export default ChatPage