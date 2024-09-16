import { setSuggestedUsers } from "@/redux/authSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";


const useGetAllUsers = ({username,setUsers}) => {
    const dispatch = useDispatch();
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URI}/user/all-users?username=${username}&&limit=7`, { withCredentials: true });
                if (res.data.success) { 
                    setUsers(res.data.users);
                }
            } catch (error) {
                console.log(error);
            }
        }
        if (username) {
            fetchAllUsers();
        }
        
    }, [username,dispatch]);
};
export default useGetAllUsers;