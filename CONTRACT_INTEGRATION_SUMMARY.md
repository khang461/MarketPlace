# Tóm tắt tích hợp API Hợp đồng

## Đã hoàn thành

### 1. API Service (`src/config/contractAPI.ts`)

- ✅ Tạo hợp đồng: `createContract()`
- ✅ Lấy thông tin hợp đồng: `getContractInfo()`
- ✅ Upload ảnh hợp đồng: `uploadContractPhotos()`
- ✅ Lấy timeline: `getContractTimeline()`
- ✅ Cập nhật timeline: `updateTimelineStep()`
- ✅ Sinh PDF: `generateContractPdf()`
- ✅ Lấy PDF: `getContractPdf()`
- ✅ Hoàn tất giao dịch: `completeTransaction()`
- ✅ Hủy giao dịch: `cancelContract()`

### 2. Types & Interfaces

- ✅ Định nghĩa đầy đủ types cho Contract, ContractInfo, TimelineStepData, v.v.
- ✅ Export types để sử dụng trong các component khác

### 3. UI Component (`src/pages/ContractDetailPage.tsx`)

- ✅ Hiển thị thông tin hợp đồng (buyer, seller, vehicle, transaction)
- ✅ Timeline với 5 bước cố định
- ✅ Modal tạo hợp đồng (staff only)
- ✅ Modal upload ảnh (staff only)
- ✅ Modal cập nhật timeline (staff only)
- ✅ Modal hủy giao dịch (staff only)
- ✅ Nút sinh/tải PDF
- ✅ Nút hoàn tất giao dịch (staff only)
- ✅ Nút hủy giao dịch (staff only)

### 4. Error Handling & Loading States

- ✅ Xử lý lỗi 400/403/404 với SweetAlert2
- ✅ Loading states cho mỗi action
- ✅ Disable buttons khi đang xử lý

### 5. Routing

- ✅ Thêm route `/contracts/:appointmentId` vào `App.tsx`
- ✅ Protected route (yêu cầu đăng nhập)

### 6. Documentation

- ✅ File hướng dẫn test: `CONTRACT_API_TEST_GUIDE.md`

## Cấu trúc Files

```
src/
├── config/
│   └── contractAPI.ts          # API service với tất cả functions
├── pages/
│   └── ContractDetailPage.tsx  # Trang chi tiết hợp đồng
└── App.tsx                      # Đã thêm route

CONTRACT_API_TEST_GUIDE.md       # Hướng dẫn test chi tiết
CONTRACT_INTEGRATION_SUMMARY.md  # File này
```

## Lưu ý quan trọng

### contractId vs appointmentId

- **URL sử dụng**: `appointmentId` (ví dụ: `/contracts/507f1f77bcf86cd799439011`)
- **Một số API cần**: `contractId` (timeline, PDF)
- **Cách lấy contractId**:
  1. Từ response của `createContract()` → lưu vào state
  2. Từ response của `uploadContractPhotos()` → lưu vào state
  3. Từ response của `getContractInfo()` → nếu backend trả về

**Nếu backend không trả về contractId trong getContractInfo**, có thể cần:

- Thêm field `contractId` vào response của `getContractInfo`
- Hoặc tạo API mới: `GET /api/contracts/by-appointment/:appointmentId` để lấy contract object

### Quyền truy cập

- **Staff only**: Tạo hợp đồng, upload ảnh, cập nhật timeline, sinh PDF, hoàn tất, hủy
- **Buyer/Seller/Staff**: Xem thông tin, xem timeline, xem PDF

### Timeline Steps

Các bước được định nghĩa cố định:

1. SIGN_CONTRACT - Ký hợp đồng
2. NOTARIZATION - Công chứng
3. TRANSFER_OWNERSHIP - Chuyển quyền sở hữu
4. HANDOVER_PAPERS_AND_CAR - Bàn giao giấy tờ và xe
5. COMPLETED - Hoàn tất

## Cách sử dụng

1. **Truy cập trang hợp đồng**:

   ```
   http://localhost:5173/contracts/{appointmentId}
   ```

2. **Test flow**:
   - Xem hướng dẫn chi tiết trong `CONTRACT_API_TEST_GUIDE.md`

## Cần kiểm tra với Backend

1. ✅ Response của `getContractInfo` có trả về `contractId` không?
2. ✅ Format của `photos[]` trong upload có đúng không?
3. ✅ Format của `attachments[]` trong update timeline có đúng không?
4. ✅ Timeline response có đúng format không?
5. ✅ PDF URL có redirect đúng không?

## Cải thiện có thể thêm

1. Thêm pagination nếu có nhiều timeline steps
2. Thêm preview ảnh trước khi upload
3. Thêm drag & drop cho file upload
4. Thêm validation cho form inputs
5. Thêm confirmation dialog cho các action quan trọng (đã có cho complete/cancel)
