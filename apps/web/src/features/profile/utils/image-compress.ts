/**
 * Kiểm tra và nén hình ảnh đại diện người dùng tải lên dạng Data URL (WebP/JPEG).
 * Tự động cắt vuông phần giữa ảnh và giới hạn độ phân giải (mặc định 180x180 px).
 */
export async function compressImageFile(
  file: File,
  maxDimension = 180,
  quality = 0.85,
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

    // Trong môi trường không hỗ trợ Image/Canvas (ví dụ SSR hoặc test mock thiếu canvas), trả về reader.result trực tiếp
    if (typeof window === "undefined" || typeof Image === "undefined") {
      resolve(result);
      return;
    }

    const img = new Image();

    img.onerror = () => {
      reject(new Error("Không thể tải và phân giải hình ảnh này."));
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        if (size <= 0) {
          resolve(result);
          return;
        }

        const sx = ((img.naturalWidth || img.width) - size) / 2;
        const sy = ((img.naturalHeight || img.height) - size) / 2;

        canvas.width = maxDimension;
        canvas.height = maxDimension;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }

        // Cắt vuông tâm ảnh và vẽ vào canvas
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxDimension, maxDimension);

        // Thử xuất WebP, fallback JPEG
        let dataUrl = "";
        try {
          dataUrl = canvas.toDataURL("image/webp", quality);
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
        } catch {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      } catch {
        resolve(result);
      }
    };

    img.src = result;
  };

  reader.readAsDataURL(file);
  return promise;
}
