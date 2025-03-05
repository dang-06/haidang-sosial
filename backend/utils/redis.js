import { createClient } from 'redis';

const connectRedis = async () => {
    const client = createClient({
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: 'redis-17014.c292.ap-southeast-1-1.ec2.redns.redis-cloud.com',
            port: 17014
        }
    });

    client.on('error', err => {
        console.log('Redis Client Error', err)
        return
    });
    
    await client.connect();

    console.log('Redis client connected');

    return client;
}
export default connectRedis;