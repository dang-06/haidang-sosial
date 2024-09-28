// Login.jsx
import React, { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '@/redux/authSlice';
import { getLoginStatus } from '@/api/apiService';
import { Modal, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import * as Yup from 'yup'

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: '#fff',
    border: '2px solid #000',
    borderRadius: '8px',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)',
    p: 4,
};

const Login = () => {
    const [input, setInput] = useState({
        email: "",
        password: ""
    });
    const [open, setOpen] = useState(false);
    const [inputSignup, setInputSignUp] = useState({
        username: "",
        email: "",
        password: "",
        totp: ""
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [errorsSignUp, setErrorsSignUp] = useState({});
    const [loadingVerify, setLoadingVerify] = useState(false);
    const [signIn, setsignIn] = useState(true);
    const { user } = useSelector(store => store.auth);
    const [touched, setTouched] = useState({});
    const [touchedSignUp, setTouchedSignUp] = useState({});
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const inputSchema = Yup.object().shape({
        email: Yup.string()
            .email('Địa chỉ email không hợp lệ')
            .required('Bạn chưa nhập email'),
        password: Yup.string()
            .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
            .required('Bạn chưa nhập mật khẩu'),
    });

    const inputSignupSchema = Yup.object().shape({
        email: Yup.string()
            .email('Địa chỉ email không hợp lệ')
            .required('Bạn chưa nhập email'),
        password: Yup.string()
            .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
            .required('Bạn chưa nhập mật khẩu'),
        username: Yup.string().required('Bạn chưa nhập tên hiển thị'),
    });

    const changeEventHandler = (e) => {
        const { name, value } = e.target;
        setInput({ ...input, [e.target.name]: e.target.value });
        if (touched[name]) {
            validateField(inputSchema, name, value,setErrors);
        }
    }

    const changeSignUpEventHandler = (e) => {
        const { name, value } = e.target;
        setInputSignUp({ ...inputSignup, [e.target.name]: e.target.value });
        if (touchedSignUp[name]) {
            validateField(inputSignupSchema, name, value,setErrorsSignUp);
        }
    }


    const handleBlur = async (e) => {
        const { name, value } = e.target;
        setTouched((prevTouched) => ({
            ...prevTouched,
            [name]: true,
        }));

        await validateField(inputSchema, name, value,setErrors);
    };

    const handleBlurSignUp = async (e) => {
        const { name, value } = e.target;
        setTouchedSignUp((prevTouched) => ({
            ...prevTouched,
            [name]: true,
        }));

        await validateField(inputSignupSchema, name, value,setErrorsSignUp);
    };

    const validateField = async (schema, name, value,setErr) => {
        try {
            await Yup.reach(schema, name).validate(value);
            setErr((prevErrors) => ({
                ...prevErrors,
                [name]: '',
            }));
        } catch (err) {
            setErr((prevErrors) => ({
                ...prevErrors,
                [name]: err.message,
            }));
        }
    };

    const signupHandler = async () => {
        try {
            setLoading(true);
            const res = await axios.post(`${import.meta.env.VITE_API_URI}/user/register`, inputSignup, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                navigate("/login");
                toast.success(res.data.message);
                setInputSignUp({
                    username: "",
                    email: "",
                    password: "",
                    totp: ""
                });
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi!");
        } finally {
            setLoading(false);
        }
    }

    const verifyHandler = async () => {
        try {
            await inputSignupSchema.validate(inputSignup, { abortEarly: false });
            setErrorsSignUp({});
            setLoadingVerify(true);
            const res = await axios.post(`${import.meta.env.VITE_API_URI}/user/verify`, inputSignup, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                setOpen(true);
                toast.success(res.data.message);
            }
        } catch (error) {
            if (error.name === 'ValidationError') {
                const validationErrors = {};
                error.inner.forEach((error) => {
                    validationErrors[error.path] = error.message;
                });
                setErrorsSignUp(validationErrors);
            } else {
                console.log(error);
                toast.error(error.response?.data?.message || "Đã xảy ra lỗi!");
            }
        } finally {
            setLoadingVerify(false);
        }
    }

    const signinHandler = async (e) => {
        e.preventDefault();
        try {
            await inputSchema.validate(input, { abortEarly: false });
            setErrors({});
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
            if (error.name === 'ValidationError') {
                const validationErrors = {};
                error.inner.forEach((error) => {
                    validationErrors[error.path] = error.message;
                });
                setErrors(validationErrors);
            } else {
                console.log(error);
                toast.error(error.response?.data?.message || "Đã xảy ra lỗi!");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const handleLoginStatus = async () => {
            try {
                const res = await getLoginStatus();
                if (res.success) navigate("/");
            } catch (error) {
                console.log(error);
            }
        }
        handleLoginStatus();
    }, [navigate]);

    const signInHandle = () => {
        setsignIn(true);
    }

    const signUpHandle = () => {
        setsignIn(false);
    }

    return (
        <div className='flex items-center w-screen h-screen justify-center bg-slate-100'>
            <motion.div
                key={signIn ? "signIn-true" : "signIn-false"}
                // initial={{ opacity: 0, x: 20}}
                // animate={{ opacity: 1, x: 0 }}
                // exit={{ opacity: 0, x: -20 }}
                // transition={{ duration: 2 }}

                className="flex w-[50vw] bg-white shadow-lg rounded-2xl h-[510px] relative transition-transform duration-300 ease-in-out"
            >
                <motion.div
                    className={`${signIn ? "left-0" : "right-0"} absolute flex flex-col items-center gap-3 px-10 py-16 w-[50%] rounded-l-3`}
                    initial={{ opacity: 0, x: signIn ? 400 : -400 }} // Phần tử đăng nhập hoặc đăng ký
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: signIn ? -400 : 400 }} // Phần tử sẽ di chuyển ra ngoài
                    transition={{ duration: 0.5 }}
                >
                    {signIn ? (
                        <motion.div
                            className={`flex flex-col items-center gap-3 bg-white`}
                        // initial={{ opacity: 0, x: 100 }} // Phần tử đăng ký
                        // animate={{ opacity: 1, x: 0 }}
                        // exit={{ opacity: 0, x: -100 }} // Phần tử sẽ di chuyển ra ngoài
                        // transition={{ duration: 0.75 }}
                        >
                            <img className='w-[100px] md:w-[200px]' src="/newLogo.png" alt="Logo" />
                            <span className='text-sm text-center'>Mở rộng kết nối, theo dõi và khám phá xu hướng nổi bật!</span>
                            <div className='w-full'>
                                <div className='flex justify-between'>
                                    <span className='font-medium text-sm'>Email</span> {errors.email && <span className='text-xs' style={{ color: 'red' }}>{errors.email}</span>}
                                </div>
                                <Input
                                    type="email"
                                    name="email"
                                    value={input.email}
                                    onChange={changeEventHandler}
                                    onBlur={handleBlur}
                                    className={`focus-visible:ring-transparent mt-2 ${errors.email ? 'border-[#ff0000]' : ''} `}
                                />
                            </div>
                            <div className='w-full'>
                                <div className='flex justify-between'>
                                    <span className='font-medium text-sm'>Mật khẩu</span> {errors.password && <span className='text-xs' style={{ color: 'red' }}>{errors.password}</span>}
                                </div>
                                <Input
                                    type="password"
                                    name="password"
                                    value={input.password}
                                    onChange={changeEventHandler}
                                    onBlur={handleBlur}
                                    className={`focus-visible:ring-transparent mt-2 ${errors.password ? 'border-[#ff0000]' : ''} `}
                                />
                            </div>
                            <span className='text-center text-xs text-gray-400 hover:text-gray-600 cursor-pointer'>Quên mật khẩu?</span>

                            {loading ? (
                                <Button disabled>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Xin chờ...
                                </Button>
                            ) : (
                                <Button onClick={signinHandler} className='w-[160px]'>Đăng nhập</Button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            className={`flex flex-col items-center gap-3 bg-white`}
                        // initial={{ opacity: 0, x: -100 }} // Phần tử đăng ký
                        // animate={{ opacity: 1, x: 0 }}
                        // exit={{ opacity: 0, x: 100 }} // Phần tử sẽ di chuyển ra ngoài
                        // transition={{ duration: 0.75 }}
                        >
                            <img className='w-[100px] md:w-[200px]' src="/newLogo.png" alt="Logo" />
                            <span className='text-sm text-center'>Theo dõi mọi người, khám phá xu hướng mới</span>
                            <div className='w-full'>
                                <div className='flex justify-between'>
                                    <span className='font-medium text-sm'>Tên hiển thị</span> {errorsSignUp.username && <span className='text-xs' style={{ color: 'red' }}>{errorsSignUp.username}</span>}
                                </div>
                                <Input
                                    type="text"
                                    name="username"
                                    value={inputSignup.username}
                                    onChange={changeSignUpEventHandler}
                                    onBlur={handleBlurSignUp}
                                    className={`focus-visible:ring-transparent mt-2 ${errorsSignUp.username ? 'border-[#ff0000]' : ''} `}
                                />
                            </div>
                            <div className='w-full'>
                                <div className='flex justify-between'>
                                    <span className='font-medium text-sm'>Email</span> {errorsSignUp.email && <span className='text-xs' style={{ color: 'red' }}>{errorsSignUp.email}</span>}
                                </div>
                                <Input
                                    type="email"
                                    name="email"
                                    value={inputSignup.email}
                                    onChange={changeSignUpEventHandler}
                                    onBlur={handleBlurSignUp}
                                    className={`focus-visible:ring-transparent mt-2 ${errorsSignUp.email ? 'border-[#ff0000]' : ''} `}
                                />
                            </div>
                            <div className='w-full'>
                                <div className='flex justify-between'>
                                    <span className='font-medium text-sm'>Mật khẩu</span> {errorsSignUp.password && <span className='text-xs' style={{ color: 'red' }}>{errorsSignUp.password}</span>}
                                </div>
                                <Input
                                    type="password"
                                    name="password"
                                    value={inputSignup.password}
                                    onChange={changeSignUpEventHandler}
                                    onBlur={handleBlurSignUp}
                                    className={`focus-visible:ring-transparent mt-2 ${errorsSignUp.password ? 'border-[#ff0000]' : ''} `}
                                />
                            </div>
                            {loadingVerify ? (
                                <Button disabled>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin mt-1' />
                                    Xin chờ...
                                </Button>
                            ) : (
                                <Button onClick={verifyHandler} className='w-[160px] mt-1'>Đăng kí</Button>
                            )}
                        </motion.div>
                    )}
                </motion.div>

                <motion.div
                    className={`${signIn ? "right-0  rounded-r-2xl rounded-l-[175px]" : "left-0  rounded-l-2xl rounded-r-[175px]"} z-10 absolute h-full bg-maincolor w-[50%] flex flex-col items-center justify-center gap-5`}
                    layout
                    initial={{
                        opacity: 1,
                        x: signIn ? -400 : 400,
                        borderRadius: signIn ? "16px 175px 175px 16px" : "175px 16px 16px 175px",
                    }}
                    animate={{
                        opacity: 1,
                        x: 0,
                        borderRadius: signIn ? "175px 16px 16px 175px" : "16px 175px 175px 16px",
                    }}
                    exit={{
                        opacity: 1,
                        x: signIn ? 400 : -400,
                        borderRadius: signIn ? "175px 16px 16px 175px" : "16px 175px 175px 16px",
                    }}
                    transition={{ duration: 0.5 }}
                >
                    {signIn ? (
                        <motion.div
                            className={`flex flex-col items-center justify-center gap-5`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                        >
                            <h1 className='text-center text-3xl font-bold text-white'>Xin chào !!!</h1>
                            <span className='text-center text-sm text-white px-8'>Đăng ký và bắt đầu hành trình khám phá những thứ mới mẻ</span>
                            <div className="flex text-center items-center justify-center w-full">
                                <Button type='button' className='w-[160px]' onClick={signUpHandle}>Đăng kí</Button>
                            </div>
                        </motion.div>

                    ) : (
                        <motion.div
                            className={`flex flex-col items-center justify-center gap-5`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                        >
                            <h1 className='text-center text-3xl font-bold text-white'>Chào mừng trở lại !!!</h1>
                            <span className='text-center text-sm text-white px-16'>Quay lại và cùng chia sẻ khoảnh khắc tuyệt vời</span>
                            <div className="flex text-center items-center justify-center w-full">
                                <Button type='button' className='w-[160px]' onClick={signInHandle}>Đăng nhập</Button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
            {/* Modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} tabIndex={0}>
                    <Typography id="modal-modal-description" component="div" sx={{ mt: 2 }}>
                        <h1 className='text-center font-bold'>
                            Mã OTP đã được gửi đến Email của bạn
                        </h1>

                        <div className='mt-4'>
                            <span className='font-medium text-sm'>OTP</span>
                            <div className="flex mt-2">
                                <Input
                                    type="text"
                                    name="totp"
                                    value={inputSignup.totp}
                                    onChange={changeSignUpEventHandler}
                                    className="focus-visible:ring-transparent my-2"
                                />
                                {
                                    loadingVerify ? (
                                        <Button className='mt-2 ml-2' disabled>
                                            <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                                            Xin chờ...
                                        </Button>
                                    ) : (
                                        <Button
                                            className='mt-2 ml-2'
                                            onClick={signupHandler}
                                        >
                                            Xác nhận
                                        </Button>
                                    )
                                }
                            </div>
                        </div>
                    </Typography>
                </Box>
            </Modal>
        </div >
    )
}

export default Login;
