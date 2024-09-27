import React, { useEffect, useRef, useState } from 'react'
import Post from './Post'
import { useDispatch, useSelector } from 'react-redux'
import * as Select from '@radix-ui/react-select';
import { FaChevronDown } from "react-icons/fa";
import { getPost } from '@/api/apiService';
import { setPosts } from "@/redux/postSlice";
import { Loader2 } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { PiEmptyFill } from 'react-icons/pi';
import { RiErrorWarningFill } from 'react-icons/ri';

const Posts = () => {
  const { posts } = useSelector(store => store.post);
  const [selectedSort, setSelectedSort] = useState('best');
  const [renderPosts, setRenderPosts] = useState(posts || [])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const observer = useRef()
  const location = useLocation();
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

    console.log(type);
    console.log("sortBy: ", sortBy);
    console.log(text);
    console.log(location);

    fetchPosts(type, sortBy);
  }, [page, text]);

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
      {/* <div className="relative inline-block text-left">
        <CustomSelect selectedSort={selectedSort} onChange={handleSortChange} />
      </div>
      <hr width="100%" size="10px" align="center" className='mb-3 mt-1' /> */}
      {
        renderPosts?.map((post, index) => {
          if (posts.length == index + 1) {
            return (<Post ref={lastElementRef} key={post._id} post={post} />)
          } else return <Post key={post._id} post={post} />
        })
      }
      {/* <button onClick={() => setPage(page + 1)}>
        Load More
      </button> */}
      {loading && <div className="flex w-full items-center justify-center rounded-full">
        <Loader2 className='h-8 w-8 animate-spin text-maincolor' />
      </div>}
      {posts.length < 1 && !loading &&
        <div className='flex flex-col gap-3 items-center justify-center bg-white w-full h-[60vh] mx-auto transition-all duration-[300ms] pt-4 px-5'>
          {/* <PiEmptyFill className='text-maincolor w-10 h-10' /> */}
          <RiErrorWarningFill className='text-maincolor w-10 h-10'/>
          <p>Không có dữ liệu</p>
        </div>}
    </div>
  )
}

export default Posts