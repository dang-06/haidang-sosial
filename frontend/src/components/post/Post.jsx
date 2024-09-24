import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog'
import { Bookmark, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Button } from '../ui/button'
import { FaHeart, FaRegHeart } from "react-icons/fa";
import CommentDialog from '../comment/CommentDialog'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'sonner'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { Badge } from '../ui/badge'
import Avatar from '@mui/material/Avatar';
import { ImageList, ImageListItem } from '@mui/material';
import { formatDateHandler } from '@/lib/utils';
import { Female } from '@mui/icons-material';

const Post = ({ post }) => {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const { user } = useSelector(store => store.auth);
    const { posts } = useSelector(store => store.post);
    const [liked, setLiked] = useState(post.likes.includes(user?._id) || false);
    const [marked, setMarked] = useState(post.bookmarks?.includes(user?._id) || false);
    const [postLike, setPostLike] = useState(post.likes.length);
    const [comment, setComment] = useState(post.comments);
    const dispatch = useDispatch();
    const [formatDate, setFormatDate] = useState("");

    // const formatDate = formatDateHandler(post.createdAt);

    const changeEventHandler = (e) => {
        const inputText = e.target.value;
        if (inputText.trim()) {
            setText(inputText);
        } else {
            setText("");
        }
    }

    const likeOrDislikeHandler = async () => {
        try {
            const action = liked ? 'dislike' : 'like';
            setLiked(!liked);
            const res = await axios.get(`${import.meta.env.VITE_API_URI}/post/${post._id}/${action}`, { withCredentials: true });
            if (res.data.success) {
                const updatedLikes = liked ? postLike - 1 : postLike + 1;
                setPostLike(updatedLikes);
                const updatedPostData = posts.map(p =>
                    p._id === post._id ? {
                        ...p,
                        likes: liked ? p.likes.filter(id => id !== user._id) : [...p.likes, user._id]
                    } : p
                );
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

    const commentHandler = async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URI}/post/${post._id}/comment`, { text }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                const updatedCommentData = [...comment, res.data.comment];
                setComment(updatedCommentData);

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? { ...p, comments: updatedCommentData } : p
                );

                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
                setText("");
            }
        } catch (error) {
            console.log(error);
        }
    }

    const deletePostHandler = async () => {
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URI}/post/delete/${post?._id}`, { withCredentials: true })
            if (res.data.success) {
                const updatedPostData = posts.filter((postItem) => postItem?._id !== post?._id);
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.messsage);
        }
    }

    const bookmarkHandler = async () => {
        try {
            setMarked(!marked)
            const res = await axios.get(`${import.meta.env.VITE_API_URI}/post/${post?._id}/bookmark`, { withCredentials: true });
            if (res.data.success) {
                setMarked(!marked)
                toast.success(res.data.message);
            }
        } catch (error) {
            setMarked(!marked)
            console.log(error);
        }
    }

    useEffect(() => {
        setComment(post.comments)
        const formatted = formatDateHandler(post.createdAt);
        setFormatDate(formatted);
    }, [post])
    return (
        <div className='mb-2 bg-white'>
            <div className='w-full mx-auto transition-all duration-[300ms] pt-4 px-5'>
                <div className='flex items-center justify-between mb-1 px-2 md:px-0'>
                    <div className='flex items-center gap-2'>
                        <Avatar sx={{ width: 50, height: 50 }} alt="post_image" src={post.author?.profilePicture} />
                        <div className='flex flex-col '>
                            <span className='font-semibold text-base'>{post.author?.username}</span>
                            {/* {user?._id === post.author._id && <Badge variant="secondary">Author</Badge>} */}
                            <div className="flex gap-2">
                                <span className='text-xs text-gray-600'>{formatDate}</span>
                                <span className='text-xs text-gray-600'>{post.author?.followers?.length || "0"} người theo dõi {post.author?.gender == "female" ? "cô ấy" : "anh ấy"}</span>
                            </div>
                        </div>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <MoreHorizontal className='cursor-pointer' />
                        </DialogTrigger>
                        <DialogContent className="flex flex-col items-center text-sm text-center bg-white">
                            {
                                post?.author?._id !== user?._id && <Button variant='ghost' className="cursor-pointer w-fit text-[#ED4956] font-bold">Unfollow</Button>
                            }

                            <Button variant='ghost' className="cursor-pointer w-fit">Add to favorites</Button>
                            {
                                user && user?._id === post?.author._id && <Button onClick={deletePostHandler} variant='ghost' className="cursor-pointer w-fit">Delete</Button>
                            }
                        </DialogContent>
                    </Dialog>
                </div>

                <div className='pl-[60px]'>
                    <span className='text-gray-900'>
                        {post.caption}
                    </span>
                    {post.image?.length == 1 ?
                        <img
                            className='rounded-lg w-auto max-h-[230px] mt-2 object-cover overflow-hidden'
                            src={post.image}
                            alt="post_img"
                            onClick={() => {
                                dispatch(setSelectedPost(post));
                                setOpen(true);
                            }}
                        />
                        :
                        <ImageList sx={{ width: '100%', height: '100%' }} cols={4} rowHeight={170}>
                            {post.image?.map((item, index) => (
                                <ImageListItem key={index}>
                                    <img
                                        className='rounded-lg w-auto max-h-[230px] mt-2 object-cover overflow-hidden'
                                        srcSet={`${item}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                                        src={`${item}?w=164&h=164&fit=crop&auto=format`}
                                        loading="lazy"
                                        onClick={() => {
                                            dispatch(setSelectedPost(post));
                                            setOpen(true);
                                        }}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>

                    }

                </div>



                {/* <span className='block mb-2 px-2 md:px-0'>{postLike} likes</span>
                {
                    comment.length > 0 && (
                        <span onClick={() => {
                            dispatch(setSelectedPost(post));
                            setOpen(true);
                        }} className='cursor-pointer text-sm text-gray-400 mt-2 px-2 md:px-0'>View all {comment.length} comments</span>
                    )
                } */}
                <CommentDialog open={open} setOpen={setOpen} />
                {/* <div className='flex items-center justify-between mt-1 px-2 md:px-0'>
                    <input
                        type="text"
                        placeholder='Add a comment...'
                        value={text}
                        onChange={changeEventHandler}
                        className='outline-none text-sm w-full'
                    />
                    {
                        text && <span onClick={commentHandler} className='text-[#3BADF8] cursor-pointer'>Post</span>
                    }

                </div>
                <hr width="100%" size="10px" align="center" className='my-5' /> */}
            </div>
            <div className='flex items-center justify-between px-16 py-3 text-gray-600'>
                <div className='flex items-center gap-2'>
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
                    <span className='text-gray-600'>{postLike}</span>
                </div>
                <div className='flex items-center gap-2'>
                    <MessageCircle size={'20'} onClick={() => {
                        dispatch(setSelectedPost(post));
                        setOpen(true);
                    }} className='cursor-pointer hover:text-maincolor' />
                    <span className='text-gray-600'>{comment.length}</span>
                </div>
                <Send size={'20'} className='cursor-pointer hover:text-maincolor' />
                {
                    marked ? <Bookmark size={'20'} onClick={bookmarkHandler} className='cursor-pointer text-yellow-600 transition-all duration-300 ease-in-out transform' /> : <Bookmark onClick={bookmarkHandler} className='cursor-pointer hover:text-gray-600 transition-all duration-300 ease-in-out transform hover:text-maincolor' />
                }
            </div>
        </div>
    )
}

export default Post