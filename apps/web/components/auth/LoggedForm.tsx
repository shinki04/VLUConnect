import { Button } from "@repo/ui/components/button";
import Image from "next/image";
import Link from "next/link";

interface LoggedFormProps {
  userName?: string;
}

function LoggedForm({ userName = "Người dùng" }: LoggedFormProps) {
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center bg-transparent py-4 px-2">
      {/* Main Login Card */}
      <div className="bg-mainred-blur w-full max-w-sm mx-auto px-2 sm:px-0 rounded-2xl overflow-hidden shadow-lg flex flex-col items-center">
        <div className="w-full flex flex-col items-center px-4 py-6 sm:px-8 sm:py-10 gap-4 sm:gap-5">
          {/* Logo lớn & đẹp */}
          <Image
            src="/logo_white.png"
            alt="VLU Logo"
            width={120}
            height={120}
            className="mb-0 sm:mb-1"
          />

          {/* Tiêu đề */}
          <h2 className="py-0 text-[18px] sm:text-2xl font-bold text-custom-white text-center tracking-tight leading-tight whitespace-normal sm:whitespace-nowrap max-w-[280px] sm:max-w-none">
            Cổng đăng nhập Giảng viên<br className="sm:hidden" /> & Sinh viên
          </h2>

          {/* Spacer / Line */}
          <div className="flex items-center w-full justify-center">
            <div className="h-px w-24 bg-white/30 rounded-full" />
          </div>

          <div className="w-full flex flex-col text-center mt-0 sm:mt-1 mb-1 sm:mb-2">
            <p className="text-custom-white/90 text-sm sm:text-base font-light">
              Bạn đang truy cập hệ thống<br className="sm:hidden" /> dưới tên <span className="font-bold">{userName}</span>
            </p>
            <p className="text-custom-white/90 text-sm sm:text-base font-light mt-1 text-[13px] sm:text-base">
              Bạn có muốn tiếp tục vào<br className="sm:hidden" /> Trang chủ không?
            </p>
          </div>

          <Link href="/dashboard" className="w-full">
            <Button
              type="button"
              className="w-full flex items-center justify-center py-2 bg-custom-white text-mainred text-sm sm:text-base font-bold rounded-lg border-2 border-mainred hover:text-[#99252D] hover:border-[#99252D] hover:bg-custom-white/90 transition-all duration-300"
            >
              Quay lại trang chủ
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer Card */}
      <div className="bg-mainred-blur w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-md flex flex-col items-center mt-7 mb-4">
        <div className="w-full flex flex-col items-center px-4 py-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-custom-white text-center">
            Chào mừng bạn đến với VLU Connect
          </h3>

          {/* Footer links với 2 line hai bên */}
          <div className="flex items-center w-full justify-center gap-2 mb-1">
            <div className="h-px flex-1 bg-white/20 rounded-full max-w-[28px] sm:max-w-[50px]" />
            <div className="flex items-center gap-2 text-custom-white/80 text-xs sm:text-sm">
              <Link href="/privacy-policy" className="hover:text-custom-white underline">
                Chính sách bảo mật
              </Link>
              <span className="text-custom-white/40">•</span>
              <Link href="/terms-of-service" className="hover:text-custom-white underline">
                Điều khoản dịch vụ
              </Link>
            </div>
            <div className="h-px flex-1 bg-white/20 rounded-full max-w-[28px] sm:max-w-[50px]" />
          </div>

          <p className="text-custom-white/60 text-[12px] sm:text-xs text-center">
            © 2025 Trường Đại học Văn Lang. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoggedForm;
