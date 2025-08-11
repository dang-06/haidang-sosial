import { setnotifications } from "@/redux/notificationSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";


const useGetNotificationRT = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(store => store.auth);
    const { notifications } = useSelector(store => store.notification);
    useEffect(() => {
        if (user) {
            // Initialize socket connection
            const socket = io(import.meta.env.VITE_SOCKET_URI, {
                query: {
                    userId: user?._id
                },
                transports: ['websocket']
            });
            socket?.on('notification', (notification) => {
                console.log(notification);
                
                dispatch(setnotifications([...notifications, notification]))
            })

            return () => {
                socket?.off('notification');
            }
        }
    }, [notifications, setnotifications]);
};
export default useGetNotificationRT;