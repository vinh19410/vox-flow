/**
 * Validate độc lập cho trường `user.name` — module thuần, không import
 * better-auth, an toàn để dùng chung giữa server (hook createAuth) và web
 * client.
 */

/** Giới hạn độ dài tối đa của tên hiển thị (sau khi cắt khoảng trắng đầu/cuối). */
export const MAX_USER_NAME_LENGTH = 50;

/**
 * Kiểm tra và chuẩn hóa trường `name` áp cho mọi thao tác tạo/cập nhật user qua
 * `databaseHooks.user` (bao gồm sign-up email, tạo user qua Google OAuth, và
 * `/update-user`). Trả về `undefined` khi không truyền `name`, `{ data: { name } }`
 * đã trim khi hợp lệ (`1..50` ký tự), hoặc `false` để từ chối.
 */
export function validateUserName(
  name: unknown,
): { data: { name: string } } | false | undefined {
  if (name === undefined) return undefined;
  if (typeof name !== "string") return false;

  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_USER_NAME_LENGTH) {
    return false;
  }

  return { data: { name: trimmed } };
}

/**
 * Chuẩn hóa tên từ hồ sơ OAuth ngoài (vd Google ID token có thể rỗng hoặc dài > 50 ký tự)
 * để luôn thỏa mãn ràng buộc `1..50` ký tự của `validateUserName`.
 */
export function normalizeOAuthUserName(
  name: unknown,
  email?: unknown,
): string {
  const raw = typeof name === "string" ? name.trim() : "";
  if (raw.length > 0) {
    return raw.slice(0, MAX_USER_NAME_LENGTH).trim() || "Học viên";
  }
  const emailLocal =
    typeof email === "string" ? (email.split("@")[0]?.trim() ?? "") : "";
  if (emailLocal.length > 0) {
    return emailLocal.slice(0, MAX_USER_NAME_LENGTH).trim() || "Học viên";
  }
  return "Học viên";
}
