import {
    FileText,
    Globe,
    Info,
    Lock,
    LogIn,
    MousePointerClick,
    RefreshCw,
    UserCircle,
    Users,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function PrivacyPolicyPageWrapper() {
    return (
        <React.Suspense
            fallback={<div className="min-h-screen bg-[#F5F5F5]" />}
        >
            <PrivacyPolicyPage />
        </React.Suspense>
    );
}

function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
            <main className="flex-1 w-full bg-[#f8f9fa] relative pb-20">

                {/* ================= HERO ================= */}
                <div className="relative min-h-[340px] w-full bg-[#C81D31] flex flex-col items-center justify-center px-4 pb-20">

                    {/* BACK BUTTON GLASS */}
                    <div className="absolute top-6 left-4 md:left-10">
                        <Link
                            href="/dashboard"
                            className="
                                flex items-center gap-2
                                bg-white/15 backdrop-blur-md
                                text-white
                                px-4 py-2
                                rounded-full
                                border border-white/30
                                shadow-md
                                hover:bg-white hover:text-[#C81D31]
                                hover:shadow-lg
                                transition-all duration-300
                                text-sm font-semibold
                            "
                        >
                            ← Trở về
                        </Link>
                    </div>

                    <h1 className="text-3xl md:text-[44px] font-black text-white text-center tracking-tight mb-2 uppercase">
                        Chính sách bảo mật
                    </h1>

                    <p className="text-white text-base md:text-[20px] font-bold tracking-widest uppercase mb-6">
                        (Privacy Policy)
                    </p>

                    <div className="w-16 h-px bg-white/40 mb-4" />

                    <p className="text-white/80 text-[10px] sm:text-xs tracking-[0.2em] font-medium uppercase text-center max-w-md leading-relaxed">
                        MẠNG XÃ HỘI HỌC THUẬT NỘI BỘ VLUCONNECT
                    </p>
                </div>

                {/* ================= CONTENT CARD ================= */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-10">
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-6 md:p-10 lg:p-12 pb-8">

                        {/* Breadcrumb (đã bỏ BackButton ở đây) */}
                        <div className="flex items-center text-xs font-medium text-slate-500 mb-8 md:mb-10">
                            <Link
                                href="/dashboard"
                                className="hover:text-[#C81D31] transition-colors"
                            >
                                Trang chủ
                            </Link>
                            <span className="mx-2">{">"}</span>
                            <span className="text-[#C81D31]">
                                Chính sách Bảo mật
                            </span>
                        </div>

                        <div className="space-y-12">

                            {/* Section 1 */}
                            <section>
                                <SectionTitle title="1. Thông tin chúng tôi thu thập" />

                                <p className="text-sm md:text-base text-slate-600 mb-6">
                                    Chúng tôi thu thập các loại thông tin sau để cung cấp
                                    và cải thiện dịch vụ VLUconnect cho cộng đồng học thuật:
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard
                                        icon={<LogIn size={20} strokeWidth={2.5} />}
                                        title="Thông tin đăng nhập SSO"
                                        desc="Xác thực qua hệ thống tài khoản Văn Lang duy nhất (Single Sign-On)."
                                    />

                                    <InfoCard
                                        icon={<UserCircle size={20} strokeWidth={2.5} />}
                                        title="Thông tin hồ sơ cá nhân"
                                        desc="Bao gồm Họ tên, Khoa, Ngành, Mã số SV/GV và ảnh đại diện."
                                    />

                                    <InfoCard
                                        icon={<FileText size={20} strokeWidth={2.5} />}
                                        title="Nội dung người dùng (UGC)"
                                        desc="Các bài viết học thuật, thảo luận, bình luận và tài liệu chia sẻ."
                                    />

                                    <InfoCard
                                        icon={<MousePointerClick size={20} strokeWidth={2.5} />}
                                        title="Dữ liệu tương tác"
                                        desc="Lịch sử tìm kiếm, lượt thích, chia sẻ và hành vi trên nền tảng."
                                    />
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section>
                                <SectionTitle title="2. Cách chúng tôi sử dụng thông tin" />

                                <div className="bg-[#fff0f2] rounded-xl p-6 flex gap-4 border border-[#fee2e2]">
                                    <div className="text-[#C81D31] flex items-center justify-center p-3 bg-white rounded-full shadow-sm shrink-0">
                                        <Info size={24} strokeWidth={2.5} />
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">
                                            Phân tích bằng Trí tuệ Nhân tạo (AI Analysis)
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Chúng tôi triển khai các mô hình AI để tự động
                                            kiểm duyệt nội dung, phát hiện hành vi vi phạm
                                            quy tắc cộng đồng và đảm bảo môi trường học thuật
                                            an toàn.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section>
                                <SectionTitle title="3. Chia sẻ thông tin của bạn" />

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <PrivacyLevel
                                        icon={<Globe size={28} strokeWidth={2.5} />}
                                        title="Công khai"
                                        desc="Hiển thị với toàn bộ cộng đồng VLUconnect."
                                    />
                                    <PrivacyLevel
                                        icon={<Users size={28} strokeWidth={2.5} />}
                                        title="Bạn bè"
                                        desc="Chỉ bạn bè mới xem được."
                                    />
                                    <PrivacyLevel
                                        icon={<Lock size={28} strokeWidth={2.5} />}
                                        title="Riêng tư"
                                        desc="Chỉ bạn hoặc nhóm được chỉ định."
                                    />
                                </div>
                            </section>

                            {/* Section 4 */}
                            <section>
                                <SectionTitle title="4. Lưu trữ và Bảo mật dữ liệu" />

                                <div className="bg-[#f8f9fa] rounded-xl p-6 border border-slate-100">
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Dữ liệu được lưu trữ tại Trung tâm Dữ liệu
                                        của Trường Đại học Văn Lang. Khi bạn xóa nội dung,
                                        chúng tôi áp dụng cơ chế{" "}
                                        <span className="font-bold text-[#C81D31]">
                                            &quot;Soft Delete&quot;
                                        </span>{" "}
                                        — nội dung sẽ không hiển thị nhưng được lưu tối đa
                                        30 ngày để phục vụ phục hồi hoặc yêu cầu pháp lý.
                                    </p>
                                </div>
                            </section>

                        </div>

                        {/* Footer */}
                        <div className="mt-16 flex justify-center">
                            <div className="bg-[#f8f9fa] text-slate-500 text-xs py-2 px-6 rounded-full font-medium flex items-center gap-2 border border-slate-100">
                                <RefreshCw size={12} />
                                Cập nhật lần cuối: Ngày 05 tháng 03 năm 2026
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

/* ================= REUSABLE COMPONENTS ================= */

function SectionTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 bg-[#C81D31] rounded-full" />
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
                {title}
            </h2>
        </div>
    );
}

function InfoCard({
    icon,
    title,
    desc,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <div className="bg-[#f8f9fa] rounded-xl p-5 flex gap-4 border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="text-[#C81D31] mt-1 shrink-0">{icon}</div>
            <div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function PrivacyLevel({
    icon,
    title,
    desc,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <div className="bg-[#f8f9fa] rounded-xl p-6 flex flex-col items-center text-center gap-3 border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="text-[#C81D31]">{icon}</div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}