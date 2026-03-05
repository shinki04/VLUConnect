import {
    AlertCircle,
    Copyright,
    Gavel,
    History,
    Key,
    RefreshCw,
    Settings,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function TermsOfServicePageWrapper() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
            <TermsOfServicePage />
        </React.Suspense>
    );
}

function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
            <main className="flex-1 w-full bg-[#f8f9fa] relative pb-20">
                {/* ================= HERO ================= */}
                <div className="relative min-h-[320px] w-full bg-[#C81D31] flex flex-col items-center justify-center px-4 pb-20">
                    {/* Back Button */}
                    <div className="absolute top-6 left-4 md:left-10">
                        <Link
                            href="/dashboard"
                            className="
                flex items-center gap-2
                bg-white text-[#C81D31]
                px-5 py-2.5
                rounded-full
                shadow-lg
                hover:scale-105
                hover:bg-white/90
                transition-all duration-300
                text-sm font-bold
              "
                        >
                            ← Trở về
                        </Link>
                    </div>

                    <h1 className="text-3xl md:text-[44px] font-black text-white text-center tracking-tight mb-2 uppercase">
                        ĐIỀU KHOẢN DỊCH VỤ
                    </h1>

                    <p className="text-white text-base md:text-[20px] font-bold tracking-widest uppercase mb-6">
                        (TERMS OF SERVICE)
                    </p>

                    <div className="w-16 h-px bg-white/40 mb-4" />

                    <p className="text-white/80 text-xs tracking-[0.2em] font-medium uppercase text-center max-w-md leading-relaxed">
                        MẠNG XÃ HỘI HỌC THUẬT NỘI BỘ VLUCONNECT
                    </p>
                </div>

                {/* ================= CONTENT ================= */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-10">
                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 lg:p-14">

                        {/* Breadcrumb */}
                        <div className="flex items-center text-xs font-medium text-slate-500 mb-10">
                            <Link
                                href="/dashboard"
                                className="hover:text-[#C81D31] transition-colors"
                            >
                                Trang chủ
                            </Link>
                            <span className="mx-2">{">"}</span>
                            <span className="text-[#C81D31]">
                                Điều khoản Dịch vụ
                            </span>
                        </div>

                        <div className="space-y-14">

                            {/* SECTION 1 */}
                            <section>
                                <SectionTitle title="1. Điều kiện sử dụng & Tư cách thành viên" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <InfoCard
                                        icon={<ShieldCheck size={20} />}
                                        title="Tài khoản nội bộ"
                                        desc="Chỉ dành cho sinh viên, giảng viên và cán bộ đang công tác tại VLU."
                                    />
                                    <InfoCard
                                        icon={<Key size={20} />}
                                        title="Xác thực SSO"
                                        desc="Bắt buộc đăng nhập thông qua hệ thống định danh duy nhất của trường."
                                    />
                                </div>
                            </section>

                            {/* SECTION 2 */}
                            <section>
                                <SectionTitle title="2. Quyền và trách nhiệm của người dùng" />
                                <div className="space-y-4">
                                    <ListItem
                                        icon={<Gavel size={18} />}
                                        text="Chịu trách nhiệm về nội dung đã đăng tải."
                                    />
                                    <ListItem
                                        icon={<AlertCircle size={18} />}
                                        text="Không đăng tải nội dung vi phạm pháp luật hoặc quy định của nhà trường."
                                    />
                                    <ListItem
                                        icon={<ShieldAlert size={18} />}
                                        text="Bảo mật thông tin tài khoản và mật khẩu cá nhân."
                                    />
                                </div>
                            </section>

                            {/* SECTION 3 */}
                            <section>
                                <SectionTitle title="3. Nội dung và bản quyền" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <PolicyBlock
                                        icon={<Copyright size={20} />}
                                        title="Quyền sở hữu nội dung"
                                        desc="Người dùng giữ quyền sở hữu nội dung của mình nhưng cấp quyền hiển thị trên nền tảng."
                                    />
                                    <PolicyBlock
                                        icon={<ShieldCheck size={20} />}
                                        title="Tôn trọng bản quyền"
                                        desc="Nghiêm cấm sao chép hoặc sử dụng nội dung của người khác khi chưa được phép."
                                    />
                                </div>
                            </section>

                            {/* SECTION 4 */}
                            <section>
                                <SectionTitle title="4. Quản lý và xử lý vi phạm" />
                                <div className="space-y-4">
                                    <ListItem
                                        icon={<Settings size={18} />}
                                        text="Ban quản trị có quyền chỉnh sửa hoặc xoá nội dung vi phạm."
                                    />
                                    <ListItem
                                        icon={<History size={18} />}
                                        text="Tài khoản vi phạm nhiều lần có thể bị tạm khóa hoặc khóa vĩnh viễn."
                                    />
                                </div>
                            </section>

                        </div>

                        {/* FOOTER */}
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

/* ================= COMPONENTS ================= */

function SectionTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 mb-6">
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
        <div className="bg-[#f8f9fa] rounded-xl p-6 flex gap-4 border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="text-[#C81D31] shrink-0 mt-1">{icon}</div>
            <div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function PolicyBlock({
    icon,
    title,
    desc,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center gap-3 border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="text-[#C81D31] bg-[#fff4f5] p-3 rounded-full">
                {icon}
            </div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}

function ListItem({
    icon,
    text,
}: {
    icon: React.ReactNode;
    text: string;
}) {
    return (
        <div className="bg-[#f8f9fa] rounded-xl p-4 flex items-center gap-4 border border-slate-100">
            <div className="text-[#C81D31]">{icon}</div>
            <p className="font-semibold text-slate-800 text-sm md:text-base">
                {text}
            </p>
        </div>
    );
}