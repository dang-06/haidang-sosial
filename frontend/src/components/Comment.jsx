import { Avatar } from '@mui/material'
import React from 'react'

const Comment = ({ comment }) => {
    return (
        <div className='my-2'>
            <div className='flex gap-3 items-center'>
                <Avatar src={comment?.author?.profilePicture}/>
                <h1 className='font-bold text-sm'>{comment?.author.username} <span className='font-normal pl-1'>{comment?.text}</span></h1>
            </div>
        </div>
    )
}

export default Comment