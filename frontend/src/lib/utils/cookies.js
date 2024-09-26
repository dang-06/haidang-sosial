/**
 * Lấy giá trị của một cookie dựa trên tên
 * @param {string} name - Tên của cookie
 * @returns {string|null} Giá trị của cookie hoặc null nếu không tìm thấy
 */
export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

/**
 * Thiết lập một cookie
 * @param {string} name - Tên của cookie
 * @param {string} value - Giá trị của cookie
 * @param {number} days - Số ngày cookie tồn tại
 */
export function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

/**
 * Xóa một cookie
 * @param {string} name - Tên của cookie
 */
export function eraseCookie(name) {   
    document.cookie = name + '=; Max-Age=-99999999; path=/';  
}
