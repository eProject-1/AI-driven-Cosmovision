export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Express không tự động bắt lỗi từ async function. Nếu có lỗi xảy ra trong async function, nó sẽ không được truyền đến middleware xử lý lỗi của Express. Điều này có thể dẫn đến việc ứng dụng bị treo hoặc không phản hồi đúng cách khi có lỗi xảy ra trong các route handler sử dụng async/await.

// Sử dụng asyncHandler giúp đảm bảo rằng mọi lỗi xảy ra trong async function sẽ được bắt và truyền đến middleware xử lý lỗi của Express, giúp ứng dụng hoạt động ổn định hơn và dễ dàng quản lý lỗi.