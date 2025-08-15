import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '1m', target: 100 },   // Tăng dần lên 100 người dùng ảo trong 1 phút
        // { duration: '2m', target: 50 },
        // { duration: '5m', target: 50 },
        // { duration: '2m', target: 100 },  
        // { duration: '3m', target: 100 },
        // { duration: '2m', target: 0 },
    ],
    thresholds: {
        // Điều kiện đạt/không đạt (Performance Thresholds)
        'http_req_duration': ['p(95)<2000', 'avg<800'], // Thời gian phản hồi 95% < 2s, trung bình < 0.8s
        'http_req_failed': ['rate<0.05'], // Tỉ lệ lỗi < 5%
        'http_req_duration{endpoint:getAllPosts}': ['p(95)<1500'], // GET /all p95 < 1.5s
        'http_req_duration{endpoint:addPost}': ['p(95)<3000'], // POST /addpost p95 < 3s
    },
};

const BASE_URL = 'http://localhost:3000/api/v1/post';

export function setup() {
    const loginRes = http.post('http://localhost:3000/api/v1/user/login', {
        email: 'dangdominhhai@gmail.com',
        password: 'socialjack97'
    });

    if (loginRes.status === 200) {
        const cookies = loginRes.cookies;
        return { cookies };
    }
    throw new Error('Đăng nhập thất bại');
}

export default function (data) {
    const params = {
        cookies: data.cookies,
        tags: {}
    };

    // 80% trường hợp gọi GET /all, 20% trường hợp gọi POST /addpost
    if (Math.random() < 0.8) {
        testGetAllPosts(params);
    } else {
        testAddPost(params);
    }

    sleep(1);
}

// Test API GET /all
function testGetAllPosts(params) {
    params.tags.endpoint = 'getAllPosts';

    const response = http.get(`${BASE_URL}/all?type=hot`, params);

    check(response, {
        'GET /all - Status 200': (r) => r.status === 200,
        'GET /all - Response < 1.5s': (r) => r.timings.duration < 1500,
        'GET /all - Có danh sách bài viết': (r) => {
            try {
                const data = JSON.parse(r.body);
                return data.success;
            } catch { return false; }
        }
    });
}

// Test API POST /addpost
function testAddPost(params) {
    const postData = {
        caption: `Test post ${Date.now()}`,
        location: 'Test Location'
    };

    const postParams = {
        cookies: params.cookies,
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'addPost' }
    };

    const response = http.post(`${BASE_URL}/addpost`, JSON.stringify(postData), postParams);

    check(response, {
        'POST /addpost - Status 200/202': (r) => r.status === 200 || r.status === 202,
        'POST /addpost - Response < 3s': (r) => r.timings.duration < 3000,
        'POST /addpost - Thành công': (r) => {
            try {
                const data = JSON.parse(r.body);
                return data.success === true;
            } catch { return false; }
        }
    });
}
