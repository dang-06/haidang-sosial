import { setPosts } from "@/redux/postSlice";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

const useGetAllPost = ({ page }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchAllPost = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URI}/post/all?page=${page}`,
                    { withCredentials: true }
                );

                if (res.data.success) {
                    dispatch(setPosts(res.data.posts));
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchAllPost();
    }, [page,dispatch]);
};

export default useGetAllPost;
