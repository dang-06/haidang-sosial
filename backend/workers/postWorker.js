import { Worker } from 'bullmq';
import sharp from 'sharp';
import cloudinary from '../utils/cloudinary.js';
import { Post } from '../models/post.model.js';
import { User } from '../models/user.model.js';

const connection = { host: '127.0.0.1', port: 6379 };

const postWorker = new Worker('postQueue', async job => {
  const { caption, images, authorId } = job.data;

  const imageUploadPromises = images.map(async (base64) => {
    const buffer = Buffer.from(base64, 'base64');
    const optimizedImageBuffer = await sharp(buffer)
      .resize({ width: 1000, height: 1000, fit: 'inside' })
      .toFormat('jpeg', { quality: 100 })
      .toBuffer();

    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    return cloudResponse.secure_url;
  });

  const imageUrls = await Promise.all(imageUploadPromises);

  const post = await Post.create({
    caption,
    image: imageUrls,
    author: authorId
  });

  const user = await User.findById(authorId);
  if (user) {
    user.posts.push(post._id);
    await user.save();
  }

  await post.populate({ path: 'author', select: '-password' });

  console.log(`✅ Post created for user ${authorId}`);
}, { connection });

postWorker.on('completed', job => {
  console.log(`🎉 Job ${job.id} completed`);
});

postWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed: ${err.message}`);
});
