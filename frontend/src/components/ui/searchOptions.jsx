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
      <div className="relative flex items-center h-[59px] py-3 w-full ">
        <IoSearch className="absolute z-30 h-5 w-5 mr-8 left-[7px] top-[20px] text-[#666] z-20" aria-hidden="true" />
        <input
          className="z-20 text-[#666] w-[200px] text-base overflow-hidden rounded-2xl h-full pl-[40px] pr-3 flex-1 bg-gray-100 outline-none border-0 bg-[#f7f7f7] focus:bg-[#fff] focus:shadow"
          type="search"
          placeholder="Tìm kiếm"
          value={searchValue}
          onChange={handleChange}
          onClick={()=>{setOpen(true)}}
        />
        {open &&
          <div
            className=" absolute pt-[59px] top-0 left-0 w-[260px] bg-white shadow rounded-md shadow-lg overflow-y-auto z-10 pb-1"
          >
            {users.length > 0 ? (
              <ul className="list-none m-0 p-0">
                {users.map((option) => (
                  <li
                    key={option._id}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <Link
                      to={`/profile/${option._id}`}
                      className="flex items-center text-decoration-none text-black w-full "
                      onClick={handleClose}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={option.profilePicture} alt="profile_picture" />
                        <AvatarFallback>{option.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex flex-col">
                        <p className="text-base">{option.username}</p>
                        <span className="text-slate-500 text-xs">{option.bio || '...'}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-2 text-center text-gray-500">Không có kết quả trùng khớp</div>
            )}
          </div>
        }
      </div>
    </div>
  );
};

export default SearchOptions;
