// scheduler/hotFeedScheduler.js
import cron from 'node-cron';
import { buildHotFeedCache, cleanupOldFeeds } from '../controllers/post.controller.js';

export const startHotFeedScheduler = () => {
  // Build hot feed cache mỗi 30 phút
  cron.schedule('*/30 * * * *', async () => {
    console.log('🔥 Cron: Building hot feed cache...');
    await buildHotFeedCache();
  });

  // Cleanup old feeds mỗi 6 giờ
  cron.schedule('0 */6 * * *', async () => {
    console.log('🧹 Cron: Cleaning up old feeds...');
    await cleanupOldFeeds();
  });

  // Build initial cache khi server start
  setTimeout(async () => {
    console.log('🚀 Initial hot feed cache build...');
    await buildHotFeedCache();
  }, 5000); // Delay 5s để đảm bảo DB connection ready

  console.log('📅 Hot feed scheduler started');
};