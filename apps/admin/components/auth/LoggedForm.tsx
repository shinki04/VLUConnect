import { Button } from "@repo/ui/components/button";
import Image from "next/image";
import Link from "next/link";

function LoggedForm() {
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center bg-transparent py-4 px-4 sm:px-6">
      {/* Main Login Card */}
      <div className="bg-mainred-blur w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
        <div className="w-full flex flex-col items-center px-6 py-8 sm:px-10 sm:py-12 gap-5 sm:gap-6">
          <Image
            src="/logo_white.png"
            alt="VLU Logo"
            width={150}
            height={150}
            className="mb-1 sm:mb-2 w-28 sm:w-[150px] h-auto object-contain"
          />

          <div className="w-full flex flex-col gap-4 text-center">
            <label className="text-white font-semibold text-lg">
              Bạn đã đăng nhập
            </label>
            <Link href="/dashboard" className="w-full">
              <Button
                type="button"
                className="w-full flex items-center justify-center py-2 bg-custom-white dark:text-white/90 text-bg-mainred text-sm sm:text-base font-bold rounded-lg border-2 border-mainred hover:text-[#99252D] hover:border-[#99252D] hover:bg-custom-white/90 transition-all duration-300"
              >
                Quay lại Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Card */}
      <div className="bg-mainred-blur w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-md flex flex-col items-center mt-6 mb-4">
        <div className="w-full flex flex-col items-center px-6 py-5 gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-custom-white text-center">
            Chào mừng bạn đến với VLU Connect
          </h3>

          {/* Footer links với 2 line hai bên */}
          <div className="flex items-center w-full justify-center gap-3 mb-1">
            <div className="h-px flex-1 bg-white/20 rounded-full" />
            <div className="flex items-center gap-3 text-custom-white/80 text-xs sm:text-sm">
              <Link
                href="/privacy-policy"
                className="hover:text-custom-white transition-colors duration-200"
              >
                Chính sách bảo mật
              </Link>
              <span className="text-custom-white/40">•</span>
              <Link
                href="/terms-of-service"
                className="hover:text-custom-white transition-colors duration-200"
              >
                Điều khoản dịch vụ
              </Link>
            </div>
            <div className="h-px flex-1 bg-white/20 rounded-full" />
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
