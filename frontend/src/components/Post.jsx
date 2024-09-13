import React, { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Bookmark, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Button } from './ui/button'
import { FaHeart, FaRegHeart } from "react-icons/fa";
import CommentDialog from './CommentDialog'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'sonner'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { Badge } from './ui/badge'

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

    useEffect(() => {
        console.log(posts)
        console.log(post._id)
        console.log(marked)
    }, [marked, post])

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
            console.log(res.data);
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
            console.log(res.data);
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
    return (
        <div className='my-5 w-full mx-auto w-[550px] transition-all duration-[300ms]'>
            <div className='flex items-center justify-between mb-1 px-2 md:px-0'>
                <div className='flex items-center gap-2'>
                    <Avatar>
                        <AvatarImage src={post.author?.profilePicture} alt="post_image" />
                        <AvatarFallback>{post.author?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className='flex items-center gap-3'>
                        <span className=''>{post.author?.username}</span>
                        {user?._id === post.author._id && <Badge variant="secondary">Author</Badge>}
                    </div>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <MoreHorizontal className='cursor-pointer' />
                    </DialogTrigger>
                    <DialogContent className="flex flex-col items-center text-sm text-center">
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
            <span className='text-black text-sm px-2 md:px-0'>
                {post.caption}
            </span>
            <div className='flex bg-black md:w-[550px] max-h-[450px] md:rounded-md my-2 object-cover overflow-hidden text-center justify-center'>
            <img
                className='max-h-[450px]'
                src={post.image}
                alt="post_img"
            />
            </div>


            <div className='flex items-center justify-between my-2 px-2 md:px-0'>
                <div className='flex items-center gap-3'>
                    {
                        liked ?
                            <FaHeart
                                onClick={likeOrDislikeHandler}
                                size={'22'}
                                className="cursor-pointer text-red-600 transition-all duration-300 ease-in-out transform hover:scale-110"
                            /> :
                            <FaRegHeart
                                onClick={likeOrDislikeHandler}
                                size={'22'}
                                className="cursor-pointer hover:text-gray-600 transition-all duration-300 ease-in-out transform hover:scale-110"
                            />
                    }

                    <MessageCircle onClick={() => {
                        dispatch(setSelectedPost(post));
                        setOpen(true);
                    }} className='cursor-pointer hover:text-gray-600' />
                    <Send className='cursor-pointer hover:text-gray-600' />
                </div>
                {
                    marked ? <Bookmark onClick={bookmarkHandler} className='cursor-pointer text-yellow-600 hover:scale-110 transition-all duration-300 ease-in-out transform' /> : <Bookmark onClick={bookmarkHandler} className='cursor-pointer hover:text-gray-600 hover:scale-110 transition-all duration-300 ease-in-out transform' />
                }
            </div>
            <span className='block mb-2 px-2 md:px-0'>{postLike} likes</span>
            {
                comment.length > 0 && (
                    <span onClick={() => {
                        dispatch(setSelectedPost(post));
                        setOpen(true);
                    }} className='cursor-pointer text-sm text-gray-400 mt-2 px-2 md:px-0'>View all {comment.length} comments</span>
                )
            }
            <CommentDialog open={open} setOpen={setOpen} />
            <div className='flex items-center justify-between mt-1 px-2 md:px-0'>
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
            <hr width="100%" size="10px" align="center" className='my-5' />
        </div>
    )
}

export default Post