import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config({});

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || 'dsxotpoew',
    api_key: process.env.API_KEY || '768834783191889',
    api_secret: process.env.API_SECRET || 'PyKc2BxwkwXdoZHw5uRWC4WEtio'
});
export default cloudinary;