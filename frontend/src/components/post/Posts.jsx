import React, { useEffect, useRef, useState } from 'react'
import Post from './Post'
import { useDispatch, useSelector } from 'react-redux'
import * as Select from '@radix-ui/react-select';
import { FaChevronDown } from "react-icons/fa";
import { getPost } from '@/api/apiService';
import { setPosts } from "@/redux/postSlice";
import { Loader2 } from 'lucide-react';

const CustomSelect = ({ selectedSort, onChange }) => {

  const sortOptions = {
    best: 'Best',
    hot: 'Hot',
    new: 'New',
    top: 'Top',
  };
  return (
    <Select.Root value={selectedSort} onValueChange={onChange}>
      <Select.Trigger className="bg-white rounded-full px-2 text-xs font-semibold hover:bg-gray-300">
        <div className='flex items-center justify-center'>
          <span className='text-slate-400 text-xs'>{sortOptions[selectedSort] || 'Sort By'}</span> <FaChevronDown className='ml-2 text-slate-400' />
        </div>
      </Select.Trigger>
      <Select.Content className="bg-white border rounded-lg mt-2 w-full shadow-lg z-10 shadow">
        {Object.entries(sortOptions).map(([value, label]) => (
          <Select.Item key={value} value={value} className="p-2 hover:bg-gray-100 cursor-pointer px-5">
            {label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};

const Posts = () => {
  const { posts } = useSelector(store => store.post);
  const [selectedSort, setSelectedSort] = useState('best');
  const [renderPosts, setRenderPosts] = useState(posts || [])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const observer = useRef()
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await getPost(page);
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

    fetchPosts();
  }, [page]);

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
      <div className="flex w-full items-center justify-center rounded-full">
        <Loader2 className='h-8 w-8 animate-spin text-maincolor' />
      </div>
    </div>
  )
}

export default Posts