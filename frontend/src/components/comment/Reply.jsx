import { formatDateHandler } from '@/lib/utils';
import { setPosts } from '@/redux/postSlice';
import { Avatar } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

const Reply = ({ reply }) => {
    const { user } = useSelector(store => store.auth);
    const [liked, setLiked] = useState(reply?.likes?.includes(user?._id) || false);
    const [replyData, setReplyData] = useState(reply);
    const [replyLike, setReplyLike] = useState(reply.likes.length);
    const { posts } = useSelector(store => store.post);
    const dispatch = useDispatch();
    const formatDate = formatDateHandler(reply?.createdAt);


    useEffect(() => {
        setReplyLike(reply.likes.length)
        setLiked(reply?.likes?.includes(user?._id) || false);
        setReplyData(reply);

    }, [reply]);

    const likeOrDislikeHandler = async () => {
        try {
            const action = liked ? 'dislike' : 'like';
            setLiked(!liked);
            const res = await axios.get(`${import.meta.env.VITE_API_URI}/post/${reply._id}/comment/${action}`, { withCredentials: true });
            if (res.data.success) {
                const updatedLikes = liked ? replyLike - 1 : replyLike + 1;
                setReplyLike(updatedLikes);
                const updatedPostData = posts.map(p => {
                    return {
                        ...p,
                        comments: p.comments.map(c => {
                            return {
                                ...c,
                                replies: c.replies.map(r => {
                                    if (r._id === reply._id) {
                                        return {
                                            ...r,
                                            likes: liked ? r.likes.filter(id => id !== user._id) : [...r.likes, user._id]
                                        }
                                    } else {
                                        return r
                                    }
                                })
                            };
                        })
                    };
                });
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            }
        } catch (error) {
            if (error) {
                setLiked(!liked);
                console.log(error);
            }
        }
    }

    return (
        <div className='my-2 pl-14  '>
            <div className='flex gap-3 items-center relative'>
                <Avatar src={replyData?.author?.profilePicture} />
                <div className="flex flex-col">
                    <span className='font-semibold text-base'>{replyData?.author.username} <span className='font-normal text-base'>{replyData?.text}</span></span>
                    <div className="flex gap-4">
                        <span className='text-xs text-gray-400'>{formatDate}</span>
                        { replyLike > 0 && <span className='text-xs text-gray-600 font-medium cursor-pointer'>{replyLike} lượt thích</span>}
                    </div>
                </div>
                <div className='flex items-center absolute right-3'>
                    {
                        liked ?
                            <FaHeart
                                onClick={likeOrDislikeHandler}
                                size={'20'}
                                className="cursor-pointer text-red-600 transition-all duration-300 ease-in-out transform hover:scale-110"
                            /> :
                            <FaRegHeart
                                onClick={likeOrDislikeHandler}
                                size={'20'}
                                className="cursor-pointer hover:text-maincolor transition-all duration-300 ease-in-out transform hover:scale-110"
                            />
                    }
                </div>
            </div>
        </div>
    )
}

export default Reply

