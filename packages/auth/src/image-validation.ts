/**
 * Validate độc lập cho trường `user.image` — module thuần, không import
 * better-auth, an toàn để dùng chung giữa server (hook createAuth) và web
 * client (kiểm tra dung lượng sau khi nén avatar).
 */

/** Giới hạn dung lượng ảnh đại diện lưu trữ (base64 data URL hoặc URL ngoài). */
export const MAX_USER_IMAGE_LENGTH = 32_000;

const DATA_IMAGE_ALLOWED = /^data:image\/(webp|jpeg|png);base64,/;

/**
 * Kiểm tra trường `image` do client gửi lên (sign-up email, /update-user).
 * Chỉ chấp nhận: URL https, data URL ảnh (webp/jpeg/png) đã nén, hoặc đường
 * dẫn avatar nội bộ `/avatars/...`. Trả về `false` để từ chối cập nhật.
 */
export function validateUserImage(
  image: unknown,
): { data: { image: string | null } } | false | undefined {
  if (image === undefined) return undefined;
  if (image === null) return { data: { image: null } };

  if (typeof image !== "string" || image.length === 0) return false;
  if (image.length > MAX_USER_IMAGE_LENGTH) return false;

  if (image.startsWith("https://")) return undefined;
  if (DATA_IMAGE_ALLOWED.test(image)) return undefined;
  if (image.startsWith("/avatars/")) return undefined;

  return false;
}
