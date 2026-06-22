import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.util.js";
import {
  createRecommendation as createRecommendationService,
  getUserRecommendations as getUserRecommendationsService,
  getRecommendationById as getRecommendationByIdService,
} from "./recommendation.service.js";

/**
 * POST /api/recommendations
 * Tạo gợi ý quan sát mới dựa trên vị trí người dùng.
 * Có cache 30 phút theo locationKey — gọi lại cùng toạ độ trong khoảng
 * thời gian này sẽ trả về kết quả cũ (data.fromCache === true), không
 * chạy lại pipeline Weather/NASA/Maps/Groq.
 */
export const createRecommendation = asyncHandler(async (req, res) => {
  const { latitude, longitude, locationName } = req.body;
  const userId = req.user.id;

  const data = await createRecommendationService({
    userId,
    latitude,
    longitude,
    locationName,
  });

  return sendSuccess(res, data, "Tạo gợi ý quan sát thành công", 201);
});

/**
 * GET /api/recommendations
 * Lấy lịch sử gợi ý của user đang đăng nhập.
 */
export const getUserRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  const data = await getUserRecommendationsService(userId, { limit });

  return sendSuccess(res, data, "Lấy lịch sử gợi ý thành công");
});

/**
 * GET /api/recommendations/:id
 * Lấy chi tiết một recommendation (chỉ owner).
 */
export const getRecommendationById = asyncHandler(async (req, res) => {
  const data = await getRecommendationByIdService(req.params.id, req.user.id);

  return sendSuccess(res, data);
});

/**
 * POST /api/recommendations/:id/refresh
 *
 * Tạo MỘT BẢN GHI QUAN SÁT MỚI dựa trên toạ độ của recommendation cũ,
 * bỏ qua cache 30 phút, buộc chạy lại toàn bộ pipeline
 * (Weather/NASA/Maps/Groq) để lấy dữ liệu thời gian thực mới nhất.
 *
 * THIẾT KẾ CÓ CHỦ ĐÍCH: mỗi Recommendation là một "quan sát tại một thời
 * điểm" (giống log/snapshot), KHÔNG phải là state có thể ghi đè. Vì vậy
 * action này KHÔNG sửa record cũ — nó tạo record mới với id khác, để giữ
 * toàn vẹn lịch sử phục vụ phân tích xu hướng (sky score, thời tiết theo
 * thời gian...) — đúng định hướng Analytics của dự án.
 *
 * record cũ (:id trong URL) vẫn còn nguyên trong DB sau khi gọi route này.
 * Response trả kèm `refreshedFromId` để FE biết bản ghi mới này được tạo
 * từ vị trí của recommendation nào — FE phải dùng `data.id` (id MỚI) để
 * điều hướng/hiển thị tiếp, KHÔNG dùng lại :id cũ trong URL.
 */
export const refreshRecommendation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Lấy recommendation gốc — service tự throw 404 nếu không tồn tại,
  // và throw 403 nếu không phải chủ sở hữu.
  const original = await getRecommendationByIdService(id, userId);

  const data = await createRecommendationService({
    userId,
    latitude: original.latitude,
    longitude: original.longitude,
    locationName: original.locationName,
    forceRefresh: true,
  });

  return sendSuccess(
    res,
    { ...data, refreshedFromId: id },
    "Đã tạo bản ghi quan sát mới dựa trên vị trí trước đó",
    201
  );
});