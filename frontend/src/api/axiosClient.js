import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URI,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    withCredentials: true
});


axiosClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response.status === 401) {
        window.location.href = "/login";
    }
    console.error("Looks like there was a problem. Status Code: " + res.status);
    return Promise.reject(error);
});

export default axiosClient;