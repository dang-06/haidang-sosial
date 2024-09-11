import { setMessages } from "@/redux/chatSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";


const useGetRTM = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(store => store.auth);
    const { messages } = useSelector(store => store.chat);
    useEffect(() => {
        if (user) {
            // Initialize socket connection
            const socket = io('http://localhost:3000', {
                query: {
                    userId: user?._id
                },
                transports: ['websocket']
            });
            socket?.on('newMessage', (newMessage) => {
                dispatch(setMessages([...messages, newMessage]));
            })

            return () => {
                socket?.off('newMessage');
            }
        }
    }, [messages, setMessages]);
};
export default useGetRTM;