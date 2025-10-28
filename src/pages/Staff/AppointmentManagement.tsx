import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Car, Eye, CheckCircle, XCircle, FileText, ChevronDown } from 'lucide-react';
import api from '../../config/api';

interface Appointment {
  id: string;
  appointmentId: string;
  scheduledDate: string;
  location: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'RESCHEDULED';
  type: 'CONTRACT_SIGNING';
  buyer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  vehicle: {
    title: string;
    brand: string;
    make: string;
    model: string;
    year: number;
    price: number;
  };
  transaction: {
    depositAmount: number;
    depositStatus: string;
  };
  confirmation: {
    buyerConfirmed: boolean;
    sellerConfirmed: boolean;
    confirmedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Chỉ đóng dropdown khi click bên ngoài dropdown
      if (dropdownOpen && !target.closest('.dropdown-menu-container')) {
        setDropdownOpen(null);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/appointments/staff');
      
      if (response.data.success) {
        console.log('Appointments API response:', response.data.data);
        setAppointments(response.data.data || []);
      } else {
        setError('Không thể tải danh sách lịch hẹn');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Chờ xác nhận' },
      CONFIRMED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Đã xác nhận' },
      RESCHEDULED: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Đã dời lịch' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Hoàn thành' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Đã từ chối' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredAppointments = appointments.filter(appointment => 
    filterStatus === 'all' || appointment.status === filterStatus
  );

  const toggleDropdown = (appointmentId: string) => {
    setDropdownOpen(dropdownOpen === appointmentId ? null : appointmentId);
  };

  const openModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedAppointment) {
      try {
        const formData = new FormData();
        formData.append('photos', file);
        formData.append('description', 'null'); // Add description field as null

        const response = await api.post(`/contracts/${selectedAppointment.appointmentId}/upload-photos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          console.log('Photo uploaded successfully');
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }
  };

  const handleCompleteTransaction = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await api.post(`/contracts/${selectedAppointment.appointmentId}/complete`);
      
      if (response.data.success) {
        console.log('Transaction completed successfully');
        // Refresh appointments list
        await fetchAppointments();
        closeModal();
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
    }
  };

  const createPlaceholder = (length: number = 80) => {
    return '.'.repeat(length);
  };

  const generateContractWithData = (appointment: Appointment) => {
    const contractContent = createContractContent(appointment);
    downloadContractPDF(contractContent);
    setDropdownOpen(null);
  };

  const generateEmptyContract = () => {
    const contractContent = createEmptyContractContent();
    downloadContractPDF(contractContent);
    setDropdownOpen(null);
  };

  const createContractContent = (appointment: Appointment): string => {
    return `
<div style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.6; max-width: 800px; margin: 0 auto;">

<div style="text-align: center; margin-bottom: 30px;">
  <p style="font-weight: bold; font-size: 16pt; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
  <p style="font-weight: bold; font-size: 14pt; margin: 5px 0;">Độc lập - Tự do - Hạnh phúc</p>
  <p style="font-weight: bold; font-size: 18pt; margin: 20px 0; text-transform: uppercase;">HỢP ĐỒNG MUA BÁN XE</p>
</div>

<p style="margin-bottom: 20px;">Hôm nay, ngày ${new Date().toLocaleDateString('vi-VN')} tại ${appointment.location}, chúng tôi gồm có:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN BÁN (SAU ĐÂY GỌI LÀ BÊN A):</p>
<p style="margin: 5px 0;">Ông: ${appointment.seller.name.toUpperCase()}<span style="margin-left: 20px;">Sinh ngày: ${createPlaceholder(15)}</span></p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(20)}<span style="margin-left: 20px;">cấp ngày: ${createPlaceholder(15)}</span><span style="margin-left: 20px;">tại: ${createPlaceholder(40)}</span></p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">BÊN MUA (SAU ĐÂY GỌI LÀ BÊN B):</p>
<p style="margin: 5px 0;">Ông: ${appointment.buyer.name.toUpperCase()}<span style="margin-left: 20px;">Sinh ngày: ${createPlaceholder(15)}</span></p>
<p style="margin: 5px 0;">CMND: ${createPlaceholder(20)}<span style="margin-left: 20px;">Cấp ngày: ${createPlaceholder(15)}</span><span style="margin-left: 20px;">tại: ${createPlaceholder(40)}</span></p>
<p style="margin: 5px 0;">Hộ khẩu thường trú: ${createPlaceholder(60)}</p>

<p style="margin: 20px 0;">Hai bên đồng ý thực hiện việc mua bán xe máy với các thỏa thuận sau đây:</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 1. ĐỐI TƯỢNG CỦA HỢP ĐỒNG</p>
<p style="margin: 5px 0;">Bên A đồng ý bán và bên B đồng ý mua chiếc xe được mô tả dưới đây:</p>
<p style="font-weight: bold; margin: 10px 0 5px 0;">1. Đặc điểm xe:</p>
<p style="margin: 3px 0;">Biển số: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Nhãn hiệu: ${appointment.vehicle.make.toUpperCase()};</p>
<p style="margin: 3px 0;">Dung tích xi lanh: ${createPlaceholder(15)};</p>
<p style="margin: 3px 0;">Loại xe: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Màu sơn: ${createPlaceholder(15)};</p>
<p style="margin: 3px 0;">Số máy: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Số khung: ${createPlaceholder(20)};</p>
<p style="margin: 3px 0;">Các đặc điểm khác: ${createPlaceholder(40)}</p>

<p style="font-weight: bold; margin: 10px 0 5px 0;">2. Giấy đăng ký xe số: ${createPlaceholder(20)} do ${createPlaceholder(50)} cấp ngày ${createPlaceholder(15)}</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 2. GIÁ MUA BÁN VÀ PHƯƠNG THỨC THANH TOÁN</p>
<p style="font-weight: bold; margin: 5px 0;">1. Giá mua bán xe nêu tại Điều 1 là: ${appointment.transaction.depositAmount.toLocaleString('vi-VN')} VNĐ</p>
<p style="margin: 5px 0;">(Bằng chữ: ${createPlaceholder(50)})</p>
<p style="font-weight: bold; margin: 5px 0;">2. Số tiền đặt cọc: ${appointment.transaction.depositAmount.toLocaleString('vi-VN')} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">3. Số tiền còn lại: ${createPlaceholder(20)} VNĐ</p>
<p style="font-weight: bold; margin: 5px 0;">4. Phương thức thanh toán: ${createPlaceholder(20)}</p>
<p style="margin: 5px 0;">5. Việc thanh toán số tiền nêu trên do hai bên tự thực hiện và chịu trách nhiệm trước pháp luật.</p>

<p style="font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0;">ĐIỀU 3. THỜI HẠN, ĐỊA ĐIỂM VÀ PHƯƠNG THỨC GIAO XE</p>
<p style="margin: 5px 0;">Hai bên thống nhất giao xe tại địa điểm: ${appointment.location.toUpperCase()}</p>
<p style="margin: 5px 0;">Thời gian giao xe: ${new Date(appointment.scheduledDate).toLocaleDateString('vi-VN')}</p>

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
    <p style="margin-top: 60px; font-weight: bold;">${appointment.seller.name.toUpperCase()}</p>
  </div>
  <div style="width: 45%;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0;">BÊN B</p>
    <p style="margin: 5px 0;">(ký, điểm chỉ và ghi rõ họ tên)</p>
    <p style="margin-top: 60px; font-weight: bold;">${appointment.buyer.name.toUpperCase()}</p>
  </div>
</div>

</div>
    `.trim();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
          <p className="text-gray-600 mt-1">Quản lý tất cả lịch hẹn ký hợp đồng</p>
        </div>
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="RESCHEDULED">Đã dời lịch</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
          <span className="text-sm text-gray-500">
            Hiển thị {filteredAppointments.length} / {appointments.length} lịch hẹn
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên xe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người mua
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian & Địa điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Không có lịch hẹn nào</p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Car className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.vehicle.make} {appointment.vehicle.model} {appointment.vehicle.year}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.buyer.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.seller.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(appointment.scheduledDate)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">{appointment.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openModal(appointment)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem chi tiết
                        </button>
                        
                        <div className="relative dropdown-menu-container">
                          <button
                            onClick={() => toggleDropdown(appointment.id)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            In hợp đồng
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </button>
                          
                          {dropdownOpen === appointment.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateContractWithData(appointment);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <FileText className="w-4 h-4 mr-3" />
                                Hợp đồng có dữ liệu
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateEmptyContract();
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <FileText className="w-4 h-4 mr-3" />
                                Hợp đồng trắng
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => a.status === 'PENDING').length}
            </div>
            <div className="text-sm text-gray-600">Chờ xác nhận</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'CONFIRMED').length}
            </div>
            <div className="text-sm text-gray-600">Đã xác nhận</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {appointments.filter(a => a.status === 'RESCHEDULED').length}
            </div>
            <div className="text-sm text-gray-600">Đã dời lịch</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-600">Hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter(a => a.status === 'REJECTED').length}
            </div>
            <div className="text-sm text-gray-600">Đã từ chối</div>
          </div>
        </div>
      </div>

      {/* Modal Chi tiết */}
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết lịch hẹn</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Thông tin chung */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin xe</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">
                    <span className="font-medium">Xe:</span> {selectedAppointment.vehicle.make} {selectedAppointment.vehicle.model} {selectedAppointment.vehicle.year}
                  </p>
                  <p className="text-gray-700 mt-2">
                    <span className="font-medium">Thời gian:</span> {formatDate(selectedAppointment.scheduledDate)}
                  </p>
                  <p className="text-gray-700 mt-2">
                    <span className="font-medium">Địa điểm:</span> {selectedAppointment.location}
                  </p>
                </div>
              </div>

              {/* Hai bên */}
              <div className="grid grid-cols-2 gap-6">
                {/* Bên Bán */}
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3">🟠 Bên Bán</h3>
                  <div className="bg-orange-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700">
                      <span className="font-medium">Tên:</span> {selectedAppointment.seller.name}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Email:</span> {selectedAppointment.seller.email}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Số điện thoại:</span> {selectedAppointment.seller.phone}
                    </p>
                  </div>
                  
                  {/* Upload ảnh cho bên bán */}
                  {selectedAppointment.status === 'CONFIRMED' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Upload ảnh hợp đồng (Bên Bán)</h4>
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bên Mua */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-3">🟢 Bên Mua</h3>
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700">
                      <span className="font-medium">Tên:</span> {selectedAppointment.buyer.name}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Email:</span> {selectedAppointment.buyer.email}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-medium">Số điện thoại:</span> {selectedAppointment.buyer.phone}
                    </p>
                  </div>
                  
                  {/* Upload ảnh cho bên mua */}
                  {selectedAppointment.status === 'CONFIRMED' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Upload ảnh hợp đồng (Bên Mua)</h4>
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Đóng
                </button>
                
                {selectedAppointment.status === 'CONFIRMED' && (
                  <button
                    onClick={handleCompleteTransaction}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Hoàn thành giao dịch
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
