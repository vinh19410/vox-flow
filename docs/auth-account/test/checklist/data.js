window.FEATURE = "auth-account";
window.UPDATED = "2026-11-12";
window.CHECKLISTS_DATA = [
  {
    "scope": "feature",
    "target": "",
    "file": "checklist-feature.md",
    "items": [
      {
        "chk": "CHK-auth-account-001",
        "ref": [
          "FR-auth-account-029"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Các điểm vào mở màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút \"Đăng nhập\" trên header trang Landing điều hướng tới màn hình `/auth`"
      },
      {
        "chk": "CHK-auth-account-002",
        "ref": [
          "FR-auth-account-029"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Các điểm vào mở màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút \"Thi thử miễn phí\" trên header trang Landing điều hướng tới màn hình `/auth`"
      },
      {
        "chk": "CHK-auth-account-003",
        "ref": [
          "FR-auth-account-029"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Các điểm vào mở màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút CTA \"Thi thử ngay — miễn phí\" trên khu vực Hero trang Landing điều hướng tới màn hình `/auth`"
      },
      {
        "chk": "CHK-auth-account-004",
        "ref": [
          "FR-auth-account-029"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Các điểm vào mở màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút \"Quay lại Đăng nhập\" ở cuối trang `/terms` điều hướng tới màn hình `/auth`"
      },
      {
        "chk": "CHK-auth-account-005",
        "ref": [
          "FR-auth-account-029"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Các điểm vào mở màn hình /auth",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify mở trực tiếp URL `/terms` trên tab mới (không có lịch sử trước đó) và bấm nút \"Quay lại\" trên header điều hướng về `/auth`"
      },
      {
        "chk": "CHK-auth-account-006",
        "ref": [
          "FR-auth-account-029",
          "BR-auth-account-033"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Các điểm vào mở màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút \"Quay lại\" tại Bước 1/2 của màn hình `/onboarding` đưa người dùng chưa hoàn tất onboarding về màn hình `/auth`"
      },
      {
        "chk": "CHK-auth-account-007",
        "ref": [
          "FR-auth-account-006",
          "FR-auth-account-010",
          "FR-auth-account-013"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Thành phần chung, điều hướng ra & chuyển đổi chế độ trên màn hình /auth",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify mở `/auth` mặc định hiển thị chế độ đăng nhập với đủ thành phần: logo Vox Flow, nút \"Quay lại\", tiêu đề \"Đăng nhập Vox Flow\", dòng phụ \"Không cần thẻ thanh toán. Band tổng luôn miễn phí.\", nút \"Tiếp tục với Google\", dải phân cách, ô \"Email\", ô \"Mật khẩu\", nút \"Đăng nhập\", nút chuyển sang chế độ đăng ký, liên kết \"Điều khoản dịch vụ & Chính sách sử dụng\""
      },
      {
        "chk": "CHK-auth-account-008",
        "ref": [
          "FR-auth-account-029"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Thành phần chung, điều hướng ra & chuyển đổi chế độ trên màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút \"Quay lại\" trên màn hình `/auth` điều hướng về trang Landing (`/`)"
      },
      {
        "chk": "CHK-auth-account-009",
        "ref": [
          "FR-auth-account-029"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Thành phần chung, điều hướng ra & chuyển đổi chế độ trên màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm liên kết \"Điều khoản dịch vụ & Chính sách sử dụng\" trên màn hình `/auth` điều hướng sang trang `/terms`"
      },
      {
        "chk": "CHK-auth-account-010",
        "ref": [
          "FR-auth-account-010",
          "FR-auth-account-001",
          "FR-auth-account-003"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Thành phần chung, điều hướng ra & chuyển đổi chế độ trên màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút chuyển sang chế độ đăng ký cập nhật form hiển thị ô \"Tên hiển thị\", dòng gợi ý \"Tối thiểu 8 ký tự.\", nút chính \"Tạo tài khoản\" và nút chuyển về chế độ đăng nhập"
      },
      {
        "chk": "CHK-auth-account-011",
        "ref": [
          "FR-auth-account-010"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Thành phần chung, điều hướng ra & chuyển đổi chế độ trên màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify từ chế độ đăng ký bấm nút chuyển về chế độ đăng nhập ẩn ô \"Tên hiển thị\" cùng dòng gợi ý \"Tối thiểu 8 ký tự.\" và đổi nhãn nút chính thành \"Đăng nhập\""
      },
      {
        "chk": "CHK-auth-account-012",
        "ref": [
          "FR-auth-account-010"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Thành phần chung, điều hướng ra & chuyển đổi chế độ trên màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút chuyển đổi chế độ đăng nhập ↔ đăng ký xóa bỏ banner lỗi cục bộ đang hiển thị trên màn hình"
      },
      {
        "chk": "CHK-auth-account-013",
        "ref": [
          "FR-auth-account-010"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Thành phần chung, điều hướng ra & chuyển đổi chế độ trên màn hình /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm nút chuyển đổi chế độ đăng nhập ↔ đăng ký bảo toàn nguyên vẹn giá trị người dùng đã gõ ở ô \"Email\", \"Mật khẩu\" và \"Tên hiển thị\""
      },
      {
        "chk": "CHK-auth-account-014",
        "ref": [
          "FR-auth-account-015",
          "BR-auth-account-033"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Xử lý phiên sẵn có khi mở /auth",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify người dùng đã có phiên hợp lệ và đã hoàn tất onboarding mở `/auth` (không truyền tham số `error` và `redirect`) được tự động chuyển hướng sang `/app/dashboard`"
      },
      {
        "chk": "CHK-auth-account-015",
        "ref": [
          "FR-auth-account-015",
          "BR-auth-account-033",
          "BR-auth-account-001"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Xử lý phiên sẵn có khi mở /auth",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify người dùng đã có phiên và đã hoàn tất onboarding mở `/auth` kèm tham số `redirect=/app/history` (không có `error`) được tự động chuyển hướng tới `/app/history`"
      },
      {
        "chk": "CHK-auth-account-016",
        "ref": [
          "FR-auth-account-015",
          "BR-auth-account-033"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Xử lý phiên sẵn có khi mở /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify người dùng đã có phiên nhưng chưa hoàn tất onboarding mở `/auth` vẫn ở lại màn hình `/auth` (không bị chuyển tự động sang `/app/dashboard`)"
      },
      {
        "chk": "CHK-auth-account-017",
        "ref": [
          "FR-auth-account-015",
          "FR-auth-account-014",
          "BR-auth-account-033"
        ],
        "category": "Điều hướng vào & Khung chung màn hình xác thực (/auth)",
        "subcategory": "Xử lý phiên sẵn có khi mở /auth",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify người dùng đã hoàn tất onboarding mở `/auth` kèm tham số `error=access_denied` vẫn ở lại màn hình `/auth` để hiển thị banner lỗi"
      },
      {
        "chk": "CHK-auth-account-018",
        "ref": [
          "FR-auth-account-001",
          "FR-auth-account-002",
          "FR-auth-account-005",
          "BR-auth-account-002",
          "BR-auth-account-005"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng ký thành công & tự động đăng nhập",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify điền \"Tên hiển thị\" (1–50 ký tự), \"Email\" mới hợp lệ, \"Mật khẩu\" (8–128 ký tự) và bấm \"Tạo tài khoản\" tạo tài khoản thành công, tự động cấp phiên đăng nhập và tải lại toàn trang tới `/onboarding`"
      },
      {
        "chk": "CHK-auth-account-019",
        "ref": [
          "FR-auth-account-005",
          "FR-auth-account-009",
          "BR-auth-account-001",
          "BR-auth-account-002"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng ký thành công & tự động đăng nhập",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng ký thành công tại `/auth` kèm tham số `redirect=/app/forecast` tải lại toàn trang tới đúng đích `/app/forecast` thay vì `/onboarding`"
      },
      {
        "chk": "CHK-auth-account-020",
        "ref": [
          "FR-auth-account-001",
          "BR-auth-account-003"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng ký thành công & tự động đăng nhập",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify đăng ký với \"Tên hiển thị\" và \"Email\" có khoảng trắng đầu/cuối tự động cắt khoảng trắng trước khi lưu tài khoản, trong khi \"Mật khẩu\" giữ nguyên ký tự khoảng trắng"
      },
      {
        "chk": "CHK-auth-account-021",
        "ref": [
          "FR-auth-account-003",
          "NFR-auth-account-006"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng ký thành công & tự động đăng nhập",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify đăng ký với \"Mật khẩu\" đúng biên dưới 8 ký tự được chấp nhận tạo tài khoản thành công"
      },
      {
        "chk": "CHK-auth-account-022",
        "ref": [
          "FR-auth-account-003",
          "NFR-auth-account-006"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng ký thành công & tự động đăng nhập",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify đăng ký với \"Mật khẩu\" đúng biên trên 128 ký tự được chấp nhận tạo tài khoản thành công"
      },
      {
        "chk": "CHK-auth-account-023",
        "ref": [
          "FR-auth-account-001",
          "BR-auth-account-003"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng ký thành công & tự động đăng nhập",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify ô \"Tên hiển thị\" ở chế độ đăng ký giới hạn nhập tối đa 50 ký tự (`maxLength=50`) và lưu thành công tên dài đúng 50 ký tự"
      },
      {
        "chk": "CHK-auth-account-024",
        "ref": [
          "NFR-auth-account-009",
          "FR-auth-account-005"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng ký thành công & tự động đăng nhập",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify sau khi đăng ký thành công trình duyệt thực hiện tải lại toàn trang (full page load) sang trang đích để khởi động ứng dụng với phiên mới"
      },
      {
        "chk": "CHK-auth-account-025",
        "ref": [
          "FR-auth-account-004",
          "BR-auth-account-004",
          "E-auth-account-002"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Từ chối đăng ký trùng email & bảo toàn dữ liệu form",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng ký bằng email đã tồn tại tài khoản mật khẩu bị từ chối, hiển thị banner \"Email đã được sử dụng.\" và giữ nguyên tại `/auth`"
      },
      {
        "chk": "CHK-auth-account-026",
        "ref": [
          "FR-auth-account-004",
          "BR-auth-account-004",
          "E-auth-account-002"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Từ chối đăng ký trùng email & bảo toàn dữ liệu form",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng ký bằng email đã tồn tại tài khoản tạo qua Google bị từ chối, hiển thị banner \"Email đã được sử dụng.\" và giữ nguyên tại `/auth`"
      },
      {
        "chk": "CHK-auth-account-027",
        "ref": [
          "FR-auth-account-011",
          "E-auth-account-002"
        ],
        "category": "Đăng ký tài khoản bằng Email + Mật khẩu",
        "subcategory": "Từ chối đăng ký trùng email & bảo toàn dữ liệu form",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi đăng ký trả lỗi các nút và ô nhập trên form được mở khóa lại và giữ nguyên dữ liệu người dùng đã điền"
      },
      {
        "chk": "CHK-auth-account-028",
        "ref": [
          "FR-auth-account-006",
          "FR-auth-account-008",
          "BR-auth-account-002"
        ],
        "category": "Đăng nhập bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng nhập thành công & chuyển trang",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify điền \"Email\" và \"Mật khẩu\" đúng của tài khoản hiện có và bấm \"Đăng nhập\" cấp phiên thành công, tải lại toàn trang tới `/app/dashboard`"
      },
      {
        "chk": "CHK-auth-account-029",
        "ref": [
          "FR-auth-account-008",
          "FR-auth-account-009",
          "BR-auth-account-001",
          "BR-auth-account-002"
        ],
        "category": "Đăng nhập bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng nhập thành công & chuyển trang",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng nhập thành công tại `/auth` kèm tham số `redirect=/app/history` tải lại toàn trang tới đúng đích `/app/history`"
      },
      {
        "chk": "CHK-auth-account-030",
        "ref": [
          "FR-auth-account-006",
          "BR-auth-account-003"
        ],
        "category": "Đăng nhập bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng nhập thành công & chuyển trang",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify đăng nhập khi ô \"Email\" có khoảng trắng đầu/cuối tự động cắt khoảng trắng và xác thực thành công"
      },
      {
        "chk": "CHK-auth-account-031",
        "ref": [
          "FR-auth-account-003",
          "FR-auth-account-006"
        ],
        "category": "Đăng nhập bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng nhập thành công & chuyển trang",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify ở chế độ đăng nhập ô \"Mật khẩu\" không gắn ràng buộc `minLength=8` của trình duyệt (cho phép gửi chuỗi ngắn hơn 8 ký tự lên máy chủ kiểm tra)"
      },
      {
        "chk": "CHK-auth-account-032",
        "ref": [
          "NFR-auth-account-009",
          "FR-auth-account-008"
        ],
        "category": "Đăng nhập bằng Email + Mật khẩu",
        "subcategory": "Luồng đăng nhập thành công & chuyển trang",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify sau khi đăng nhập email thành công trình duyệt thực hiện tải lại toàn trang (full page load) tới đường dẫn đích"
      },
      {
        "chk": "CHK-auth-account-033",
        "ref": [
          "FR-auth-account-007",
          "BR-auth-account-006",
          "E-auth-account-001"
        ],
        "category": "Đăng nhập bằng Email + Mật khẩu",
        "subcategory": "Từ chối thông tin đăng nhập sai (chống dò email)",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng nhập với email đúng nhưng mật khẩu sai bị từ chối với mã `INVALID_EMAIL_OR_PASSWORD`, hiển thị đúng banner lỗi chuẩn của E-auth-account-001, mở khóa nút \"Đăng nhập\" và không chuyển trang"
      },
      {
        "chk": "CHK-auth-account-034",
        "ref": [
          "FR-auth-account-007",
          "BR-auth-account-006",
          "E-auth-account-001"
        ],
        "category": "Đăng nhập bằng Email + Mật khẩu",
        "subcategory": "Từ chối thông tin đăng nhập sai (chống dò email)",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng nhập với email chưa từng tồn tại trong hệ thống trả cùng mã `INVALID_EMAIL_OR_PASSWORD` và hiển thị cùng một banner lỗi chuẩn như khi nhập sai mật khẩu (chống dò email)"
      },
      {
        "chk": "CHK-auth-account-035",
        "ref": [
          "FR-auth-account-007",
          "BR-auth-account-006",
          "E-auth-account-001"
        ],
        "category": "Đăng nhập bằng Email + Mật khẩu",
        "subcategory": "Từ chối thông tin đăng nhập sai (chống dò email)",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng nhập bằng mật khẩu vào email của tài khoản chỉ liên kết Google trả cùng mã `INVALID_EMAIL_OR_PASSWORD` và hiển thị cùng một banner lỗi chuẩn của E-auth-account-001"
      },
      {
        "chk": "CHK-auth-account-036",
        "ref": [
          "FR-auth-account-013",
          "BR-auth-account-002",
          "BR-auth-account-031"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Khởi tạo & hoàn tất đăng nhập Google",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify bấm nút \"Tiếp tục với Google\" trên `/auth` (không truyền `redirect`) gửi yêu cầu đăng nhập mạng xã hội với `callbackURL` trỏ về `/app/dashboard`, `newUserCallbackURL` trỏ về `/onboarding` và `errorCallbackURL` trỏ về `/auth`"
      },
      {
        "chk": "CHK-auth-account-037",
        "ref": [
          "FR-auth-account-013",
          "BR-auth-account-001",
          "BR-auth-account-002",
          "BR-auth-account-031"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Khởi tạo & hoàn tất đăng nhập Google",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm \"Tiếp tục với Google\" tại `/auth` kèm tham số `redirect=/app/forecast` truyền cả `callbackURL` lẫn `newUserCallbackURL` trỏ về `/app/forecast` và bảo toàn `redirect` đã mã hóa URL trong `errorCallbackURL`"
      },
      {
        "chk": "CHK-auth-account-038",
        "ref": [
          "FR-auth-account-013",
          "BR-auth-account-002",
          "BR-auth-account-003",
          "BR-auth-account-017"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Khởi tạo & hoàn tất đăng nhập Google",
        "priority": 1,
        "auto": "No",
        "text": "Verify hoàn tất xác thực Google OAuth với tài khoản Google mới tự động chuẩn hóa tên hiển thị (1–50 ký tự), chấp nhận ảnh đại diện `https://` và chuyển về đích mặc định `/onboarding`"
      },
      {
        "chk": "CHK-auth-account-039",
        "ref": [
          "FR-auth-account-013",
          "BR-auth-account-002"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Khởi tạo & hoàn tất đăng nhập Google",
        "priority": 1,
        "auto": "No",
        "text": "Verify hoàn tất xác thực Google OAuth với tài khoản Google đã tồn tại cấp phiên đăng nhập và chuyển về đích mặc định `/app/dashboard`"
      },
      {
        "chk": "CHK-auth-account-040",
        "ref": [
          "FR-auth-account-014",
          "BR-auth-account-008",
          "E-auth-account-008"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Xử lý lỗi Google từ URL & lỗi khởi tạo",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify mở `/auth` kèm tham số `error=account_not_linked` hiển thị banner \"Email này đã đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email và mật khẩu.\""
      },
      {
        "chk": "CHK-auth-account-041",
        "ref": [
          "FR-auth-account-014",
          "E-auth-account-007"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Xử lý lỗi Google từ URL & lỗi khởi tạo",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify mở `/auth` kèm tham số `error` mang giá trị khác `account_not_linked` (ví dụ `error=access_denied`) hiển thị đúng banner lỗi chuẩn của E-auth-account-007 báo đăng nhập Google thất bại/bị hủy"
      },
      {
        "chk": "CHK-auth-account-042",
        "ref": [
          "FR-auth-account-014"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Xử lý lỗi Google từ URL & lỗi khởi tạo",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify mở `/auth` có tham số `error` lặp lại nhiều lần trên chuỗi truy vấn URL lấy phần tử đầu tiên để hiển thị thông báo tương ứng"
      },
      {
        "chk": "CHK-auth-account-043",
        "ref": [
          "FR-auth-account-014"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Xử lý lỗi Google từ URL & lỗi khởi tạo",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi đang có banner lỗi từ tham số `error` trên URL mà thao tác trên form phát sinh lỗi cục bộ mới thì banner ưu tiên hiển thị thông báo lỗi cục bộ mới"
      },
      {
        "chk": "CHK-auth-account-044",
        "ref": [
          "FR-auth-account-013",
          "E-auth-account-006"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Xử lý lỗi Google từ URL & lỗi khởi tạo",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi khởi tạo đăng nhập Google trả lỗi ngay (khác `429`) màn hình hiển thị banner \"Đăng nhập Google không thành công. Vui lòng thử lại.\" và mở khóa lại nút \"Tiếp tục với Google\""
      },
      {
        "chk": "CHK-auth-account-045",
        "ref": [
          "BR-auth-account-031",
          "FR-auth-account-009"
        ],
        "category": "Đăng nhập bằng Google OAuth",
        "subcategory": "Xử lý lỗi Google từ URL & lỗi khởi tạo",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify bấm \"Tiếp tục với Google\" tại `/auth` kèm tham số `redirect` không an toàn (ví dụ `//evil.com`) loại bỏ `redirect` và đặt `errorCallbackURL` trỏ về `/auth` trơn"
      },
      {
        "chk": "CHK-auth-account-046",
        "ref": [
          "FR-auth-account-016",
          "FR-auth-account-017",
          "BR-auth-account-026"
        ],
        "category": "Đăng xuất & Quản lý trạng thái phiên phía học viên",
        "subcategory": "Đăng xuất từ các điểm vào giao diện",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify trên màn hình desktop bấm nút icon `aria-label=\"Đăng xuất\"` trên thẻ người dùng ở sidebar hủy phiên thành công và điều hướng về `/auth`"
      },
      {
        "chk": "CHK-auth-account-047",
        "ref": [
          "FR-auth-account-016",
          "FR-auth-account-017",
          "BR-auth-account-026"
        ],
        "category": "Đăng xuất & Quản lý trạng thái phiên phía học viên",
        "subcategory": "Đăng xuất từ các điểm vào giao diện",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify trên màn hình mobile mở menu \"Tài khoản người dùng\" ở thanh trên cùng và chọn mục \"Đăng xuất\" hủy phiên thành công và điều hướng về `/auth`"
      },
      {
        "chk": "CHK-auth-account-048",
        "ref": [
          "FR-auth-account-016",
          "FR-auth-account-017",
          "BR-auth-account-026"
        ],
        "category": "Đăng xuất & Quản lý trạng thái phiên phía học viên",
        "subcategory": "Đăng xuất từ các điểm vào giao diện",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify tại màn hình Hồ sơ (`/app/profile`) bấm nút \"Đăng xuất tài khoản\" trong thẻ \"Tài khoản & Phiên\" hủy phiên thành công và điều hướng về `/auth`"
      },
      {
        "chk": "CHK-auth-account-049",
        "ref": [
          "FR-auth-account-016",
          "BR-auth-account-026"
        ],
        "category": "Đăng xuất & Quản lý trạng thái phiên phía học viên",
        "subcategory": "Dọn dẹp trạng thái cục bộ & xử lý lỗi đăng xuất",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng xuất thành công xóa khóa trạng thái prototype trong `sessionStorage` và xóa bộ nhớ đệm trạng thái onboarding (`clearOnboardedUserCache`)"
      },
      {
        "chk": "CHK-auth-account-050",
        "ref": [
          "FR-auth-account-018",
          "BR-auth-account-029"
        ],
        "category": "Đăng xuất & Quản lý trạng thái phiên phía học viên",
        "subcategory": "Dọn dẹp trạng thái cục bộ & xử lý lỗi đăng xuất",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi phiên chuyển sang không còn người dùng đăng nhập, trạng thái dữ liệu học viên phía giao diện được đặt về mặc định nhưng vẫn giữ nguyên hai tùy chọn `mode` và `voice`"
      },
      {
        "chk": "CHK-auth-account-051",
        "ref": [
          "FR-auth-account-018"
        ],
        "category": "Đăng xuất & Quản lý trạng thái phiên phía học viên",
        "subcategory": "Dọn dẹp trạng thái cục bộ & xử lý lỗi đăng xuất",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify trong lúc thông tin phiên đang tải (`isPending`), hệ thống chưa reset trạng thái ứng dụng của học viên"
      },
      {
        "chk": "CHK-auth-account-052",
        "ref": [
          "FR-auth-account-016",
          "BR-auth-account-025",
          "E-auth-account-009"
        ],
        "category": "Đăng xuất & Quản lý trạng thái phiên phía học viên",
        "subcategory": "Dọn dẹp trạng thái cục bộ & xử lý lỗi đăng xuất",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify khi yêu cầu hủy phiên trả lỗi HTTP, hệ thống hiển thị toast \"Đăng xuất thất bại. Vui lòng thử lại.\", giữ nguyên trạng thái cục bộ và không điều hướng rời trang"
      },
      {
        "chk": "CHK-auth-account-053",
        "ref": [
          "FR-auth-account-016",
          "BR-auth-account-025",
          "E-auth-account-009"
        ],
        "category": "Đăng xuất & Quản lý trạng thái phiên phía học viên",
        "subcategory": "Dọn dẹp trạng thái cục bộ & xử lý lỗi đăng xuất",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi yêu cầu hủy phiên ném ngoại lệ mất kết nối mạng, hệ thống hiển thị toast \"Đăng xuất thất bại. Vui lòng thử lại.\" và giữ nguyên người dùng ở trang hiện tại"
      },
      {
        "chk": "CHK-auth-account-054",
        "ref": [
          "FR-auth-account-019",
          "BR-auth-account-021"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify khách chưa có phiên truy cập `/onboarding` bị chuyển hướng về `/auth` kèm tham số `redirect` bằng đường dẫn đang định vào"
      },
      {
        "chk": "CHK-auth-account-055",
        "ref": [
          "FR-auth-account-020",
          "FR-auth-account-019",
          "BR-auth-account-021"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify khách chưa có phiên truy cập các nhóm route bảo vệ (`/app/dashboard`, `/exam`, `/scoring`) đều bị chuyển hướng về `/auth` kèm tham số `redirect` tương ứng"
      },
      {
        "chk": "CHK-auth-account-056",
        "ref": [
          "FR-auth-account-019",
          "NFR-auth-account-007",
          "BR-auth-account-021"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi việc kiểm tra phiên tại route bảo vệ gặp lỗi mạng, hệ thống xử lý như chưa đăng nhập và chuyển hướng về `/auth` kèm `redirect`"
      },
      {
        "chk": "CHK-auth-account-057",
        "ref": [
          "FR-auth-account-020",
          "BR-auth-account-022"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify học viên đã có phiên nhưng hồ sơ chưa hoàn tất onboarding (`onboardedAt` rỗng) truy cập `/app/dashboard`, `/exam` và `/scoring` đều bị chuyển hướng về `/onboarding` không kèm `redirect`"
      },
      {
        "chk": "CHK-auth-account-058",
        "ref": [
          "FR-auth-account-020",
          "FR-auth-account-021",
          "BR-auth-account-022",
          "BR-auth-account-023"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify học viên có phiên và hồ sơ đã có `onboardedAt` vào được `/app/dashboard` và được ghi nhớ trạng thái đã onboarding trong bộ nhớ phiên làm việc cho các lần chuyển sang `/exam`, `/scoring` tiếp theo"
      },
      {
        "chk": "CHK-auth-account-059",
        "ref": [
          "FR-auth-account-021",
          "BR-auth-account-023"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify kết quả kiểm tra \"chưa hoàn tất onboarding\" không bị ghi nhớ vào bộ nhớ đệm, đảm bảo lần vào lại sau khi hoàn tất onboarding vẫn kiểm tra mới"
      },
      {
        "chk": "CHK-auth-account-060",
        "ref": [
          "FR-auth-account-022",
          "BR-auth-account-024"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi học viên có phiên mở `/app/dashboard` mà dịch vụ tải hồ sơ trả lỗi máy chủ (không phải lỗi chuyển hướng), guard vẫn cho phép đi tiếp (fail-open), ghi cảnh báo console và không lưu cache"
      },
      {
        "chk": "CHK-auth-account-061",
        "ref": [
          "FR-auth-account-023",
          "BR-auth-account-028"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify học viên có phiên và đã hoàn tất onboarding mở trực tiếp `/onboarding` bị tự động chuyển hướng sang `/app/dashboard`"
      },
      {
        "chk": "CHK-auth-account-062",
        "ref": [
          "FR-auth-account-023"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ route yêu cầu phiên & hoàn tất onboarding",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify học viên có phiên mở `/onboarding` khi lời gọi kiểm tra hồ sơ gặp lỗi vẫn được cho ở lại trang `/onboarding` (lỗi bị bỏ qua)"
      },
      {
        "chk": "CHK-auth-account-063",
        "ref": [
          "FR-auth-account-024",
          "BR-auth-account-027"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ khu vực quản trị (/admin/disputes, /admin/forecast)",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify khách chưa có phiên mở `/admin/disputes` và `/admin/forecast` đều bị chuyển hướng về `/auth`"
      },
      {
        "chk": "CHK-auth-account-064",
        "ref": [
          "FR-auth-account-024",
          "FR-auth-account-026",
          "BR-auth-account-018",
          "BR-auth-account-019",
          "BR-auth-account-027",
          "E-auth-account-011"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ khu vực quản trị (/admin/disputes, /admin/forecast)",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify học viên có phiên nhưng email không nằm trong `ADMIN_EMAILS` mở `/admin/disputes` và `/admin/forecast` bị máy chủ từ chối `FORBIDDEN` (\"Admin access required\") và giao diện chuyển hướng về `/app/dashboard`"
      },
      {
        "chk": "CHK-auth-account-065",
        "ref": [
          "FR-auth-account-026",
          "BR-auth-account-019",
          "E-auth-account-011"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ khu vực quản trị (/admin/disputes, /admin/forecast)",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi biến cấu hình `ADMIN_EMAILS` để rỗng trên máy chủ thì không tài khoản nào được cấp quyền quản trị (mọi truy cập admin đều bị từ chối `FORBIDDEN`)"
      },
      {
        "chk": "CHK-auth-account-066",
        "ref": [
          "FR-auth-account-024",
          "BR-auth-account-027"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ khu vực quản trị (/admin/disputes, /admin/forecast)",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi có phiên mở `/admin/disputes` và `/admin/forecast` mà lời gọi kiểm tra quyền admin gặp lỗi mạng, giao diện chuyển hướng an toàn về `/app/dashboard` (fail-closed)"
      },
      {
        "chk": "CHK-auth-account-067",
        "ref": [
          "FR-auth-account-024",
          "FR-auth-account-026",
          "BR-auth-account-018",
          "BR-auth-account-027"
        ],
        "category": "Bảo vệ Route học viên & Khu vực Quản trị (Route Guards)",
        "subcategory": "Bảo vệ khu vực quản trị (/admin/disputes, /admin/forecast)",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify người dùng có phiên với email khớp `ADMIN_EMAILS` (không phân biệt chữ hoa/thường và khoảng trắng bao ngoài) truy cập thành công vào cả hai màn hình `/admin/disputes` và `/admin/forecast`"
      },
      {
        "chk": "CHK-auth-account-068",
        "ref": [
          "FR-auth-account-006",
          "E-auth-account-014"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Kiểm tra HTML5 gốc & Ràng buộc Tên hiển thị / Mật khẩu",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify bấm \"Đăng nhập\" khi để trống từng trường bắt buộc (\"Email\", \"Mật khẩu\") đều bị trình duyệt chặn gửi kèm thông báo kiểm tra HTML5 gốc"
      },
      {
        "chk": "CHK-auth-account-069",
        "ref": [
          "FR-auth-account-001",
          "E-auth-account-014"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Kiểm tra HTML5 gốc & Ràng buộc Tên hiển thị / Mật khẩu",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify ở chế độ đăng ký bấm \"Tạo tài khoản\" khi để trống ô \"Tên hiển thị\" bị trình duyệt chặn gửi kèm thông báo kiểm tra HTML5 gốc"
      },
      {
        "chk": "CHK-auth-account-070",
        "ref": [
          "FR-auth-account-001",
          "FR-auth-account-006",
          "E-auth-account-014"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Kiểm tra HTML5 gốc & Ràng buộc Tên hiển thị / Mật khẩu",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify nhập sai định dạng địa chỉ email (ví dụ thiếu ký tự `@`) vào ô \"Email\" và bấm gửi form bị trình duyệt chặn gửi kèm thông báo kiểm tra HTML5 gốc"
      },
      {
        "chk": "CHK-auth-account-071",
        "ref": [
          "FR-auth-account-003",
          "E-auth-account-014"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Kiểm tra HTML5 gốc & Ràng buộc Tên hiển thị / Mật khẩu",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify ở chế độ đăng ký nhập \"Mật khẩu\" ngắn hơn 8 ký tự (ví dụ 7 ký tự) và bấm \"Tạo tài khoản\" bị trình duyệt chặn gửi do ràng buộc `minLength=8`"
      },
      {
        "chk": "CHK-auth-account-072",
        "ref": [
          "FR-auth-account-001",
          "BR-auth-account-003",
          "E-auth-account-016"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Kiểm tra HTML5 gốc & Ràng buộc Tên hiển thị / Mật khẩu",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify đăng ký với ô \"Tên hiển thị\" chỉ chứa toàn khoảng trắng (sau `trim()` còn 0 ký tự) bị máy chủ trả `INVALID_NAME` và màn hình hiển thị banner \"Tên hiển thị không hợp lệ (1–50 ký tự).\""
      },
      {
        "chk": "CHK-auth-account-073",
        "ref": [
          "FR-auth-account-003",
          "FR-auth-account-012",
          "NFR-auth-account-006",
          "E-auth-account-004"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Kiểm tra HTML5 gốc & Ràng buộc Tên hiển thị / Mật khẩu",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify đăng ký với \"Mật khẩu\" dài 129 ký tự (vượt ngưỡng tối đa 128 ký tự của máy chủ) bị từ chối và hiển thị banner \"Đăng ký không thành công. Vui lòng thử lại.\""
      },
      {
        "chk": "CHK-auth-account-074",
        "ref": [
          "FR-auth-account-003",
          "FR-auth-account-012",
          "NFR-auth-account-006",
          "E-auth-account-003"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Kiểm tra HTML5 gốc & Ràng buộc Tên hiển thị / Mật khẩu",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify đăng nhập với \"Mật khẩu\" dài 129 ký tự bị máy chủ từ chối và hiển thị banner \"Đăng nhập không thành công. Vui lòng thử lại.\""
      },
      {
        "chk": "CHK-auth-account-075",
        "ref": [
          "FR-auth-account-012",
          "BR-auth-account-007",
          "E-auth-account-003"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Lỗi tổng quát, Mất kết nối & Giới hạn tốc độ (429) trên UI",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi đăng nhập email gặp mã lỗi máy chủ không thuộc danh mục đã biết (ví dụ HTTP 500), màn hình hiển thị banner \"Đăng nhập không thành công. Vui lòng thử lại.\" và không chuyển trang"
      },
      {
        "chk": "CHK-auth-account-076",
        "ref": [
          "FR-auth-account-012",
          "BR-auth-account-007",
          "E-auth-account-004"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Lỗi tổng quát, Mất kết nối & Giới hạn tốc độ (429) trên UI",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi đăng ký email gặp mã lỗi máy chủ không thuộc danh mục đã biết (ví dụ HTTP 500), màn hình hiển thị banner \"Đăng ký không thành công. Vui lòng thử lại.\" và không chuyển trang"
      },
      {
        "chk": "CHK-auth-account-077",
        "ref": [
          "FR-auth-account-012",
          "FR-auth-account-013",
          "NFR-auth-account-007",
          "E-auth-account-005"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Lỗi tổng quát, Mất kết nối & Giới hạn tốc độ (429) trên UI",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify khi mất kết nối mạng lúc gửi xác thực trên màn hình `/auth` (email đăng nhập, email đăng ký, Google), giao diện không bị treo mà mở khóa nút và hiển thị banner \"Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.\""
      },
      {
        "chk": "CHK-auth-account-078",
        "ref": [
          "FR-auth-account-012",
          "FR-auth-account-013",
          "NFR-auth-account-006",
          "BR-auth-account-032",
          "E-auth-account-015"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Lỗi tổng quát, Mất kết nối & Giới hạn tốc độ (429) trên UI",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify khi gửi yêu cầu xác thực trên `/auth` vượt ngưỡng giới hạn tốc độ (`3 lần/10s`, máy chủ trả HTTP `429`), màn hình hiển thị banner \"Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây.\" và không khóa cứng tài khoản sau khi hết cửa sổ chờ"
      },
      {
        "chk": "CHK-auth-account-079",
        "ref": [
          "FR-auth-account-028",
          "BR-auth-account-009"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Quy tắc hợp lệ hóa Ảnh đại diện khi tạo/cập nhật tài khoản",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify yêu cầu tạo/cập nhật tài khoản không truyền trường `image` bỏ qua bước kiểm tra ảnh và giữ nguyên ảnh đại diện hiện tại của người dùng"
      },
      {
        "chk": "CHK-auth-account-080",
        "ref": [
          "FR-auth-account-028",
          "BR-auth-account-010",
          "BR-auth-account-013",
          "BR-auth-account-014",
          "BR-auth-account-015",
          "NFR-auth-account-004"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Quy tắc hợp lệ hóa Ảnh đại diện khi tạo/cập nhật tài khoản",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify cập nhật tài khoản chấp nhận trọn bộ định dạng ảnh hợp lệ: URL `https://`, 6 mẫu tĩnh `/avatars/*`, data URL `webp`/`jpeg`/`png` base64 `<= 32.000` ký tự, và giá trị `null` để xóa ảnh"
      },
      {
        "chk": "CHK-auth-account-081",
        "ref": [
          "FR-auth-account-028",
          "BR-auth-account-012",
          "NFR-auth-account-004",
          "E-auth-account-012"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Quy tắc hợp lệ hóa Ảnh đại diện khi tạo/cập nhật tài khoản",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify giá trị ảnh đúng biên 32.000 ký tự được chấp nhận lưu thành công"
      },
      {
        "chk": "CHK-auth-account-082",
        "ref": [
          "FR-auth-account-028",
          "BR-auth-account-012",
          "NFR-auth-account-004",
          "E-auth-account-012"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Quy tắc hợp lệ hóa Ảnh đại diện khi tạo/cập nhật tài khoản",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify giá trị ảnh dài 32.001 ký tự bị từ chối với lỗi `INVALID_IMAGE`"
      },
      {
        "chk": "CHK-auth-account-083",
        "ref": [
          "FR-auth-account-028",
          "BR-auth-account-011",
          "BR-auth-account-013",
          "BR-auth-account-014",
          "BR-auth-account-015",
          "BR-auth-account-016",
          "NFR-auth-account-004",
          "E-auth-account-012"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Quy tắc hợp lệ hóa Ảnh đại diện khi tạo/cập nhật tài khoản",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify yêu cầu tạo/cập nhật tài khoản gửi giá trị ảnh vi phạm bảo mật (chuỗi rỗng, không phải chuỗi, `http://`, SVG data URL, `javascript:`, đường dẫn nội bộ ngoài `/avatars/` như `/etc/passwd`) bị hủy thao tác với lỗi `INVALID_IMAGE` và giữ nguyên dữ liệu cũ"
      },
      {
        "chk": "CHK-auth-account-109",
        "ref": [
          "FR-auth-account-001",
          "BR-auth-account-004",
          "BR-auth-account-034",
          "E-auth-account-017"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Quy tắc hợp lệ hóa Ảnh đại diện khi tạo/cập nhật tài khoản",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify yêu cầu cập nhật thông tin người dùng có kèm trường thay đổi địa chỉ email bị từ chối với lỗi `EMAIL_CAN_NOT_BE_UPDATED` và giữ nguyên email gốc của tài khoản"
      },
      {
        "chk": "CHK-auth-account-110",
        "ref": [
          "NFR-auth-account-011",
          "FR-auth-account-025"
        ],
        "category": "Validation & Error Handling (Form, Tên hiển thị, Ảnh đại diện & Lỗi hệ thống)",
        "subcategory": "Quy tắc hợp lệ hóa Ảnh đại diện khi tạo/cập nhật tài khoản",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify truy vấn thông tin phiên đăng nhập chỉ trả dữ liệu định danh của chính chủ sở hữu phiên đang hoạt động và không lộ thông tin tài khoản của người dùng khác"
      },
      {
        "chk": "CHK-auth-account-084",
        "ref": [
          "FR-auth-account-009",
          "NFR-auth-account-003",
          "BR-auth-account-001"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Chống Open Redirect trên tham số redirect",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify hoàn tất đăng nhập và đăng ký khi tham số `redirect` trỏ ra domain ngoài (`https://evil.com`, `//evil.com/hack`, `/\\evil.com`) đều bỏ qua tham số độc hại và chuyển về đích mặc định nội bộ an toàn"
      },
      {
        "chk": "CHK-auth-account-085",
        "ref": [
          "FR-auth-account-009",
          "NFR-auth-account-003",
          "BR-auth-account-001"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Chống Open Redirect trên tham số redirect",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify hoàn tất đăng nhập và đăng ký khi tham số `redirect` mang tiền tố `/auth` và `/login` (bao gồm cả `/authors`) đều bỏ qua tham số để chống vòng lặp xác thực và chuyển về đích mặc định"
      },
      {
        "chk": "CHK-auth-account-086",
        "ref": [
          "FR-auth-account-015",
          "BR-auth-account-001"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Chống Open Redirect trên tham số redirect",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify khi tham số `redirect` truyền vào route `/auth` không phải kiểu chuỗi thì bị bỏ qua an toàn"
      },
      {
        "chk": "CHK-auth-account-087",
        "ref": [
          "NFR-auth-account-001",
          "NFR-auth-account-006"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Bảo mật Cookie phiên, CORS/Origin & Cổng API / Audio",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify cookie phiên được cấp sau đăng ký/đăng nhập mang đủ ba thuộc tính `HttpOnly`, `Secure`, `SameSite=None` (JavaScript phía trình duyệt không đọc được qua `document.cookie`) và thời hạn 7 ngày gia hạn trượt 24 giờ"
      },
      {
        "chk": "CHK-auth-account-088",
        "ref": [
          "NFR-auth-account-005"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Bảo mật Cookie phiên, CORS/Origin & Cổng API / Audio",
        "priority": 2,
        "auto": "No",
        "text": "Verify cấu hình triển khai và bundle phía client không lộ khóa bí mật `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (chỉ nạp từ biến môi trường máy chủ)"
      },
      {
        "chk": "CHK-auth-account-089",
        "ref": [
          "NFR-auth-account-002"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Bảo mật Cookie phiên, CORS/Origin & Cổng API / Audio",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify máy chủ xác thực chỉ chấp nhận yêu cầu thay đổi trạng thái từ `CORS_ORIGIN` tin cậy (đã bỏ dấu `/` cuối) và từ chối Origin lạ với mã HTTP `403`"
      },
      {
        "chk": "CHK-auth-account-090",
        "ref": [
          "FR-auth-account-025",
          "FR-auth-account-026",
          "E-auth-account-010"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Bảo mật Cookie phiên, CORS/Origin & Cổng API / Audio",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify gọi các thủ tục API riêng tư và quản trị khi thiếu phiên đăng nhập đều bị từ chối với mã `UNAUTHORIZED` kèm thông điệp `\"Authentication required\"`"
      },
      {
        "chk": "CHK-auth-account-091",
        "ref": [
          "FR-auth-account-027",
          "E-auth-account-013"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Bảo mật Cookie phiên, CORS/Origin & Cổng API / Audio",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify gọi điểm tải lên audio không kèm phiên đăng nhập bị từ chối mã HTTP `401` kèm JSON `{\"error\":\"Unauthorized\"}`"
      },
      {
        "chk": "CHK-auth-account-092",
        "ref": [
          "FR-auth-account-027",
          "E-auth-account-013"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Bảo mật Cookie phiên, CORS/Origin & Cổng API / Audio",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify gọi điểm tải xuống audio không kèm phiên đăng nhập bị từ chối mã HTTP `401` kèm chuỗi `\"Unauthorized\"`"
      },
      {
        "chk": "CHK-auth-account-093",
        "ref": [
          "BR-auth-account-020",
          "FR-auth-account-026"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Bảo mật Cookie phiên, CORS/Origin & Cổng API / Audio",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify chủ sở hữu attempt và quản trị viên thuộc `ADMIN_EMAILS` (khi học viên đã bật đồng ý chia sẻ `true`) đều được phép nghe audio của attempt"
      },
      {
        "chk": "CHK-auth-account-094",
        "ref": [
          "BR-auth-account-020",
          "FR-auth-account-026"
        ],
        "category": "Security cơ bản (Chống Open Redirect, Phiên/Cookie & Phân quyền tài nguyên)",
        "subcategory": "Bảo mật Cookie phiên, CORS/Origin & Cổng API / Audio",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify người dùng không phải chủ sở hữu attempt (và quản trị viên khi chưa có đồng ý chia sẻ `true` / `ADMIN_EMAILS` rỗng) bị từ chối quyền nghe audio của attempt"
      },
      {
        "chk": "CHK-auth-account-095",
        "ref": [
          "FR-auth-account-011"
        ],
        "category": "Loading & Phản hồi giao diện (Loading State)",
        "subcategory": "Khóa thao tác & Trạng thái chờ trên màn hình /auth",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify trong lúc yêu cầu gửi form email đang xử lý, toàn bộ ô nhập, nút submit, nút chuyển chế độ và nút \"Tiếp tục với Google\" đều bị vô hiệu hóa (`disabled`) kèm biểu tượng xoay (spinner) trên nút submit"
      },
      {
        "chk": "CHK-auth-account-096",
        "ref": [
          "FR-auth-account-011",
          "FR-auth-account-013"
        ],
        "category": "Loading & Phản hồi giao diện (Loading State)",
        "subcategory": "Khóa thao tác & Trạng thái chờ trên màn hình /auth",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify ngay khi bấm nút \"Tiếp tục với Google\", nhãn nút đổi thành \"Đang kết nối...\" kèm spinner và toàn bộ ô nhập cùng các nút khác trên màn hình `/auth` đều bị vô hiệu hóa"
      },
      {
        "chk": "CHK-auth-account-097",
        "ref": [
          "NFR-auth-account-008"
        ],
        "category": "Accessibility cơ bản",
        "subcategory": "Nhãn trường, Autocomplete & Điều hướng bàn phím",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify mọi ô nhập trên màn hình `/auth` (\"Tên hiển thị\", \"Email\", \"Mật khẩu\") đều gắn kết đúng `label`–`input` (`htmlFor`/`id`) và đặt đúng thuộc tính `autoComplete` theo chế độ (`name`, `email`, `current-password` khi đăng nhập, `new-password` khi đăng ký)"
      },
      {
        "chk": "CHK-auth-account-098",
        "ref": [],
        "category": "Accessibility cơ bản",
        "subcategory": "Nhãn trường, Autocomplete & Điều hướng bàn phím",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify người dùng điều hướng bằng phím `Tab` / `Shift+Tab` đi qua đúng thứ tự các phần tử tương tác trên `/auth` và nhấn `Enter` tại ô nhập kích hoạt gửi form"
      },
      {
        "chk": "CHK-auth-account-099",
        "ref": [
          "FR-auth-account-017"
        ],
        "category": "Accessibility cơ bản",
        "subcategory": "Nhãn trường, Autocomplete & Điều hướng bàn phím",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify nút icon đăng xuất trên sidebar desktop có `aria-label=\"Đăng xuất\"` và nút mở menu tài khoản trên header mobile có `aria-label=\"Tài khoản người dùng\"`"
      },
      {
        "chk": "CHK-auth-account-100",
        "ref": [],
        "category": "Responsive cơ bản",
        "subcategory": "Hiển thị màn hình /auth & Điểm vào đăng xuất theo kích thước màn hình",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify màn hình `/auth` hiển thị cân đối, không bị tràn ngang và các nút bấm chính cao tối thiểu `48px` trên cả 3 kích thước viewport (Mobile 375px, Tablet 768px, Desktop 1280px)"
      },
      {
        "chk": "CHK-auth-account-101",
        "ref": [
          "FR-auth-account-017"
        ],
        "category": "Responsive cơ bản",
        "subcategory": "Hiển thị màn hình /auth & Điểm vào đăng xuất theo kích thước màn hình",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify ở viewport Desktop (`>= 1024px`) hiển thị thẻ người dùng kèm nút đăng xuất trên sidebar trái, còn ở viewport Mobile (`< 1024px`) hiển thị menu tài khoản chứa mục \"Đăng xuất\" trên header đầu trang"
      },
      {
        "chk": "CHK-auth-account-102",
        "ref": [
          "FR-auth-account-011"
        ],
        "category": "Edge Cases & Tương tác trình duyệt",
        "subcategory": "Bấm đúp, Tải lại trang, Nút Back/Forward & Đa tab",
        "priority": 1,
        "auto": "Yes",
        "text": "Verify bấm đúp liên tiếp vào nút submit form xác thực và nút \"Tiếp tục với Google\" chỉ gửi đi duy nhất 1 yêu cầu xác thực lên máy chủ"
      },
      {
        "chk": "CHK-auth-account-103",
        "ref": [
          "FR-auth-account-016",
          "FR-auth-account-020",
          "BR-auth-account-026"
        ],
        "category": "Edge Cases & Tương tác trình duyệt",
        "subcategory": "Bấm đúp, Tải lại trang, Nút Back/Forward & Đa tab",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify sau khi đăng xuất thành công về `/auth`, bấm nút Back của trình duyệt quay lại trang `/app/dashboard` trước đó bị guard chặn và chuyển về `/auth`"
      },
      {
        "chk": "CHK-auth-account-104",
        "ref": [
          "FR-auth-account-020"
        ],
        "category": "Edge Cases & Tương tác trình duyệt",
        "subcategory": "Bấm đúp, Tải lại trang, Nút Back/Forward & Đa tab",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify tải lại trang (`F5` / Refresh) khi đang ở `/app/dashboard` bảo toàn nguyên vẹn phiên đăng nhập hợp lệ của học viên"
      },
      {
        "chk": "CHK-auth-account-105",
        "ref": [
          "FR-auth-account-015"
        ],
        "category": "Edge Cases & Tương tác trình duyệt",
        "subcategory": "Bấm đúp, Tải lại trang, Nút Back/Forward & Đa tab",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify tải lại trang (`F5` / Refresh) khi đang ở `/auth` kèm tham số `redirect=/app/forecast` giữ nguyên tham số `redirect` cho lần đăng nhập tiếp theo"
      },
      {
        "chk": "CHK-auth-account-106",
        "ref": [
          "FR-auth-account-019",
          "FR-auth-account-025"
        ],
        "category": "Edge Cases & Tương tác trình duyệt",
        "subcategory": "Bấm đúp, Tải lại trang, Nút Back/Forward & Đa tab",
        "priority": 2,
        "auto": "Yes",
        "text": "Verify khi phiên đăng nhập đã bị hủy ở một tab khác trong cùng trình duyệt, thao tác điều hướng sang route bảo vệ ở tab hiện tại bị chặn và chuyển về `/auth`"
      },
      {
        "chk": "CHK-auth-account-107",
        "ref": [
          "FR-auth-account-001",
          "FR-auth-account-006",
          "NFR-auth-account-008"
        ],
        "category": "Edge Cases & Tương tác trình duyệt",
        "subcategory": "Bấm đúp, Tải lại trang, Nút Back/Forward & Đa tab",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify dán dữ liệu (copy/paste) và tự động điền từ trình quản lý mật khẩu (autofill) vào ô \"Email\" cùng \"Mật khẩu\" cập nhật đúng giá trị form để gửi đăng nhập thành công"
      },
      {
        "chk": "CHK-auth-account-108",
        "ref": [
          "FR-auth-account-029"
        ],
        "category": "Edge Cases & Tương tác trình duyệt",
        "subcategory": "Bấm đúp, Tải lại trang, Nút Back/Forward & Đa tab",
        "priority": 3,
        "auto": "Yes",
        "text": "Verify giữ phím bổ trợ mở tab mới (`Ctrl`/`Cmd` + click) vào liên kết \"Điều khoản dịch vụ & Chính sách sử dụng\" trên `/auth` mở trang `/terms` ở tab mới mà không làm mất dữ liệu đang nhập trên tab `/auth`"
      }
    ]
  }
];
