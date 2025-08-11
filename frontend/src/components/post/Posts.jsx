import React, { useEffect, useRef, useState } from 'react'
import Post from './Post'
import { useDispatch, useSelector } from 'react-redux'
import * as Select from '@radix-ui/react-select';
import { FaChevronDown } from "react-icons/fa";
import { getPost } from '@/api/apiService';
import { setPosts } from "@/redux/postSlice";
import { Loader2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PiEmptyFill } from 'react-icons/pi';
import { RiErrorWarningFill } from 'react-icons/ri';
import { Skeleton } from '@mui/material';

const Posts = () => {
  const { posts } = useSelector(store => store.post);
  const [selectedSort, setSelectedSort] = useState('best');
  const [renderPosts, setRenderPosts] = useState(posts || [])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)
  const [total, setTotal] = useState(0)
  const dispatch = useDispatch()
  const observer = useRef()
  const location = useLocation();
  const navigate = useNavigate();
  const { text } = useParams();
  const lastElementRef = (node) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prevPage) => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }

  const fetchPosts = async (type = '', sortBy = '') => {
    try {
      setLoading(true);
      const res = await getPost(page, type, sortBy);
      if (res.success) {
        setRenderPosts(res.posts);
        setTotal(res.total)
        dispatch(setPosts(res.posts));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let type, sortBy = ''
    if (location.pathname.includes('hot')) {
      type = 'hot'
      sortBy = text
    }
    else sortBy = text
    if (renderPosts.length != total) {
      fetchPosts(type, sortBy);
    }

    console.log(page);


  }, [page]);

  useEffect(() => {
    window.scrollTo(0, 0);
    let type, sortBy = ''
    if (location.pathname.includes('hot')) {
      type = 'hot'
      sortBy = text
    }
    else sortBy = text
    setPage(1)
    setRenderPosts([])
    if (page == 1) {
      fetchPosts(type, sortBy);
    }
  }, [text, location.key]);

  useEffect(() => {
    if (posts) {
      setRenderPosts(posts);
    }
  }, [posts])

  const handleSortChange = (value) => {
    setSelectedSort(value);
  };
  return (
    <div>
      {loading && Array.from({ length: 8 }).map(((_,index) => (
        <div key={index} className="flex flex-col w-full mb-3 bg-white px-5 py-3 gap-5">
          {/* <Loader2 className='h-8 w-8 animate-spin text-maincolor' /> */}
          <div className="flex gap-2 w-full">
            <Skeleton variant="circular" width={50} height={50} />
            <div className=" flex flex-col gap-2 flex-1  justify-center">
              <Skeleton animation="wave" width={'25%'} height={10} />
              <Skeleton animation="wave" width={'22%'} height={10} />
            </div>
          </div>
          <Skeleton animation="wave" width={'100%'} height={10} />
          <Skeleton animation="wave" width={'100%'} height={10} />
          <Skeleton animation="wave" width={'100%'} height={10} />
          <Skeleton animation="wave" width={'65%'} height={10} />
        </div>
      )))}
      {/* <div className="relative inline-block text-left">
        <CustomSelect selectedSort={selectedSort} onChange={handleSortChange} />
      </div>
      <hr width="100%" size="10px" align="center" className='mb-3 mt-1' /> */}
      {
        renderPosts?.map((post, index) => {
          if (posts.length == index + 1) {
            return (<Post ref={lastElementRef} key={post?._id} post={post} />)
          } else return <Post key={post?._id} post={post} />
        })
      }
      {posts.length < 1 && !loading &&
        <div className='flex flex-col gap-3 items-center justify-center bg-white w-full h-[60vh] mx-auto transition-all duration-[300ms] pt-4 px-5'>
          {/* <PiEmptyFill className='text-maincolor w-10 h-10' /> */}
          <RiErrorWarningFill className='text-maincolor w-10 h-10' />
          <p>Không có dữ liệu</p>
        </div>}
    </div>
  )
}

export default Posts