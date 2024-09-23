import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { readFileAsDataURL } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '@/redux/postSlice';
import { ImageList, ImageListItem } from '@mui/material';
import { AiOutlinePicture } from "react-icons/ai";

const CreatePost = ({ open, setOpen }) => {
  const imageRef = useRef();
  const [file, setFile] = useState("");
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector(store => store.auth);
  const { posts } = useSelector(store => store.post);
  const dispatch = useDispatch();

  const reset = () => {
    setCaption("")
    setFile("")
    setImagePreview([])
  }

  const fileChangeHandler = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setFile(fileArray);

      const dataUrls = await Promise.all(fileArray.map(file => readFileAsDataURL(file)));
      setImagePreview(dataUrls);
    }
  }

  const createPostHandler = async (e) => {
    const formData = new FormData();
    formData.append("caption", caption);

    if (file.length > 0) {
      file.forEach((f, idx) => {
        formData.append(`images`, f);
      });
    }

    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URI}/post/addpost`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      if (res.data.success) {
        dispatch(setPosts([res.data.post, ...posts]));
        toast.success(res.data.message);
        setOpen(false);
        reset()
      }
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={() => {
        setOpen(false)
        reset()
      }}>
        <DialogTitle>
          <VisuallyHidden>Your Title Here</VisuallyHidden>
        </DialogTitle>
        <DialogHeader className='text-center font-semibold'>Đăng bài</DialogHeader>
        <div className='flex gap-3 items-center'>
          <Avatar>
            <AvatarImage src={user?.profilePicture} alt="img" />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className='font-semibold text-xs'>{user?.username}</h1>
            <span className='text-gray-400 text-xs'>{user?.bio || 'Người mới...'}</span>
          </div>
        </div>
        <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="focus-visible:ring-transparent border-none" placeholder="Bạn đang có điều gì muốn chia sẻ với mọi người?" />
        <ImageList sx={{ width: "100%", height: "auto" }} cols={4}>
          {imagePreview?.map((img, index) => {
            return (
              <ImageListItem key={index}>
                <img
                  className='object-cover h-full w-full rounded-md'
                  src={img}
                  alt={`preview_img_${index}`}
                  loading="lazy"
                />
              </ImageListItem>
            );
          })}
        </ImageList>
        <div className='flex items-center justify-between'>
          <div className="flex flex-col items-center text-gray-400" onClick={() => imageRef.current.click()}>
            <AiOutlinePicture />
            <span className=' text-xs'>Ảnh</span>
          </div>
          <div className="py-2">
            {loading ? (
              <Button className="h-[50%] rounded-full">
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Xin chờ ...
              </Button>
            ) : (
              <Button className="h-[50%] rounded-full" onClick={createPostHandler} type="submit">Đăng</Button>
            )}
          </div>

        </div>
        <input ref={imageRef} type='file' multiple className='hidden' onChange={fileChangeHandler} />
        {/* <Button onClick={() => imageRef.current.click()} className='w-fit mx-auto bg-[#0095F6] hover:bg-[#258bcf] '>Chọn từ máy của bạn</Button> */}
        {/* {
          imagePreview && (
            loading ? (
              <Button>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Xin chờ ...
              </Button>
            ) : (
            )
          )
        } */}

      </DialogContent>
    </Dialog>
  )
}

export default CreatePost