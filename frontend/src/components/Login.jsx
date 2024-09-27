import React, { useEffect, useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import axios from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '@/redux/authSlice';
import { getCookie } from '@/lib/utils/cookies';
import { getLoginStatus } from '@/api/apiService';

const Login = () => {
    const [input, setInput] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const {user} = useSelector(store=>store.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const signupHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await axios.post(`${import.meta.env.VITE_API_URI}/user/login`, input, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                dispatch(setAuthUser(res.data.user));
                navigate("/");
                toast.success(res.data.message);
                setInput({
                    email: "",
                    password: ""
                });
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        const handleLoginStatus = async () => {
            try {
                const res = await getLoginStatus()
                if (res.success) navigate("/")
            } catch (error) {
                console.log(error); 
            }
        }
        handleLoginStatus()
    },[])
    return (
        <div className='flex items-center w-screen h-screen justify-center'>
            <form onSubmit={signupHandler} className='shadow-lg flex flex-col gap-3 p-6 md:w-[420px]'>
                <div className='mb-2 flex flex-col items-center'>
                    <img className='w-[100px] md:w-[200px] my-6' src="/newLogo.png" alt="" />
                    <p className='text-sm text-center'>Mở rộng kết nối, theo dõi và khám phá xu hướng nổi bật!</p>
                </div>
                <div>
                    <span className='font-medium text-sm'>Email</span>  
                    <Input
                        type="email"
                        name="email"
                        value={input.email}
                        onChange={changeEventHandler}
                        className="focus-visible:ring-transparent mt-2"
                    />
                </div>
                <div>
                    <span className='font-medium text-sm'>Mật khẩu</span>
                    <Input
                        type="password"
                        name="password"
                        value={input.password}
                        onChange={changeEventHandler}
                        className="focus-visible:ring-transparent mb-2"
                    />
                </div>
                {
                    loading ? (
                        <Button>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Xin chờ...
                        </Button>
                    ) : (
                        <Button type='submit'>Đăng nhập</Button>
                    )
                }

                <span className='text-center mt-4 text-sm'>Bạn chưa có tài khoản? <Link to="/signup" className='text-blue-600'>Đăng kí ngay</Link></span>
            </form>
        </div>
    )
}

export default Login