# Hướng dẫn Test API Hợp đồng

## Tổng quan

Tài liệu này hướng dẫn cách test các tính năng hợp đồng trong Frontend, tương ứng với flow test trong Postman.

## Cấu trúc API

Tất cả các API được định nghĩa trong `src/config/contractAPI.ts` và được sử dụng trong `src/pages/ContractDetailPage.tsx`.

## Route

- **URL**: `/contracts/:appointmentId`
- **Ví dụ**: `/contracts/507f1f77bcf86cd799439011`

## Các bước test

### 1. Tạo hợp đồng (Staff only)

**Bước 1**: Đăng nhập với tài khoản Staff

**Bước 2**: Truy cập trang chi tiết hợp đồng với `appointmentId` chưa có hợp đồng:

```
http://localhost:5173/contracts/{appointmentId}
```

**Bước 3**: Click nút "Tạo hợp đồng" (màu xanh dương)

**Bước 4**: Trong modal:

- Chọn loại hợp đồng: "Đặt cọc" hoặc "Thanh toán đầy đủ"
- (Tùy chọn) Nhập điều khoản hợp đồng
- Click "Tạo hợp đồng"

**Kỳ vọng**:

- Hiển thị thông báo thành công
- Modal đóng lại
- Các nút action (Upload ảnh, Sinh PDF, v.v.) xuất hiện
- `contractId` được lưu để dùng cho các bước tiếp theo

**API được gọi**:

```typescript
POST /api/contracts/:appointmentId/create
Body: { contractType: "DEPOSIT" | "FULL_PAYMENT", contractTerms?: string }
```

---

### 2. Xem thông tin hợp đồng (Buyer/Seller/Staff)

**Bước 1**: Truy cập trang chi tiết hợp đồng:

```
http://localhost:5173/contracts/{appointmentId}
```

**Kỳ vọng**:

- Hiển thị đầy đủ thông tin:
  - **Thông tin người mua**: Tên, email, phone, CMND/CCCD, địa chỉ
  - **Thông tin người bán**: Tên, email, phone, CMND/CCCD, địa chỉ
  - **Thông tin xe**: Tiêu đề, hãng, model, loại, màu, năm, giá, số máy, số khung, biển số, số đăng ký, ngày đăng ký, cấp bởi, cấp cho, địa chỉ đăng ký
  - **Thông tin giao dịch**: Tiền đặt cọc, giá cuối cùng, ngày hẹn, địa điểm, loại lịch hẹn

**API được gọi**:

```typescript
GET /api/contracts/:appointmentId
Response: { contractInfo: { buyer, seller, vehicle, transaction } }
```

---

### 3. Upload ảnh hợp đồng ký (Staff only)

**Bước 1**: Đăng nhập với tài khoản Staff

**Bước 2**: Truy cập trang chi tiết hợp đồng đã có hợp đồng

**Bước 3**: Click nút "Upload ảnh" (màu xanh lá)

**Bước 4**: Trong modal:

- Chọn một hoặc nhiều file ảnh (hỗ trợ multiple)
- Click "Upload"

**Kỳ vọng**:

- Hiển thị thông báo thành công với số lượng ảnh đã upload
- Trạng thái hợp đồng cập nhật thành "Đã ký" (SIGNED)
- Timeline được reload lại
- Modal đóng lại

**API được gọi**:

```typescript
POST /api/contracts/:appointmentId/upload-photos
Form-data: photos[] (multiple image files)
Response: { contractId, uploadedPhotos, contractStatus, photos[] }
```

---

### 4. Xem Timeline hợp đồng

**Bước 1**: Truy cập trang chi tiết hợp đồng đã có hợp đồng

**Kỳ vọng**:

- Hiển thị timeline với 5 bước cố định theo thứ tự:

  1. **Ký hợp đồng** (SIGN_CONTRACT)
  2. **Công chứng** (NOTARIZATION)
  3. **Chuyển quyền sở hữu** (TRANSFER_OWNERSHIP)
  4. **Bàn giao giấy tờ và xe** (HANDOVER_PAPERS_AND_CAR)
  5. **Hoàn tất** (COMPLETED)

- Mỗi bước hiển thị:
  - Icon trạng thái (CheckCircle nếu DONE, XCircle nếu BLOCKED, Clock nếu khác)
  - Tên bước
  - Badge trạng thái (Chờ xử lý, Đang thực hiện, Hoàn thành, Bị chặn)
  - Ghi chú (nếu có)
  - Hạn chót (nếu có)
  - Thời gian cập nhật (nếu có)
  - Đính kèm (nếu có)

**API được gọi**:

```typescript
GET /api/contracts/:contractId/timeline
Response: { timeline: TimelineStepData[] }
```

---

### 5. Cập nhật Timeline (Staff only)

**Bước 1**: Đăng nhập với tài khoản Staff

**Bước 2**: Truy cập trang chi tiết hợp đồng

**Bước 3**: Click nút "Cập nhật" bên cạnh một bước trong timeline

**Bước 4**: Trong modal:

- Chọn trạng thái: Chờ xử lý / Đang thực hiện / Hoàn thành / Bị chặn
- (Tùy chọn) Nhập ghi chú
- (Tùy chọn) Chọn hạn chót (date picker)
- (Tùy chọn) Chọn file đính kèm (multiple)
- Click "Cập nhật"

**Kỳ vọng**:

- Hiển thị thông báo thành công
- Timeline được cập nhật ngay lập tức với dữ liệu mới
- Modal đóng lại
- Nếu có đính kèm, các file được hiển thị trong timeline

**API được gọi**:

```typescript
PATCH /api/contracts/:contractId/timeline/:step
Form-data: { status?, note?, dueDate?, attachments[]? }
Response: { timeline: TimelineStepData[] }
```

---

### 6. Sinh lại PDF hợp đồng (Staff only)

**Bước 1**: Đăng nhập với tài khoản Staff

**Bước 2**: Truy cập trang chi tiết hợp đồng

**Bước 3**: Click nút "Sinh PDF" (màu tím)

**Kỳ vọng**:

- Hiển thị thông báo thành công
- PDF được tạo và URL được lưu
- Có thể xem PDF bằng nút "Xem PDF"

**API được gọi**:

```typescript
POST /api/contracts/:contractId/pdf
Response: { contractPdfUrl }
```

---

### 7. Xem/Tải PDF hợp đồng (Buyer/Seller/Staff)

**Bước 1**: Truy cập trang chi tiết hợp đồng

**Bước 2**: Click nút "Xem PDF" (màu indigo)

**Kỳ vọng**:

- PDF mở trong tab mới
- Nếu backend hỗ trợ redirect, sẽ redirect trực tiếp đến PDF

**API được gọi**:

```typescript
GET /api/contracts/:contractId/pdf?redirect=true
Response: { contractPdfUrl } hoặc redirect
```

---

### 8. Hoàn tất giao dịch (Staff only)

**Bước 1**: Đăng nhập với tài khoản Staff

**Bước 2**: Truy cập trang chi tiết hợp đồng

**Bước 3**: Click nút "Hoàn tất" (màu xanh lá)

**Bước 4**: Xác nhận trong dialog

**Kỳ vọng**:

- Hiển thị thông báo thành công
- Timeline bước "Bàn giao giấy tờ và xe" (HANDOVER_PAPERS_AND_CAR) được cập nhật thành DONE
- Nút "Hoàn tất" bị disable
- Các nút action khác có thể bị disable tùy theo logic nghiệp vụ

**API được gọi**:

```typescript
POST /api/contracts/:appointmentId/complete
Response: { contractId, transactionStatus, completedAt }
```

---

### 9. Hủy giao dịch (Staff only)

**Bước 1**: Đăng nhập với tài khoản Staff

**Bước 2**: Truy cập trang chi tiết hợp đồng

**Bước 3**: Click nút "Hủy" (màu đỏ)

**Bước 4**: Trong modal:

- Nhập lý do hủy (bắt buộc)
- Click "Xác nhận hủy"

**Kỳ vọng**:

- Hiển thị thông báo thành công
- Trạng thái hợp đồng cập nhật thành "CANCELLED"
- Hiển thị banner "Đã hủy" (nếu có)
- Timeline bị khóa (không thể cập nhật)
- Nút "Hủy" bị disable

**API được gọi**:

```typescript
POST /api/contracts/:appointmentId/cancel
Body: { reason: string }
Response: { status: "CANCELLED", cancelledAt, reason }
```

---

## Xử lý lỗi

Tất cả các API đều có error handling:

- **400 Bad Request**: Hiển thị thông báo lỗi từ backend
- **403 Forbidden**: Hiển thị thông báo "Không có quyền truy cập"
- **404 Not Found**:
  - Nếu chưa có hợp đồng: Hiển thị nút "Tạo hợp đồng" (staff only)
  - Nếu không tìm thấy: Hiển thị thông báo lỗi

Tất cả lỗi được hiển thị bằng SweetAlert2 (Swal).

## Loading States

Mỗi action đều có loading state:

- Nút hiển thị spinner khi đang xử lý
- Disable các nút khác khi một action đang chạy
- Loading state được quản lý bằng `actionLoading` state

## Lưu ý

1. **contractId vs appointmentId**:

   - URL sử dụng `appointmentId`
   - Một số API cần `contractId` (timeline, PDF)
   - `contractId` được lấy từ response của `createContract` hoặc từ `getContractInfo` (nếu backend trả về)

2. **Quyền truy cập**:

   - Tạo hợp đồng, upload ảnh, cập nhật timeline, sinh PDF, hoàn tất, hủy: **Staff only**
   - Xem thông tin, xem timeline, xem PDF: **Buyer/Seller/Staff**

3. **Timeline Steps**:

   - Các bước được định nghĩa cố định trong `TIMELINE_STEPS`
   - Thứ tự: SIGN_CONTRACT → NOTARIZATION → TRANSFER_OWNERSHIP → HANDOVER_PAPERS_AND_CAR → COMPLETED

4. **File Upload**:
   - Upload ảnh hợp đồng: Form-data với `photos[]`
   - Upload đính kèm timeline: Form-data với `attachments[]`

## So sánh với Postman Flow

| Postman Test                                     | Frontend Test                             |
| ------------------------------------------------ | ----------------------------------------- |
| POST /api/contracts/:appointmentId/create        | Click "Tạo hợp đồng" → Fill form → Submit |
| GET /api/contracts/:appointmentId                | Tự động load khi vào trang                |
| POST /api/contracts/:appointmentId/upload-photos | Click "Upload ảnh" → Chọn file → Upload   |
| GET /api/contracts/:contractId/timeline          | Tự động load khi có contractId            |
| PATCH /api/contracts/:contractId/timeline/:step  | Click "Cập nhật" → Fill form → Submit     |
| POST /api/contracts/:contractId/pdf              | Click "Sinh PDF"                          |
| GET /api/contracts/:contractId/pdf               | Click "Xem PDF"                           |
| POST /api/contracts/:appointmentId/complete      | Click "Hoàn tất" → Confirm                |
| POST /api/contracts/:appointmentId/cancel        | Click "Hủy" → Fill reason → Confirm       |
