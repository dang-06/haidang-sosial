import * as React from 'react';
import { useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import useGetAllUsers from '@/hooks/useGetAllUsers';
import { useEffect } from 'react';
import { useRef } from 'react';
import axios from 'axios';

const SearchOptions = ({ className, ...props }) => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const modalRef = useRef(null);

  const searchUsers = async (searchValue) => {
    try {
      if (!searchValue.trim()) {
        setUsers([]);
        return;
      }
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/user/all-users?username=${searchValue}&&limit=7`, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (res.data.success) {
        setUsers(res.data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log(error);
      setUsers([]);
    }
  }


  const handleChange = (event) => {
    setSearchValue(event.target.value);
    searchUsers(event.target.value)
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSearchValue('');
    setUsers([]);
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setOpen(false);
    }
  };
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={modalRef} className={className} {...props}>
      <div className="relative flex items-center h-[74px] py-3.5 w-full">
        <IoSearch className="absolute h-7 w-7 mr-8 left-[12px] top-[22px] text-[#666] z-20" aria-hidden="true" />
        <input
          className="z-10 text-[#666] w-[300px] text-xl overflow-hidden rounded-3xl h-full pl-[50px] pr-3 flex-1 bg-gray-100 outline-none border-0 bg-[#f7f7f7] focus:bg-[#fff] focus:shadow"
          type="search"
          placeholder="Tìm kiếm"
          value={searchValue}
          onChange={handleChange}
          onClick={()=>{setOpen(true)}}
        />
        {open &&
          <div
            className=" absolute pt-[75px] top-0 left-0 w-[350px] bg-white shadow rounded-md shadow-lg overflow-y-auto"
          >
            {users.length > 0 ? (
              <ul className="list-none m-0 p-0">
                {users.map((option) => (
                  <li
                    key={option._id}
                    className="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
                  >
                    <Link
                      to={`/profile/${option._id}`}
                      className="flex items-center text-decoration-none text-black w-full"
                      onClick={handleClose}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={option.profilePicture} alt="profile_picture" />
                        <AvatarFallback>{option.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <h1 className="text-xl font-medium">{option.username}</h1>
                        <span className="text-slate-500 text-base">{option.bio || 'Newbie'}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">Không có kết quả trùng khớp</div>
            )}
          </div>
        }
      </div>
    </div>
  );
};

export default SearchOptions;
