import React, { useEffect, useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import axios from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Signup = () => {
    const [open, setOpen] = useState(false);

    const [input, setInput] = useState({
        username: "",
        email: "",
        password: "",
        totp:""
    });
    const [loading, setLoading] = useState(false);
    const [loadingVerify, setLoadingVerify] = useState(false);
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const signupHandler = async () => {
        try {
            setLoading(true);
            const res = await axios.post(`${import.meta.env.VITE_API_URI}/user/register`, input, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                navigate("/login");
                toast.success(res.data.message);
                setInput({
                    username: "",
                    email: "",
                    password: "",
                    totp: ""
                });
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const verifyHandler = async () => {
        try {
            setLoadingVerify(true);
            const res = await axios.post(`${import.meta.env.VITE_API_URI}/user/verify`, input, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                setOpen(true)
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        } finally {
            setLoadingVerify(false);
        }
    }


    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [])
    return (
        <div className='flex items-center w-screen h-screen justify-center'>
            <div className='shadow-lg flex flex-col gap-5 p-8'>
                <div className='my-4'>
                    <h1 className='text-center font-bold text-xl'>LOGO</h1>
                    <p className='text-sm text-center'>Signup to see photos & videos from your friends</p>
                </div>
                <div>
                    <span className='font-medium'>Username</span>
                    <Input
                        type="text"
                        name="username"
                        value={input.username}
                        onChange={changeEventHandler}
                        className="focus-visible:ring-transparent my-2"
                    />
                </div>
                <div>
                    <span className='font-medium'>Email</span>
                    <Input
                        type="email"
                        name="email"
                        value={input.email}
                        onChange={changeEventHandler}
                        className="focus-visible:ring-transparent my-2"
                    />
                </div>
                <div>
                    <span className='font-medium'>Password</span>
                    <Input
                        type="password"
                        name="password"
                        value={input.password}
                        onChange={changeEventHandler}
                        className="focus-visible:ring-transparent my-2"
                    />
                </div>
                {
                    loadingVerify ? (
                        <Button>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Please wait
                        </Button>
                    ) : (
                        <Button onClick={verifyHandler}>Signup</Button>
                    )
                }
                <span className='text-center'>Already have an account? <Link to="/login" className='text-blue-600'>Login</Link></span>
            </div>
            <Modal
                open={open}
                onClose={()=>{setOpen(false)}}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                className='shadow-lg flex flex-col gap-5 p-8'
            >
                <Box sx={style}>
                    {/* <Typography id="modal-modal-title" variant="h6" component="h2">
                        TOTP
                    </Typography> */}
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        <div>
                            <span className='font-medium'>TOTP</span>
                            <div className="flex">
                                <Input
                                    type="text"
                                    name="totp"
                                    value={input.totp}
                                    onChange={changeEventHandler}
                                    className="focus-visible:ring-transparent my-2"
                                />
                                {
                                    loading ? (
                                        <Button className='mt-2 ml-2'>
                                            <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                                        </Button>
                                    ) : (
                                        <Button className='mt-2 ml-2' onClick={signupHandler}>Submit</Button>
                                    )
                                }
                            </div>
                        </div>
                    </Typography>
                </Box>
            </Modal>
        </div>
    )
}

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default Signup