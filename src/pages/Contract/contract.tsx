import React, { useState } from 'react';
import { ContractData } from '../../types';

const ContractPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Dữ liệu mẫu để test
  const sampleContractData: ContractData = {
    contractNumber: "HD-2024-001",
    contractDate: new Date().toLocaleDateString('vi-VN'),
    meetingLocation: "Văn phòng Công ty ABC, 123 Đường XYZ, Quận 1, TP.HCM",
    
    seller: {
      fullName: "Nguyễn Văn A",
      dateOfBirth: "15/03/1985",
      idNumber: "123456789",
      idIssueDate: "20/05/2010",
      idIssuePlace: "Công an TP.HCM",
      permanentAddress: "456 Đường ABC, Quận 2, TP.HCM",
      spouseName: "Trần Thị B",
      spouseDateOfBirth: "22/08/1987",
      spouseIdNumber: "987654321",
      spouseIdIssueDate: "15/06/2012",
      spouseIdIssuePlace: "Công an TP.HCM",
      spousePermanentAddress: "456 Đường ABC, Quận 2, TP.HCM"
    },
    
    buyer: {
      fullName: "Lê Văn C",
      dateOfBirth: "10/12/1990",
      idNumber: "456789123",
      idIssueDate: "25/08/2015",
      idIssuePlace: "Công an TP.HCM",
      permanentAddress: "789 Đường DEF, Quận 3, TP.HCM"
    },
    
    vehicle: {
      licensePlate: "51A-12345",
      brand: "Honda",
      engineCapacity: "150cc",
      vehicleType: "Xe máy",
      color: "Đỏ",
      engineNumber: "ABC123456",
      chassisNumber: "XYZ789012",
      registrationNumber: "ĐK-2023-001",
      registrationDate: "15/01/2023",
      registrationAuthority: "Cục Đăng kiểm Việt Nam",
      additionalFeatures: "Có hệ thống chống trộm"
    },
    
    financial: {
      totalAmount: 25000000,
      totalAmountText: "Hai mươi lăm triệu đồng",
      depositAmount: 5000000,
      remainingAmount: 20000000,
      paymentMethod: "Tiền mặt"
    }
  };

  const generateContract = () => {
    setIsGenerating(true);
    
    // Tạo nội dung hợp đồng
    const contractContent = createContractContent(sampleContractData);
    
    // Tạo và tải file PDF
    setTimeout(() => {
      downloadContractPDF(contractContent);
      setIsGenerating(false);
    }, 1000);
  };

  const generateEmptyContract = () => {
    setIsGenerating(true);
    
    // Tạo nội dung hợp đồng mẫu (không có thông tin)
    const contractContent = createEmptyContractContent();
    
    // Tạo và tải file PDF
    setTimeout(() => {
      downloadContractPDF(contractContent);
      setIsGenerating(false);
    }, 1000);
  };

  const createContractContent = (data: ContractData): string => {
    return `
<div style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.6; max-width: 800px; margin: 0 auto;">

<div style="text-align: center; margin-bottom: 30px;">
  <p style="font-weight: bold; font-size: 16pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
  <p style="font-weight: bold; font-size: 14pt; margin: 5px 0;">Độc lập - Tự do - Hạnh phúc</p>
  <p style="font-weight: bold; font-size: 18pt; margin: 20px 0; text-transform: uppercase;">HỢP ĐỒNG MUA BÁN XE</p>
</div>

<p style="margin-bottom: 20px;">Hôm nay, ngày ${data.contractDate} tại ${data.meetingLocation}, chúng tôi gồm có:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN BÁN (SAU ĐÂY GỌI LÀ BÊN A):</p>
<p style="margin: 5px 0;">Ông: ${data.seller.fullName.toUpperCase()}<span style="margin-left: 20px;">Sinh ngày: ${data.seller.dateOfBirth}</span></p>
<p style="margin: 5px 0;">CMND: ${data.seller.idNumber}<span style="margin-left: 20px;">cấp ngày: ${data.seller.idIssueDate}</span><span style="margin-left: 20px;">tại: ${data.seller.idIssuePlace.toUpperCase()}</span></p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${data.seller.permanentAddress}</p>
<p style="margin: 5px 0;">Cùng vợ là bà: ${data.seller.spouseName?.toUpperCase()}<span style="margin-left: 20px;">Sinh ngày: ${data.seller.spouseDateOfBirth}</span></p>
<p style="margin: 5px 0;">CMND: ${data.seller.spouseIdNumber}<span style="margin-left: 20px;">cấp ngày: ${data.seller.spouseIdIssueDate}</span><span style="margin-left: 20px;">tại: ${data.seller.spouseIdIssuePlace?.toUpperCase()}</span></p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${data.seller.spousePermanentAddress}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN MUA (SAU ĐÂY GỌI LÀ BÊN B):</p>
<p style="margin: 5px 0;">Ông: ${data.buyer.fullName.toUpperCase()}<span style="margin-left: 20px;">Sinh ngày: ${data.buyer.dateOfBirth}</span></p>
<p style="margin: 5px 0;">CMND: ${data.buyer.idNumber}<span style="margin-left: 20px;">Cấp ngày: ${data.buyer.idIssueDate}</span><span style="margin-left: 20px;">tại: ${data.buyer.idIssuePlace.toUpperCase()}</span></p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${data.buyer.permanentAddress}</p>

<p style="margin: 20px 0;">Hai bên đồng ý thực hiện việc mua bán xe máy với các thỏa thuận sau đây:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 1. ĐỐI TƯỢNG CỦA HỢP ĐỒNG</p>
<p style="margin: 5px 0;">Bên A đồng ý bán và bên B đồng ý mua chiếc xe được mô tả dưới đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. Đặc điểm xe:</p>
<p style="margin: 3px 0;">Biển số: ${data.vehicle.licensePlate.toUpperCase()};</p>
<p style="margin: 3px 0;">Nhãn hiệu: ${data.vehicle.brand.toUpperCase()};</p>
<p style="margin: 3px 0;">Dung tích xi lanh: ${data.vehicle.engineCapacity.toUpperCase()};</p>
<p style="margin: 3px 0;">Loại xe: ${data.vehicle.vehicleType.toUpperCase()};</p>
<p style="margin: 3px 0;">Màu sơn: ${data.vehicle.color.toUpperCase()};</p>
<p style="margin: 3px 0;">Số máy: ${data.vehicle.engineNumber.toUpperCase()};</p>
<p style="margin: 3px 0;">Số khung: ${data.vehicle.chassisNumber.toUpperCase()};</p>
<p style="margin: 3px 0;">Các đặc điểm khác: ${data.vehicle.additionalFeatures?.toUpperCase() || 'KHÔNG CÓ'}</p>

<p style="font-weight: bold; margin: 10px 0 5px 0;">2. Giấy đăng ký xe số: ${data.vehicle.registrationNumber.toUpperCase()} do ${data.vehicle.registrationAuthority.toUpperCase()} cấp ngày ${data.vehicle.registrationDate}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 2. GIÁ MUA BÁN VÀ PHƯƠNG THỨC THANH TOÁN</p>
<p style="font-weight: bold; margin: 5px 0;">1. Giá mua bán xe nêu tại Điều 1 là: ${data.financial.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
<p style="margin: 5px 0;">(Bằng chữ: ${data.financial.totalAmountText.toUpperCase()})</p>
<p style="font-weight: bold; margin: 5px 0;">2. Số tiền đặt cọc: ${data.financial.depositAmount.toLocaleString('vi-VN')} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">3. Số tiền còn lại: ${data.financial.remainingAmount.toLocaleString('vi-VN')} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">4. Phương thức thanh toán: ${data.financial.paymentMethod.toUpperCase()}</p>
<p style="margin: 5px 0;">5. Việc thanh toán số tiền nêu trên do hai bên tự thực hiện và chịu trách nhiệm trước pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 3. THỜI HẠN, ĐỊA ĐIỂM VÀ PHƯƠNG THỨC GIAO XE</p>
<p style="margin: 5px 0;">Hai bên thống nhất giao xe tại địa điểm: ${data.meetingLocation.toUpperCase()}</p>
<p style="margin: 5px 0;">Thời gian giao xe: NGAY SAU KHI KÝ KẾT HỢP ĐỒNG NÀY</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 4. QUYỀN SỞ HỮU ĐỐI VỚI XE MUA BÁN</p>
<p style="margin: 5px 0;">1. Bên mua có trách nhiệm thực hiện việc đăng ký quyền sở hữu đối với xe tại cơ quan có thẩm quyền;</p>
<p style="margin: 5px 0;">2. Quyền sở hữu đối với xe nêu trên được chuyển cho Bên B, kể từ thời điểm thực hiện xong các thủ tục đăng ký quyền sở hữu xe;</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 5. VIỆC NỘP THUẾ VÀ LỆ PHÍ CÔNG CHỨNG</p>
<p style="margin: 5px 0;">Thuế và lệ phí liên quan đến việc mua bán chiếc xe theo Hợp đồng này do BÊN MUA chịu trách nhiệm nộp.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 6. PHƯƠNG THỨC GIẢI QUYẾT TRANH CHẤP</p>
<p style="margin: 5px 0;">Trong quá trình thực hiện Hợp đồng mà phát sinh tranh chấp, các bên cùng nhau thương lượng giải quyết trên nguyên tắc tôn trọng quyền lợi của nhau; trong trường hợp không giải quyết được, thì một trong hai bên có quyền khởi kiện để yêu cầu tòa án có thẩm quyền giải quyết theo quy định của pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 7. CAM ĐOAN CỦA CÁC BÊN</p>
<p style="margin: 5px 0;">Bên A và bên B chịu trách nhiệm trước pháp luật về những lời cam đoan sau đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. BÊN A CAM ĐOAN:</p>
<p style="margin: 3px 0;">a) Những thông tin về nhân thân, về xe mua bán ghi trong Hợp đồng này là đúng sự thật;</p>
<p style="margin: 3px 0;">b) Xe mua bán không có tranh chấp, không bị cơ quan nhà nước có thẩm quyền xử lý theo quy định pháp luật;</p>
<p style="margin: 3px 0;">c) Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</p>
<p style="margin: 3px 0;">d) Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong Hợp đồng này;</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">2. BÊN B CAM ĐOAN:</p>
<p style="margin: 3px 0;">a) Những thông tin về nhân thân ghi trong Hợp đồng này là đúng sự thật;</p>
<p style="margin: 3px 0;">b) Đã xem xét kỹ, biết rõ về xe mua bán và các giấy tờ chứng minh quyền sở hữu;</p>
<p style="margin: 3px 0;">c) Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</p>
<p style="margin: 3px 0;">d) Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong Hợp đồng này.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 8. ĐIỀU KHOẢN CUỐI CÙNG</p>
<p style="margin: 5px 0;">1. Hai bên công nhận đã hiểu rõ quyền, nghĩa vụ và lợi ích hợp pháp của mình, ý nghĩa và hậu quả pháp lý của việc giao kết Hợp đồng này;</p>
<p style="margin: 5px 0;">2. Hai bên đã tự đọc Hợp đồng, đã hiểu và đồng ý tất cả các điều khoản ghi trong Hợp đồng và ký vào Hợp đồng này trước sự có mặt của Công chứng viên;</p>
<p style="margin: 5px 0;">3. Hợp đồng có hiệu lực thời điểm các bên ký kết hợp đồng</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN A</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${data.seller.fullName.toUpperCase()}</p>
  </div>
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN B</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${data.buyer.fullName.toUpperCase()}</p>
  </div>
</div>

</div>
    `.trim();
  };

  const createPlaceholder = (length: number = 80) => {
    return '.'.repeat(length);
  };

  const createEmptyContractContent = (): string => {
    return `
<div style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.6; max-width: 800px; margin: 0 auto;">

<div style="text-align: center; margin-bottom: 30px;">
  <p style="font-weight: bold; font-size: 16pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
  <p style="font-weight: bold; font-size: 14pt; margin: 5px 0;">Độc lập - Tự do - Hạnh phúc</p>
  <p style="font-weight: bold; font-size: 18pt; margin: 20px 0; text-transform: uppercase;">HỢP ĐỒNG MUA BÁN XE</p>
</div>

<p style="margin-bottom: 20px;">Hôm nay, ngày ${createPlaceholder(20)} tại ${createPlaceholder(60)}, chúng tôi gồm có:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN BÁN (SAU ĐÂY GỌI LÀ BÊN A):</p>
<p style="margin: 5px 0;">Ông: ${createPlaceholder(30)} Sinh ngày: ${createPlaceholder(15)}</p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(20)} cấp ngày: ${createPlaceholder(15)} tại: ${createPlaceholder(40)}</p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>
<p style="margin: 5px 0;">Cùng vợ là bà: ${createPlaceholder(30)}</p>
<p style="margin: 5px 0;">Sinh ngày: ${createPlaceholder(15)}</p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(20)} cấp ngày: ${createPlaceholder(15)} tại: ${createPlaceholder(40)}</p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN MUA (SAU ĐÂY GỌI LÀ BÊN B):</p>
<p style="margin: 5px 0;">Ông: ${createPlaceholder(30)} Sinh ngày: ${createPlaceholder(15)}</p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(20)} Cấp ngày: ${createPlaceholder(15)} tại: ${createPlaceholder(40)}</p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>

<p style="margin: 20px 0;">Hai bên đồng ý thực hiện việc mua bán xe máy với các thỏa thuận sau đây:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 1. ĐỐI TƯỢNG CỦA HỢP ĐỒNG</p>
<p style="margin: 5px 0;">Bên A đồng ý bán và bên B đồng ý mua chiếc xe được mô tả dưới đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. Đặc điểm xe:</p>
<p style="margin: 3px 0;">Biển số: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Nhãn hiệu: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Dung tích xi lanh: ${createPlaceholder(15)};</p>
<p style="margin: 3px 0;">Loại xe: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Màu sơn: ${createPlaceholder(15)};</p>
<p style="margin: 3px 0;">Số máy: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Số khung: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Các đặc điểm khác: ${createPlaceholder(40)}</p>

<p style="font-weight: bold; margin: 10px 0 5px 0;">2. Giấy đăng ký xe số: ${createPlaceholder(20)} do ${createPlaceholder(50)} cấp ngày ${createPlaceholder(15)}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 2. GIÁ MUA BÁN VÀ PHƯƠNG THỨC THANH TOÁN</p>
<p style="font-weight: bold; margin: 5px 0;">1. Giá mua bán xe nêu tại Điều 1 là: ${createPlaceholder(20)} VNĐ</p>
<p style="margin: 5px 0;">(Bằng chữ: ${createPlaceholder(50)})</p>
<p style="font-weight: bold; margin: 5px 0;">2. Số tiền đặt cọc: ${createPlaceholder(20)} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">3. Số tiền còn lại: ${createPlaceholder(20)} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">4. Phương thức thanh toán: ${createPlaceholder(20)}</p>
<p style="margin: 5px 0;">5. Việc thanh toán số tiền nêu trên do hai bên tự thực hiện và chịu trách nhiệm trước pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 3. THỜI HẠN, ĐỊA ĐIỂM VÀ PHƯƠNG THỨC GIAO XE</p>
<p style="margin: 5px 0;">Hai bên thống nhất giao xe tại địa điểm: ${createPlaceholder(60)}</p>
<p style="margin: 5px 0;">Thời gian giao xe: NGAY SAU KHI KÝ KẾT HỢP ĐỒNG NÀY</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 4. QUYỀN SỞ HỮU ĐỐI VỚI XE MUA BÁN</p>
<p style="margin: 5px 0;">1. Bên mua có trách nhiệm thực hiện việc đăng ký quyền sở hữu đối với xe tại cơ quan có thẩm quyền;</p>
<p style="margin: 5px 0;">2. Quyền sở hữu đối với xe nêu trên được chuyển cho Bên B, kể từ thời điểm thực hiện xong các thủ tục đăng ký quyền sở hữu xe;</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 5. VIỆC NỘP THUẾ VÀ LỆ PHÍ CÔNG CHỨNG</p>
<p style="margin: 5px 0;">Thuế và lệ phí liên quan đến việc mua bán chiếc xe theo Hợp đồng này do BÊN MUA chịu trách nhiệm nộp.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 6. PHƯƠNG THỨC GIẢI QUYẾT TRANH CHẤP</p>
<p style="margin: 5px 0;">Trong quá trình thực hiện Hợp đồng mà phát sinh tranh chấp, các bên cùng nhau thương lượng giải quyết trên nguyên tắc tôn trọng quyền lợi của nhau; trong trường hợp không giải quyết được, thì một trong hai bên có quyền khởi kiện để yêu cầu tòa án có thẩm quyền giải quyết theo quy định của pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 7. CAM ĐOAN CỦA CÁC BÊN</p>
<p style="margin: 5px 0;">Bên A và bên B chịu trách nhiệm trước pháp luật về những lời cam đoan sau đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. BÊN A CAM ĐOAN:</p>
<p style="margin: 3px 0;">a) Những thông tin về nhân thân, về xe mua bán ghi trong Hợp đồng này là đúng sự thật;</p>
<p style="margin: 3px 0;">b) Xe mua bán không có tranh chấp, không bị cơ quan nhà nước có thẩm quyền xử lý theo quy định pháp luật;</p>
<p style="margin: 3px 0;">c) Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</p>
<p style="margin: 3px 0;">d) Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong Hợp đồng này;</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">2. BÊN B CAM ĐOAN:</p>
<p style="margin: 3px 0;">a) Những thông tin về nhân thân ghi trong Hợp đồng này là đúng sự thật;</p>
<p style="margin: 3px 0;">b) Đã xem xét kỹ, biết rõ về xe mua bán và các giấy tờ chứng minh quyền sở hữu;</p>
<p style="margin: 3px 0;">c) Việc giao kết Hợp đồng này hoàn toàn tự nguyện, không bị lừa dối hoặc ép buộc;</p>
<p style="margin: 3px 0;">d) Thực hiện đúng và đầy đủ tất cả các thỏa thuận đã ghi trong Hợp đồng này.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 8. ĐIỀU KHOẢN CUỐI CÙNG</p>
<p style="margin: 5px 0;">1. Hai bên công nhận đã hiểu rõ quyền, nghĩa vụ và lợi ích hợp pháp của mình, ý nghĩa và hậu quả pháp lý của việc giao kết Hợp đồng này;</p>
<p style="margin: 5px 0;">2. Hai bên đã tự đọc Hợp đồng, đã hiểu và đồng ý tất cả các điều khoản ghi trong Hợp đồng và ký vào Hợp đồng này trước sự có mặt của Công chứng viên;</p>
<p style="margin: 5px 0;">3. Hợp đồng có hiệu lực thời điểm các bên ký kết hợp đồng</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN A</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${createPlaceholder(30)}</p>
  </div>
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN B</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${createPlaceholder(30)}</p>
  </div>
</div>

</div>
    `.trim();
  };

  const downloadContractPDF = (content: string) => {
    // Tạo window mới để in
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Hợp đồng mua bán xe</title>
            <style>
              @page {
                size: A4;
                margin: 0;
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; }
                @bottom-center { content: ""; }
                @bottom-right { content: ""; }
              }
              body { 
                font-family: 'Times New Roman', serif; 
                font-size: 14pt; 
                line-height: 1.6; 
                margin: 2cm;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              p {
                margin: 0 0 5px 0;
              }
              div {
                box-sizing: border-box;
              }
              @media print {
                body { 
                  margin: 2cm;
                }
                @page {
                  margin: 0;
                  @top-left { content: ""; }
                  @top-center { content: ""; }
                  @top-right { content: ""; }
                  @bottom-left { content: ""; }
                  @bottom-center { content: ""; }
                  @bottom-right { content: ""; }
                }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Đợi content render trước khi in
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Tạo Hợp Đồng Mua Bán Xe
          </h1>
          
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Chọn kiểu hợp đồng bạn muốn tạo:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={generateContract}
                disabled={isGenerating}
                className={`
                  px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200
                  ${isGenerating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }
                  text-white shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto
                `}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo hợp đồng...
                  </div>
                ) : (
                  '📄 Hợp Đồng Có Dữ Liệu'
                )}
              </button>

              <button
                onClick={generateEmptyContract}
                disabled={isGenerating}
                className={`
                  px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200
                  ${isGenerating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                  }
                  text-white shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto
                `}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo hợp đồng...
                  </div>
                ) : (
                  '📝 Hợp Đồng Mẫu Trống'
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              📋 Thông tin hợp đồng sẽ được tạo:
            </h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Số hợp đồng: {sampleContractData.contractNumber}</li>
              <li>• Ngày tạo: {sampleContractData.contractDate}</li>
              <li>• Người bán: {sampleContractData.seller.fullName}</li>
              <li>• Người mua: {sampleContractData.buyer.fullName}</li>
              <li>• Xe: {sampleContractData.vehicle.brand} - {sampleContractData.vehicle.licensePlate}</li>
              <li>• Giá: {sampleContractData.financial.totalAmount.toLocaleString('vi-VN')} VNĐ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPage;
