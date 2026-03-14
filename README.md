# VLU Connect - Hướng Dẫn Tổ Chức & Cài Đặt Hệ Thống

Hệ thống **VLU Connect** là một mạng xã hội/chia sẻ nội dung hiện đại, được xây dựng theo kiến trúc **Monorepo** với **Turborepo**. Hệ thống sử dụng Next.js (App Router) cho phần Giao diện, Supabase cho quản trị CSDL & Backend Service, cùng với các thành phần caching/messaging mạnh mẽ như Redis và RabbitMQ.

---

## 🚀 1. Công Nghệ Sử Dụng (Tech Stack)

- **Ngôn ngữ:** TypeScript (Node.js >= 20.x)
- **Kiến trúc:** Turborepo (Monorepo)
- **Quản lý Package:** `pnpm` (v10.x)
- **Frontend / Client App:** Next.js 16 (React 19), Tailwind CSS v4, Framer Motion, GSAP, Radix UI.
- **State & Data Fetching:** Zustand, TanStack Query.
- **Backend & Cơ sở dữ liệu:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Message Broker & Caching:** RabbitMQ, Redis.

---

## 📋 2. Yêu Cầu Hệ Thống Trước Khi Cài Đặt (Prerequisites)

Hãy đảm bảo máy tính của bạn đã được cài đặt các công cụ sau:

1. **Node.js** (Phiên bản `>= 20.x` được khuyên dùng).
2. **pnpm** (Phiên bản `10.27.0`): `npm install -g pnpm@10.27.0`
3. **Turborepo CLI** (Quản lý các Package trong kiến trúc Monorepo): `npm install -g turbo`
4. **Môi trường Database & Caching**:
   - Hệ thống được thiết kế linh hoạt. Đối với thiết lập qua dịch vụ Cloud: Bạn cần chuẩn bị sẵn tài khoản **Supabase Cloud** (Database), **Upstash** (Redis) và **CloudAMQP** (RabbitMQ).
   - *Hoặc nếu muốn chạy dự án Local hoàn toàn giả lập:* Bạn sẽ cần cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) và công cụ dòng lệnh [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`.

---

## ⚙️ 3. Hướng Dẫn Cài Đặt (Step-by-Step Installation)

### Bước 1: Clone dự án và cài đặt Dependencies

Mở Terminal và thực thi các lệnh sau:

```bash
# Clone dự án từ Github (thay thế URL git của bạn)
git clone <repository-url>

# Truy cập vào thư mục dự án
cd <repository-name>

# Cài đặt toàn bộ các packages cho workspace (sử dụng pnpm)
pnpm install
```

### Bước 2: Cấu Hình Biến Môi Trường (Environment Variables)

Hệ thống cung cấp sẵn file `env.local.example`. Bạn cần tạo một bản sao để ứng dụng có thể đọc cấu hình.

👉 **Sau đó, mở file `.env.local` và tiến hành thêm URL/Key:**

- **Thiết lập với Cloud (Upstash, CloudAMQP, Supabase Cloud):**
  Lấy URL kết nối của Redis (`REDIS_URL`) từ **Upstash** và RabbitMQ (`RABBITMQ_URL`) từ **CloudAMQP**, cùng với key cấu hình lấy từ Project API Settings của **Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) dán vào cấu hình file môi trường của bạn.
- **Thiết lập với Docker:**
  Giữ nguyên các giá trị ban đầu, dự án được thiết lập sẵn kết nối qua Docker File và Docker Compose (`redis://localhost:6379`, `amqp://guest:guest@localhost:5672`).

Hệ thống Docker yêu cầu biến môi trường riêng cho từng ứng dụng. Tạo các file `.env` sau:

#### `apps/web/.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=<your-service-role-key>
NEXT_PUBLIC_SUPABASE_ID=<your-supabase-project-id>
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://<project-id>.storage.supabase.co
NODE_ENV=production
REDIS_URL=<cloud-redis-url-hoặc-redis://localhost:6379>
RABBITMQ_URL=<cloud-amqp-url-hoặc-amqp://guest:guest@localhost:5672>
```

#### `apps/admin/.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=<your-service-role-key>
BEFORE_USER_CREATED_HOOK_SECRET=<your-hook-secret>
NODE_ENV=production
REDIS_URL=<cloud-redis-url-hoặc-redis://localhost:6379>
RABBITMQ_URL=<cloud-amqp-url-hoặc-amqp://guest:guest@localhost:5672>
```

#### `apps/workers/.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=<your-service-role-key>
BEFORE_USER_CREATED_HOOK_SECRET=<your-hook-secret>
NODE_ENV=production
REDIS_URL=<cloud-redis-url-hoặc-redis://localhost:6379>
RABBITMQ_URL=<cloud-amqp-url-hoặc-amqp://guest:guest@localhost:5672>
HF_TOKEN=<your-huggingface-token>
```

> `HF_TOKEN` (Hugging Face) chỉ cần cho Worker — dùng để gọi mô hình AI xử lý tác vụ nền.
> `BEFORE_USER_CREATED_HOOK_SECRET` dùng cho webhook xác thực từ Supabase Auth.

### Bước 3: Đẩy cấu trúc Database lên Supabase Cloud

Bởi vì Redis và RabbitMQ đã chạy trực tiếp trên Upstash và CloudAMQP dưới dạng serverless, bạn không cần cài đặt chúng về máy nữa. Điều cần thiết duy nhất là đẩy cấu trúc DB vào trong Supabase Cloud.

```bash
# 1. Liên kết dự án lấy cấu hình thông qua Reference ID trên Supabase Cloud của bạn
npx supabase link --project-ref <your-supabase-project-id>

# 2. Đồng bộ/Đẩy cấu trúc Database Schema từ máy lên Cloud
npx supabase db push
```

#### Tùy chọn giả lập khi chạy bằng Docker:
*Lưu ý: Bạn được quyền bỏ qua bước này nếu bạn đã dùng Upstash và CloudAMQP.*

Chỉ thực hiện khi dùng Docker Desktop cho RabbitMQ và Caching.

```bash
# 1. Khởi chạy RabbitMQ và Redis
docker-compose up -d

# 2. Khởi tạo Database Supabase và bảng vào local
npx supabase start
```

> **Lưu ý**: Lệnh `start` của Supabase giúp mô phỏng Table/RPC và tự đưa vào dữ liệu mồi (`supabase/seed.sql`). Nếu dùng Cloud ở phía trên, bạn có thể tự mình chạy thủ công seed data thông qua SQL Editor trên Dashboard web của Supabase.

#### Tạo Storage Buckets

Trên **Supabase Dashboard > Storage**, tạo các bucket sau (đặt **Public**):

| Bucket       | Mô tả                           |
| :----------- | :------------------------------- |
| `avatars`    | Ảnh đại diện người dùng         |
| `posts`      | Media đính kèm bài viết         |
| `messages`   | Media trong tin nhắn             |
| `groups`     | Ảnh đại diện và ảnh bìa nhóm    |
| `backgrounds`| Ảnh bìa trang cá nhân           |

> File `supabase/schema.sql` chứa bản dump đầy đủ của schema hiện tại (bao gồm tables, functions, RLS policies, triggers). Bạn có thể tham khảo file này để hiểu cấu trúc cơ sở dữ liệu.

---

## 🔐 4. Thiết lập Microsoft Entra ID (Dùng cho Supabase Auth)

Hệ thống có tích hợp đăng nhập qua Microsoft. Bạn cần thiết lập Microsoft Entra ID (trước đây là Azure AD) để có thể xác thực người dùng.

1. **Đăng nhập vào Azure Portal** ([https://portal.azure.com/](https://portal.azure.com/)).
2. Mở dịch vụ **Microsoft Entra ID** và chọn **App registrations** > **New registration**.
3. Đặt tên hiển thị cho ứng dụng. Tại phần **Redirect URI**, chọn loại **Web** và nhập địa chỉ callback của Supabase:
   - Nếu chạy Local/Docker: `http://localhost:54321/auth/v1/callback`
   - Nếu chạy qua Supabase Cloud: `https://<mã-project-trên-supabase-của-bạn>.supabase.co/auth/v1/callback`
4. Lấy **Application (client) ID** tại màn hình Overview của app vừa tạo.
5. Vào menu **Certificates & secrets**, tạo một **New client secret** mới và copy lại `Value` (đây là Secret Key, chỉ hiện một lần).
6. **Mở Supabase Dashboard** (Local Studio hoặc Cloud), vào **Authentication** > **Providers** > Bật **Azure** và dán Client ID cùng Client Secret vào, sau đó Save lại. Thêm Redirect URLs ở URL Configuration để trang callback về đúng.

---

## 💻 5. Chạy Ứng Dụng (Running the Application)

Với hệ thống Turborepo, bạn chỉ cần thực hiện 1 lệnh đơn giản ở thư mục gốc (root) để khởi động toàn bộ môi trường phát triển:

```bash
pnpm dev
```

- Lệnh này sẽ kích hoạt `next dev` tại `apps/web`.
- Giao diện của Next.js sẽ khởi chạy mặc định tại: **http://localhost:3000**
- Trong lúc code, bạn có thể chỉnh sửa tại `apps/web/app/`. Hệ thống sẽ tự động Hot Reload.

### 🛠 Các Lệnh Khác Trong Root (Useful Commands)

| Lệnh | Mô tả |
| :--- | :--- |
| `pnpm build` | Build toàn bộ các app và packages để chuẩn bị production. |
| `pnpm dev` | Khởi chạy môi trường Dev cho tất cả ứng dụng. |
| `pnpm lint` | Kiểm tra cú pháp, lỗi code với ESLint trên toàn hệ thống. |
| `pnpm format` | Tự động fix lỗi format cho các file `.ts, .tsx, .md`. |
| `pnpm check-types` | Kiểm tra lỗi TypeScript trên toàn bộ các workspace. |
| `pnpm --filter @repo/web dev:all` | Khởi chạy Next.js cùng với Post Worker (nằm ở apps/web). |

---

## 🐳 6. Triển Khai Production Với Docker

```bash
docker-compose up --build -d
```

**Các dịch vụ sau khi khởi chạy:**

| Dịch vụ      | Mô tả                              | Truy cập                      |
| :----------- | :---------------------------------- | :---------------------------- |
| **web**      | Giao diện Frontend (Next.js)        | `http://localhost:3000`        |
| **admin**    | Quản trị Admin (Next.js)            | `http://localhost:3001`        |
| **worker**   | Xử lý tác vụ nền (×3 replicas)     | Chạy ngầm                     |
| **redis**    | In-memory cache                     | `localhost:6379`               |
| **rabbitmq** | Message Broker + Management UI      | `localhost:5672` / `localhost:15672` |

> Trong `docker-compose.yml`, `REDIS_URL` và `RABBITMQ_URL` đã được override bằng block `environment` để trỏ tới các container nội bộ (`redis://redis:6379`, `amqp://guest:guest@rabbitmq:5672`), đảm bảo các service giao tiếp đúng trong mạng Docker.

### Lệnh Docker Thường Dùng

| Thao Tác                          | Lệnh                              |
| :-------------------------------- | :--------------------------------- |
| Dừng tất cả dịch vụ              | `docker-compose down`              |
| Rebuild & Khởi động              | `docker-compose up --build -d`     |
| Xem danh sách Container          | `docker-compose ps`                |
| Theo dõi Log toàn cục            | `docker-compose logs -f`           |
| Log riêng cho Web                | `docker-compose logs -f web`       |
| Log riêng cho RabbitMQ           | `docker-compose logs -f rabbitmq`  |

---

## 📁 7. Cấu Trúc Thư Mục (Folder Structure)

Kiến trúc monorepo phân tách chức năng thành các phần rõ ràng:

```text
the-last/
├── apps/
│   ├── web/           # Ứng dụng Frontend chính dành cho người dùng (Next.js 16)
│   ├── admin/         # Ứng dụng Quản trị nội bộ / Dashboard (Next.js)
│   └── workers/       # Background Worker xử lý hàng đợi (RabbitMQ, HF_TOKEN...)
├── packages/          # Các thư viện dùng chung cho toàn bộ dự án
│   ├── eslint-config/ # Cấu hình ESLint chung
│   ├── rabbitmq/      # Cấu hình & Client RabbitMQ
│   ├── redis/         # Cấu hình & Client Redis
│   ├── shared/        # Nơi chứa Types (TypeScript), Interface dùng chung
│   ├── supabase/      # Cấu hình Database Supabase Client/Server
│   ├── typescript-config/ # Cấu hình TS config
│   ├── ui/            # UI Component Library (Tailwind, Radix UI)
│   └── utils/         # Các utility helper functions
├── supabase/          # Backend configuration: Migrations, Seed, Schema dump
├── infra/             # Dockerfiles cho Redis, RabbitMQ
├── docker-compose.yml # File chạy toàn bộ hệ thống qua Docker
└── turbo.json         # Cấu hình orchestration của Turborepo
```

---

## 📚 Tác Giả & Hỗ Trợ

Nếu gặp sự cố trong lúc cài đặt môi trường, vui lòng kiểm tra lại cấu hình Docker và tham khảo trực tiếp [Tài liệu Turborepo](https://turborepo.dev/docs), [Tài liệu Next.js](https://nextjs.org/docs) và [Tài liệu Supabase](https://supabase.com/docs). Mọi đóng góp xin vui lòng tạo Pull Request vào nhánh chính! 🎉
