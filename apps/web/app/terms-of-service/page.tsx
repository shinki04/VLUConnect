import { BLANK_AVATAR } from "@repo/shared/types/user";
import Link from "next/link";
import * as React from "react";
import { getCurrentUser } from "@/app/actions/user";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { UserDropdown } from "@/components/dashboard/UserDropdown";
import { BackButton } from "@/components/ui/BackButton";
import { ShieldCheck, Key, Gavel, AlertCircle, Copyright, ShieldAlert, Settings, History, RefreshCw } from "lucide-react";

export default function TermsOfServicePageWrapper() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]"></div>}>
            <TermsOfServicePage />
        </React.Suspense>
    );
}

async function TermsOfServicePage() {
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
                    <h1 className="text-3xl md:text-[44px] font-black text-white text-center tracking-tight mb-2 uppercase drop-shadow-sm">
                        ĐIỀU KHOẢN DỊCH VỤ
                    </h1>
                    <p className="text-white text-base md:text-[20px] font-bold tracking-widest uppercase mb-8">
                        (TERMS OF SERVICE)
                    </p>
                    <div className="w-16 h-px bg-white/40 mb-4"></div>
                    <p className="text-white/80 text-[10px] sm:text-xs tracking-[0.2em] font-medium uppercase pt-2 px-8 text-center">
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
                                <span className="text-[#C81D31]">Điều khoản Dịch vụ</span>
                            </div>
                            <BackButton />
                        </div>

                        <div className="space-y-12">
                            {/* Section 1 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">1. Điều kiện sử dụng và Tư cách thành viên</h2>
                                </div>
                                <p className="text-sm md:text-base text-slate-600 mb-6 pl-4">
                                    Để tham gia vào mạng xã hội VLUconnect, người dùng phải đáp ứng các tiêu chuẩn xác thực sau:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#f8f9fa] rounded-xl p-5 flex gap-4 border border-slate-100 items-start">
                                        <div className="text-[#C81D31] shrink-0 mt-0.5"><ShieldCheck size={20} className="w-5 h-5" /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Tài khoản Nội bộ</h3>
                                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">Chỉ dành cho sinh viên, giảng viên và cán bộ đang công tác tại VLU.</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-5 flex gap-4 border border-slate-100 items-start">
                                        <div className="text-[#C81D31] shrink-0 mt-0.5"><Key size={20} className="w-5 h-5 transform -scale-x-100" /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm md:text-base mb-1">Xác thực SSO</h3>
                                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">Bắt buộc đăng nhập thông qua hệ thống định danh duy nhất của trường.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">2. Kiểm duyệt AI và Cơ chế Global Ban</h2>
                                </div>
                                <p className="text-sm md:text-base text-slate-600 mb-6 pl-4">
                                    Hệ thống áp dụng công nghệ tự động để đảm bảo môi trường học thuật chuyên nghiệp:
                                </p>
                                <div className="bg-[#fff4f5] border border-[#ffe0e3] rounded-xl p-5 md:p-6 flex flex-col md:flex-row gap-4 items-start">
                                    <div className="text-[#C81D31] shrink-0 mt-0.5 bg-white p-2.5 rounded-full shadow-sm">
                                        <Gavel size={22} className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm md:text-base mb-2">
                                            Cơ chế Kiểm duyệt AI (AI Moderation)
                                        </h3>
                                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                                            Tất cả bài viết và bình luận được phân tích tự động. Các vi phạm nghiêm trọng về chuẩn mực đạo đức hoặc học thuật sẽ dẫn đến lệnh <span className="font-bold">Global Ban</span> - đình chỉ quyền truy cập trên toàn hệ thống ngay lập tức.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">3. Tiêu chuẩn cộng đồng học thuật</h2>
                                </div>
                                <p className="text-sm md:text-base text-slate-600 pl-4 border-l-2 border-transparent">
                                    Người dùng cam kết thực hiện các quy tắc ứng xử văn minh trong môi trường đại học, bao gồm việc tôn trọng quyền tác giả và sở hữu trí tuệ trong các thảo luận chuyên môn.
                                </p>
                            </section>

                            {/* Section 4 */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">4. Các hành vi bị nghiêm cấm</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center gap-3 border border-slate-100 shadow-sm">
                                        <div className="text-[#C81D31] bg-[#fff4f5] p-2.5 rounded-full"><AlertCircle size={24} /></div>
                                        <h3 className="font-bold text-slate-900 text-sm md:text-base mt-1">Nội dung độc hại</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">Nghiêm cấm chia sẻ nội dung gây thù ghét hoặc không lành mạnh.</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center gap-3 border border-slate-100 shadow-sm">
                                        <div className="text-[#C81D31] bg-[#fff4f5] p-2.5 rounded-full"><Copyright size={24} /></div>
                                        <h3 className="font-bold text-slate-900 text-sm md:text-base mt-1">Vi phạm bản quyền</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">Sử dụng tài liệu học thuật trái phép hoặc đạo văn.</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center gap-3 border border-slate-100 shadow-sm">
                                        <div className="text-[#C81D31] bg-[#fff4f5] p-2.5 rounded-full"><ShieldAlert size={24} /></div>
                                        <h3 className="font-bold text-slate-900 text-sm md:text-base mt-1">Xâm nhập hệ thống</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">Cố ý tấn công hoặc làm gián đoạn dịch vụ mạng.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 5 */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">5. Quyền và Trách nhiệm của VLU</h2>
                                </div>
                                <div className="space-y-3 pl-4">
                                    <div className="bg-[#f8f9fa] rounded-xl p-4 flex items-center gap-4">
                                        <div className="text-[#C81D31]"><Settings size={20} /></div>
                                        <p className="font-semibold text-slate-800 text-sm md:text-base">Quyền thay đổi tính năng và giao diện để tối ưu hóa học tập.</p>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-4 flex items-center gap-4">
                                        <div className="text-[#C81D31]"><History size={20} /></div>
                                        <p className="font-semibold text-slate-800 text-sm md:text-base">Lưu trữ nhật ký hoạt động phục vụ công tác hậu kiểm.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 6 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 bg-[#C81D31] rounded-full"></div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900">6. Giải quyết tranh chấp và Kỷ luật</h2>
                                </div>
                                <p className="text-sm md:text-base text-slate-600 pl-4 border-l-2 border-transparent">
                                    Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua Hội đồng Kỷ luật của Trường Đại học Văn Lang. Quyết định của Nhà trường là quyết định cuối cùng.
                                </p>
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
