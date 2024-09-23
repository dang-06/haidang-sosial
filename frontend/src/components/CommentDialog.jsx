import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { Button } from './ui/button'
import { useDispatch, useSelector } from 'react-redux'
import Comment from './Comment'
import axios from 'axios'
import { toast } from 'sonner'
import { setPosts } from '@/redux/postSlice'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'
import { Avatar } from '@mui/material'

const CommentDialog = ({ open, setOpen }) => {
  const [text, setText] = useState("");
  const { selectedPost, posts } = useSelector(store => store.post);
  const [comment, setComment] = useState([]);
  const dispatch = useDispatch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [img, setImg] = useState(selectedPost?.image?.[0] || '');
  const [isLast, setIsLast] = useState(false);
  const [isFirst, setIsFirst] = useState(true);
  const [formatDate, setFormatDate] = useState("");




  useEffect(() => {
    if (selectedPost) {
      setComment(selectedPost.comments);
      setImg(selectedPost.image[0]);
      setComment(selectedPost.comments);
      setCurrentIndex(0);
      setIsFirst(true)
      setIsLast(selectedPost.image.length === 1);
    }
    const date = new Date(selectedPost?.updatedAt);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const formattedDate = `${hours}:${minutes} ${day}-${month}`;
    setFormatDate(formattedDate)

  }, [selectedPost]);

  const changeEventHandler = (e) => {
    const inputText = e.target.value;
    if (inputText.trim()) {
      setText(inputText);
    } else {
      setText("");
    }
  }

  const handleNextImage = () => {
    const nextIndex = (currentIndex + 1);
    setCurrentIndex(nextIndex);
    setImg(selectedPost.image[nextIndex]);
  };

  const handlePrevImage = () => {
    const prevIndex = (currentIndex - 1);
    setCurrentIndex(prevIndex);
    setImg(selectedPost.image[prevIndex]);
  };

  useEffect(() => {
    if (selectedPost?.image?.length === 1) {
      setIsLast(true)
      setIsFirst(true)
    } else if (currentIndex == 0) {
      setIsFirst(true)
    } else if (currentIndex == selectedPost.image.length - 1) {
      setIsLast(true)
    } else {
      setIsLast(false)
      setIsFirst(false)
    }
  }, [currentIndex, img, selectedPost])

  const sendMessageHandler = async () => {

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URI}/post/${selectedPost?._id}/comment`, { text }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (res.data.success) {
        const updatedCommentData = [...comment, res.data.comment];
        setComment(updatedCommentData);

        const updatedPostData = posts.map(p =>
          p._id === selectedPost._id ? { ...p, comments: updatedCommentData } : p
        );
        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message);
        setText("");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (selectedPost?.image[currentIndex + 1]) {
      const nextImg = new Image();
      nextImg.src = selectedPost?.image[currentIndex + 1];
    }

    if (selectedPost?.image[currentIndex - 1]) {
      const prevImg = new Image();
      prevImg.src = selectedPost?.image[currentIndex - 1];
    }
  }, [currentIndex]);

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={() => setOpen(false)} className="max-w-5xl p-0 flex flex-col">
        <div className='flex flex-1 w-auto'>
          {selectedPost?.image?.length > 0 && <div className='w-1/2 hidden md:flex justify-center relative'>
            <img
              src={img}
              alt="post_img"
              className='w-auto max-h-[90vh] object-cover rounded-lg'
            />
            {!isFirst && <button onClick={handlePrevImage} className="p-2 rounded-full absolute top-[50%] left-3 bg-white/75 z-10 text-gray-800">
              <FaAngleLeft />
            </button>}
            {!isLast && < button onClick={handleNextImage} className="p-2 rounded-full absolute top-[50%] right-3 bg-white/75 z-10 text-gray-800">
              <FaAngleRight />
            </button>}

          </div>}
          <div className={`${selectedPost?.image?.length > 0 ? "w-full md:w-1/2" : "w-full"} flex flex-col border-l`}>
            <div className='flex items-center justify-between px-4 py-2'>
              {/* <div className='flex gap-3 items-center'>
                <Link>
                  <Avatar>
                    <AvatarImage src={selectedPost?.author?.profilePicture} />
                    <AvatarFallback>{selectedPost?.author?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link className='font-semibold text-xs'>{selectedPost?.author?.username}</Link>
                </div>
              </div> */}
              <div className='flex items-center gap-2'>
                <Avatar sx={{ width: 48, height: 48 }} alt="post_image" src={selectedPost?.author?.profilePicture} />
                <div className='flex flex-col '>
                  <span className='font-semibold text-base'>{selectedPost?.author?.username}</span>
                  <span className='text-xs text-gray-400'>{formatDate}</span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <MoreHorizontal className='cursor-pointer' />
                </DialogTrigger>
                <DialogContent className="flex flex-col items-center text-sm text-center">
                  <div className='cursor-pointer w-full text-[#ED4956] font-bold'>
                    Bỏ theo dõi
                  </div>
                  <div className='cursor-pointer w-full'>
                    Thêm vào danh sách yêu thích
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div>
              <span className='px-4 line-clamp-3'>{selectedPost?.caption}</span>
              <hr />
            </div>
            <div className='flex-1 overflow-y-auto p-4'>
              {
                comment.map((comment) => <Comment key={comment._id} comment={comment} />)
              }
            </div>
            <div className='p-4'>
              <div className='flex items-center gap-2'>
                <input
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && text.trim()) {
                      sendMessageHandler();
                    }
                  }}
                  type="text" value={text} onChange={changeEventHandler} placeholder='Add a comment...' className='w-full outline-none border text-sm border-gray-300 p-2 relative rounded' />
                <Button className="absolute right-5 border-none h-5 text-maincolor hover:bg-white" disabled={!text.trim()} onClick={sendMessageHandler} variant="outline">Đăng</Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog >
  )
}

export default CommentDialog