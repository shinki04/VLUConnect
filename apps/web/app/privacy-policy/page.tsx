import { BLANK_AVATAR } from "@repo/shared/types/user";
import Link from "next/link";
import * as React from "react";
import { getCurrentUser } from "@/app/actions/user";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { UserDropdown } from "@/components/dashboard/UserDropdown";
import { BackButton } from "@/components/ui/BackButton";
import { Globe, Lock, Info, Users } from "lucide-react";
import { LogIn, UserCircle, FileText, MousePointerClick, RefreshCw } from "lucide-react";

export default function PrivacyPolicyPageWrapper() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]"></div>}>
            <PrivacyPolicyPage />
        </React.Suspense>
    );
}

async function PrivacyPolicyPage() {
    const user = await getCurrentUser().catch(() => null);

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
            {/* Custom Red Header */}
            <header className="sticky top-0 z-50 bg-[#C81D31] h-16 px-4 md:px-10 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-4 w-1/4">
                    <Link href="/dashboard" className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-4xl">school</span>
                        <div className="flex flex-col hidden md:flex">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                                VLU Connect
                            </h1>
                            <span className="text-[7.5px] uppercase text-white/90 leading-tight mt-[1px] font-semibold tracking-wider">
                                Trường Đại học Văn Lang
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex flex-col items-center flex-1 md:w-2/4 md:flex-initial max-w-2xl text-white font-medium text-xs md:text-sm gap-8 md:flex-row justify-center hidden md:flex uppercase tracking-wide">
                    <Link href="/dashboard" className="hover:text-white/80 transition-colors border-b-[3px] border-white pb-1 pt-1">Tất cả</Link>
                    <Link href="/dashboard?tab=users" className="hover:text-white/80 transition-colors text-white/70 pb-1 pt-1 border-b-[3px] border-transparent">Người dùng</Link>
                    <Link href="/dashboard?tab=groups" className="hover:text-white/80 transition-colors text-white/70 pb-1 pt-1 border-b-[3px] border-transparent">Nhóm</Link>
                </div>

                <div className="flex items-center justify-end gap-2 md:gap-4 md:w-1/4">
                    {user ? (
                        <>
                            {/* Force white icons for dropdowns explicitly */}
                            <div className="text-white hover:text-white/80 transition-colors">
                                <NotificationDropdown />
                            </div>
                            <div className="hidden md:block h-6 w-px bg-white/30 mx-1"></div>
                            <div className="hidden sm:block">
                                <UserDropdown
                                    avatarUrl={user?.avatar_url ?? BLANK_AVATAR}
                                    displayName={user?.display_name ?? undefined}
                                    slug={user?.slug ?? undefined}
                                />
                            </div>
                        </>
                    ) : (
                        <Link href="/login" className="text-white font-medium hover:underline">Đăng nhập</Link>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full bg-[#f8f9fa] relative pb-20">
                {/* Red Hero Background */}
                <div className="h-[280px] w-full bg-[#C81D31] flex flex-col items-center pt-12 md:pt-16 px-4">
                    <h1 className="text-3xl md:text-[44px] font-black text-white text-center tracking-tight mb-2 uppercase">
                        Chính sách bảo mật
                    </h1>
                    <p className="text-white text-base md:text-[20px] font-bold tracking-widest uppercase mb-8">
                        (Privacy Policy)
                    </p>
                    <p className="text-white/80 text-[10px] sm:text-xs tracking-[0.2em] font-medium uppercase border-t border-white/20 pt-4 px-8 text-center">
                        VLUCONNECT INTERNAL ACADEMIC SOCIAL NETWORK
                    </p>
                </div>

                {/* Content Card overlapping the red background */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16">
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-6 md:p-10 lg:p-12 pb-8">
                        {/* Breadcrumb / Title area inside card */}
                        <div className="flex justify-between items-center mb-8 md:mb-10">
                            <div className="flex items-center text-xs font-medium text-slate-500">
                                <Link href="/dashboard" className="hover:text-[#C81D31] transition-colors">Trang chủ</Link>
                                <span className="mx-2">{'>'}</span>
                                <span className="text-[#C81D31]">Chính sách Bảo mật</span>
                            </div>
                            <BackButton />
                        </div>

                        <div className="space-y-12">
                            {/* Section 1 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">1. Thông tin chúng tôi thu thập</h2>
                                </div>
                                <p className="text-sm md:text-base text-slate-600 mb-6 pl-4 border-l-2 border-transparent">
                                    Chúng tôi thu thập các loại thông tin sau để cung cấp và cải thiện dịch vụ VLUconnect cho cộng đồng học thuật:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#f8f9fa] rounded-xl p-5 flex gap-4 hover:bg-slate-50 transition-colors border border-slate-100">
                                        <div className="text-[#C81D31] mt-1 shrink-0"><LogIn size={20} strokeWidth={2.5} /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Thông tin đăng nhập SSO</h3>
                                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">Xác thực qua hệ thống tài khoản Văn Lang duy nhất (Single Sign-On).</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-5 flex gap-4 hover:bg-slate-50 transition-colors border border-slate-100">
                                        <div className="text-[#C81D31] mt-1 shrink-0"><UserCircle size={20} strokeWidth={2.5} /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Thông tin hồ sơ cá nhân</h3>
                                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">Bao gồm Họ tên, Khoa, Ngành, Mã số SV/GV và ảnh đại diện.</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-5 flex gap-4 hover:bg-slate-50 transition-colors border border-slate-100">
                                        <div className="text-[#C81D31] mt-1 shrink-0"><FileText size={20} strokeWidth={2.5} /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Nội dung người dùng (UGC)</h3>
                                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">Các bài viết học thuật, thảo luận, bình luận và tài liệu chia sẻ.</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-5 flex gap-4 hover:bg-slate-50 transition-colors border border-slate-100">
                                        <div className="text-[#C81D31] mt-1 shrink-0"><MousePointerClick size={20} strokeWidth={2.5} /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Dữ liệu tương tác</h3>
                                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">Lịch sử tìm kiếm, lượt thích, chia sẻ và hành vi trên nền tảng.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">2. Cách chúng tôi sử dụng thông tin</h2>
                                </div>
                                <p className="text-sm md:text-base text-slate-600 mb-6 pl-4 border-l-2 border-transparent">
                                    Thông tin thu thập được sử dụng để duy trì môi trường học thuật an toàn và lành mạnh:
                                </p>
                                <div className="bg-[#fff0f2] rounded-xl p-5 md:p-6 flex flex-col md:flex-row gap-4 border border-[#fee2e2]">
                                    <div className="text-[#C81D31] flex items-center justify-center p-3 bg-white rounded-full w-fit h-fit shadow-sm shrink-0">
                                        <Info size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm md:text-base mb-2 flex items-center gap-2">
                                            Phân tích bằng Trí tuệ Nhân tạo (AI Analysis)
                                        </h3>
                                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                                            Chúng tôi triển khai các mô hình AI tiên tiến để tự động kiểm duyệt nội dung (moderation), phát hiện các hành vi vi phạm quy tắc cộng đồng, ngôn từ thiếu chuẩn mực hoặc nội dung không phù hợp với định hướng học thuật của nhà trường.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">3. Chia sẻ thông tin của bạn</h2>
                                </div>
                                <p className="text-sm md:text-base text-slate-600 mb-6 pl-4 border-l-2 border-transparent">
                                    Bạn có quyền kiểm soát tuyệt đối mức độ hiển thị thông tin của mình thông qua cài đặt Quyền riêng tư (Privacy Level):
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-[#f8f9fa] rounded-xl p-6 flex flex-col items-center text-center gap-3 hover:bg-slate-50 transition-colors border border-slate-100">
                                        <div className="text-[#C81D31]"><Globe size={28} strokeWidth={2.5} /></div>
                                        <h3 className="font-bold text-slate-900 text-sm md:text-base">Công khai</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">Hiển thị với toàn bộ cộng đồng người dùng VLUconnect.</p>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-6 flex flex-col items-center text-center gap-3 hover:bg-slate-50 transition-colors border border-slate-100">
                                        <div className="text-[#C81D31]"><Users size={28} strokeWidth={2.5} /></div>
                                        <h3 className="font-bold text-slate-900 text-sm md:text-base">Trong Khoa</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">Chỉ giảng viên và sinh viên cùng khoa mới có thể xem.</p>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-6 flex flex-col items-center text-center gap-3 hover:bg-slate-50 transition-colors border border-slate-100">
                                        <div className="text-[#C81D31]"><Lock size={28} strokeWidth={2.5} /></div>
                                        <h3 className="font-bold text-slate-900 text-sm md:text-base">Riêng tư</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">Chỉ bạn hoặc những cá nhân/nhóm cụ thể được chỉ định.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 4 */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">
                                        4. Lưu trữ và Bảo mật dữ liệu
                                    </h2>
                                </div>

                                <div className="bg-[#f8f9fa] rounded-xl p-5 md:p-8 border border-slate-100">
                                    <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                                        Dữ liệu được lưu trữ trên hệ thống máy chủ an toàn đặt tại Trung tâm Dữ liệu của Trường Đại học Văn Lang.
                                        Khi bạn chọn xóa tài khoản hoặc nội dung, chúng tôi áp dụng cơ chế{" "}
                                        <span className="font-bold text-[#C81D31]">
                                            &quot;Soft Delete&quot;
                                        </span>
                                        : nội dung sẽ ngay lập tức không hiển thị, nhưng được lưu trữ trong kho lưu trữ
                                        bảo mật tối đa 30 ngày để phục vụ các yêu cầu pháp lý hoặc phục hồi dữ liệu
                                        trong trường hợp khẩn cấp.
                                    </p>
                                </div>
                            </section>

                        </div>

                        {/* Footer timestamp inside card */}
                        <div className="mt-16 flex justify-center">
                            <div className="bg-[#f8f9fa] text-slate-500 text-xs py-2 px-6 rounded-full font-medium flex items-center gap-2 border border-slate-100">
                                <RefreshCw size={12} />
                                Cập nhật lần cuối: Ngày 24 tháng 05 năm 2026
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
