import Link from "next/link";
import * as React from "react";
import { BackButton } from "@/components/ui/BackButton";
import {
    ShieldCheck,
    Key,
    Gavel,
    AlertCircle,
    Copyright,
    ShieldAlert,
    Settings,
    History,
    RefreshCw,
} from "lucide-react";

export default function TermsOfServicePageWrapper() {
    return (
        <React.Suspense
            fallback={<div className="min-h-screen bg-[#F5F5F5]" />}
        >
            <TermsOfServicePage />
        </React.Suspense>
    );
}

function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
            <main className="flex-1 w-full bg-[#f8f9fa] relative pb-20">
                {/* ================= HERO ================= */}
                <div className="h-[280px] w-full bg-[#C81D31] flex flex-col items-center pt-12 md:pt-16 px-4">
                    <h1 className="text-3xl md:text-[44px] font-black text-white text-center tracking-tight mb-2 uppercase">
                        ĐIỀU KHOẢN DỊCH VỤ
                    </h1>
                    <p className="text-white text-base md:text-[20px] font-bold tracking-widest uppercase mb-8">
                        (TERMS OF SERVICE)
                    </p>
                    <div className="w-16 h-px bg-white/40 mb-4" />
                    <p className="text-white/80 text-[10px] sm:text-xs tracking-[0.2em] font-medium uppercase pt-2 px-8 text-center">
                        VLUCONNECT INTERNAL ACADEMIC SOCIAL NETWORK
                    </p>
                </div>

                {/* ================= CONTENT CARD ================= */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16">
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-6 md:p-10 lg:p-12 pb-8">

                        {/* Breadcrumb */}
                        <div className="flex justify-between items-center mb-8 md:mb-10">
                            <div className="flex items-center text-xs font-medium text-slate-500">
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
                            <BackButton />
                        </div>

                        <div className="space-y-12">
                            {/* SECTION 1 */}
                            <section>
                                <SectionTitle title="1. Điều kiện sử dụng và Tư cách thành viên" />

                                <p className="text-sm md:text-base text-slate-600 mb-6">
                                    Để tham gia VLUconnect, người dùng phải đáp ứng các tiêu chuẩn xác thực sau:
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard
                                        icon={<ShieldCheck size={20} />}
                                        title="Tài khoản Nội bộ"
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
                                <SectionTitle title="2. Kiểm duyệt AI và Cơ chế Global Ban" />

                                <div className="bg-[#fff4f5] border border-[#ffe0e3] rounded-xl p-6 flex gap-4">
                                    <div className="text-[#C81D31] bg-white p-3 rounded-full shadow-sm shrink-0">
                                        <Gavel size={22} />
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">
                                            AI Moderation
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Tất cả bài viết và bình luận được phân tích tự động.
                                            Các vi phạm nghiêm trọng có thể dẫn đến lệnh{" "}
                                            <span className="font-bold">Global Ban</span> —
                                            đình chỉ quyền truy cập trên toàn hệ thống.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3 */}
                            <section>
                                <SectionTitle title="3. Tiêu chuẩn cộng đồng học thuật" />
                                <p className="text-sm md:text-base text-slate-600">
                                    Người dùng cam kết tôn trọng chuẩn mực học thuật,
                                    quyền sở hữu trí tuệ và hành xử văn minh trong môi
                                    trường đại học.
                                </p>
                            </section>

                            {/* SECTION 4 */}
                            <section>
                                <SectionTitle title="4. Các hành vi bị nghiêm cấm" />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <PolicyBlock
                                        icon={<AlertCircle size={24} />}
                                        title="Nội dung độc hại"
                                        desc="Nghiêm cấm chia sẻ nội dung gây thù ghét hoặc không lành mạnh."
                                    />
                                    <PolicyBlock
                                        icon={<Copyright size={24} />}
                                        title="Vi phạm bản quyền"
                                        desc="Sử dụng tài liệu học thuật trái phép hoặc đạo văn."
                                    />
                                    <PolicyBlock
                                        icon={<ShieldAlert size={24} />}
                                        title="Xâm nhập hệ thống"
                                        desc="Cố ý tấn công hoặc làm gián đoạn dịch vụ mạng."
                                    />
                                </div>
                            </section>

                            {/* SECTION 5 */}
                            <section>
                                <SectionTitle title="5. Quyền và Trách nhiệm của VLU" />

                                <div className="space-y-3">
                                    <ListItem
                                        icon={<Settings size={20} />}
                                        text="Quyền thay đổi tính năng và giao diện để tối ưu hóa học tập."
                                    />
                                    <ListItem
                                        icon={<History size={20} />}
                                        text="Lưu trữ nhật ký hoạt động phục vụ công tác hậu kiểm."
                                    />
                                </div>
                            </section>

                            {/* SECTION 6 */}
                            <section>
                                <SectionTitle title="6. Giải quyết tranh chấp và Kỷ luật" />
                                <p className="text-sm md:text-base text-slate-600">
                                    Mọi tranh chấp sẽ được giải quyết thông qua Hội đồng
                                    Kỷ luật của Trường Đại học Văn Lang. Quyết định của
                                    Nhà trường là quyết định cuối cùng.
                                </p>
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
            <div className="text-[#C81D31] shrink-0 mt-1">{icon}</div>
            <div>
                <h3 className="font-bold text-slate-900 mb-1">
                    {title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                    {desc}
                </p>
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
        <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center gap-3 border border-slate-100 shadow-sm">
            <div className="text-[#C81D31] bg-[#fff4f5] p-2.5 rounded-full">
                {icon}
            </div>
            <h3 className="font-bold text-slate-900">
                {title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
                {desc}
            </p>
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
        <div className="bg-[#f8f9fa] rounded-xl p-4 flex items-center gap-4">
            <div className="text-[#C81D31]">{icon}</div>
            <p className="font-semibold text-slate-800 text-sm md:text-base">
                {text}
            </p>
        </div>
    );
}