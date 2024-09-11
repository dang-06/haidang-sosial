import React, { useState } from 'react'
import Post from './Post'
import { useSelector } from 'react-redux'
import * as Select from '@radix-ui/react-select';
import { FaChevronDown } from "react-icons/fa";

const CustomSelect = ({ selectedSort, onChange }) => {

  const sortOptions = {
    best: 'Best',
    hot: 'Hot',
    new: 'New',
    top: 'Top',
  };
  return (
    <Select.Root value={selectedSort} onValueChange={onChange}>
      <Select.Trigger className="bg-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-gray-300">
        <div className='flex items-center justify-center'>
        {sortOptions[selectedSort] || 'Sort By'} <FaChevronDown  className='ml-2'/>
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

  const handleSortChange = (value) => {
    setSelectedSort(value);
  };
  return (
    <div>
      <div className="relative inline-block text-left">
        <CustomSelect selectedSort={selectedSort} onChange={handleSortChange} />
      </div>
      <hr width="100%" size="10px" align="center" className='my-3' />
      {
        posts.map((post) => <Post key={post._id} post={post} />)
      }
    </div>
  )
}

export default Posts