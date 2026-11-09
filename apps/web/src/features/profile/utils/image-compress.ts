/**
 * Kiểm tra và nén hình ảnh đại diện người dùng tải lên dạng Data URL (WebP/JPEG).
 * Tự động cắt vuông phần giữa ảnh và giới hạn độ phân giải (mặc định 180x180 px).
 * Luôn trả về ảnh đã nén — không bao giờ trả về dữ liệu gốc chưa xử lý.
 */
import { MAX_USER_IMAGE_LENGTH } from "@vox-flow/auth/image-validation";

export async function compressImageFile(
  file: File,
  maxDimension = 180,
  quality = 0.85,
  maxOutputLength = MAX_USER_IMAGE_LENGTH,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Tệp được chọn không phải là hình ảnh hợp lệ (PNG, JPG, WebP...).");
  }

  // Giới hạn dung lượng ban đầu 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Kích thước tệp vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
  }

  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();

  reader.onerror = () => {
    reject(new Error("Không thể đọc tệp ảnh đã chọn."));
  };

  reader.onload = () => {
    const result = reader.result;
    if (typeof result !== "string") {
      reject(new Error("Dữ liệu hình ảnh không hợp lệ."));
      return;
    }

    // Trong môi trường không hỗ trợ Image/Canvas (SSR hoặc test mock), không có
    // đường nén nào khả dụng → từ chối thay vì lưu ảnh gốc chưa nén.
    if (typeof window === "undefined" || typeof Image === "undefined") {
      reject(new Error("Trình duyệt không hỗ trợ xử lý ảnh. Vui lòng dùng trình duyệt khác."));
      return;
    }

    const img = new Image();

    img.onerror = () => {
      reject(new Error("Không thể tải và phân giải hình ảnh này."));
    };

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const size = Math.min(width, height);
      if (size <= 0) {
        reject(new Error("Hình ảnh không hợp lệ hoặc rỗng."));
        return;
      }

      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Trình duyệt không hỗ trợ xử lý ảnh. Vui lòng dùng trình duyệt khác."));
          return;
        }

        const sx = (width - size) / 2;
        const sy = (height - size) / 2;

        canvas.width = maxDimension;
        canvas.height = maxDimension;

        // Cắt vuông tâm ảnh và vẽ vào canvas
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxDimension, maxDimension);

        // Thử xuất WebP, fallback JPEG
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        if (!dataUrl.startsWith("data:image/webp") && !dataUrl.startsWith("data:image/jpeg")) {
          reject(new Error("Trình duyệt không hỗ trợ nén ảnh."));
          return;
        }
        if (dataUrl.length > maxOutputLength) {
          reject(
            new Error(
              "Ảnh sau khi nén vẫn vượt quá giới hạn dung lượng cho phép. Vui lòng chọn ảnh nhỏ hơn.",
            ),
          );
          return;
        }

        resolve(dataUrl);
      } catch {
        reject(new Error("Không thể nén hình ảnh này. Vui lòng chọn ảnh khác."));
      }
    };

    img.src = result;
  };

  reader.readAsDataURL(file);
  return promise;
}
