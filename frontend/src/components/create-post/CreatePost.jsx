import React, { useRef, useState } from 'react';
import { Modal, Box, Avatar } from '@mui/material';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { readFileAsDataURL } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '@/redux/postSlice';
import { ImageList, ImageListItem } from '@mui/material';
import { AiOutlinePicture } from "react-icons/ai";
import TriggersInput from '../ui/StriggersInput';
import TriggersInputPost from '../ui/StriggersInputPost';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const CreatePost = ({ open, setOpen }) => {
  const imageRef = useRef();
  const [file, setFile] = useState([]);
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector(store => store.auth);
  const { posts } = useSelector(store => store.post);
  const dispatch = useDispatch();

  const reset = () => {
    setCaption("");
    setFile([]);
    setImagePreview([]);
  };

  const fileChangeHandler = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setFile(fileArray);

      const dataUrls = await Promise.all(fileArray.map(file => readFileAsDataURL(file)));
      setImagePreview(dataUrls);
    }
  };

  const createPostHandler = async (e) => {
    const formData = new FormData();
    formData.append("caption", caption);

    if (file.length > 0) {
      file.forEach((f) => {
        formData.append("images", f);
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
        reset();
      }
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { setOpen(false); reset(); }}>
      <Box sx={style}>
        <VisuallyHidden>Your Title Here</VisuallyHidden>
        <h2 className='text-center font-semibold'>Đăng bài</h2>
        <div className='flex gap-3 items-center'>
          <Avatar src={user?.profilePicture} alt="img" />
          <div>
            <h1 className='font-semibold text-xs'>{user?.username}</h1>
            <span className='text-gray-400 text-xs'>{user?.bio || 'Người mới...'}</span>
          </div>
        </div>
        {/* <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="focus-visible:ring-transparent border-none" placeholder="Bạn đang có điều gì muốn chia sẻ với mọi người?" /> */}
        <TriggersInputPost setText={setCaption} />
        <ImageList
          sx={{ width: "100%", height: "auto", maxHeight: "60vh" }}
          cols={imagePreview.length === 9 ? 3 : 4}
        >
          {imagePreview?.map((img, index) => (
            <ImageListItem key={index}>
              <img
                className='object-contain h-auto w-auto rounded-md'
                src={img}
                alt={`preview_img_${index}`}
                loading="lazy"
              />
            </ImageListItem>
          ))}
        </ImageList>
        <div className='flex items-center justify-between'>
          <div className="flex flex-col items-center text-gray-400" onClick={() => imageRef.current.click()}>
            <AiOutlinePicture />
            <span className='text-xs'>Ảnh</span>
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
      </Box>
    </Modal>
  );
};

export default CreatePost;
