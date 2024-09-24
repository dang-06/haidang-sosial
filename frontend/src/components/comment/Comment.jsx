import { setPosts } from '@/redux/postSlice';
import { Avatar } from '@mui/material'
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import Reply from './Reply';
import { formatDateHandler } from '@/lib/utils';
import { parseMentions } from '@/lib/utils/mentionParser';

const Comment = ({ comment }) => {
    const [openReply, setOpenReply] = useState(false);
    const { user } = useSelector(store => store.auth);
    const [liked, setLiked] = useState(comment?.likes?.includes(user?._id) || false);
    const [commentLike, setCommentLike] = useState(comment.likes.length);
    const [commentReplies, setCommentReplies] = useState(comment?.replies.length);
    const [replies, setReplies] = useState(comment?.replies);
    const { posts } = useSelector(store => store.post);
    const formatDate = formatDateHandler(comment?.createdAt);
    const dispatch = useDispatch();


    useEffect(() => {
        setCommentLike(comment?.likes.length)
        setLiked(comment?.likes?.includes(user?._id) || false);
        setCommentReplies(comment?.replies.length)
        setReplies(comment?.replies)
    }, [comment]);

    const likeOrDislikeHandler = async () => {
        try {
            const action = liked ? 'dislike' : 'like';
            setLiked(!liked);
            const res = await axios.get(`${import.meta.env.VITE_API_URI}/post/${comment._id}/comment/${action}`, { withCredentials: true });
            if (res.data.success) {
                const updatedLikes = liked ? commentLike - 1 : commentLike + 1;
                setCommentLike(updatedLikes);
                const updatedPostData = posts.map(p => {
                    return {
                        ...p,
                        comments: p.comments.map(c => {
                            if (c._id === comment._id) {
                                return {
                                    ...c,
                                    likes: liked
                                        ? c.likes.filter(id => id !== user._id)
                                        : [...c.likes, user._id]
                                };
                            } else {
                                return c;
                            }
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
        <div className='my-4'>
            <div className='flex gap-3 items-center relative'>
                <Avatar src={comment?.author?.profilePicture} />
                <div className="flex flex-col">
                    <span className='font-semibold text-base'>{comment?.author.username} <span className='font-normal text-base'>{parseMentions(comment?.text)}</span></span>
                    <div className="flex gap-4">
                        <span className='text-xs text-gray-400'>{formatDate}</span>
                        { commentLike > 0 && <span className='text-xs text-gray-600 font-medium cursor-pointer'>{commentLike} lượt thích</span>}
                        <span className='text-xs text-gray-600 font-medium cursor-pointer'>Trả lời</span>
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
            {commentReplies > 0 && <div className="flex gap-2 items-center pl-14 pt-3">
                <hr className='w-8' />
                {openReply ? <span className='text-xs text-gray-600 font-medium cursor-pointer' onClick={()=>{setOpenReply(false)}}>Ẩn câu trả lời</span>
                    : <span className='text-xs text-gray-600 font-medium cursor-pointer' onClick={()=>{setOpenReply(true)}}>Xem ({commentReplies}) câu trả lời</span>
                }
            </div>}
            {openReply &&
                replies.map(r => <Reply key={r._id} reply={r} />)
            }
        </div>
    )
}

export default Comment