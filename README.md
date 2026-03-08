# The Last - Hướng Dẫn Triển Khai (Deployment Guide)

Hệ thống **The Last** là một mạng xã hội/chia sẻ nội dung hiện đại, xây dựng theo kiến trúc **Monorepo** với **Turborepo**. Sử dụng Next.js (App Router) cho giao diện, Supabase cho Backend/CSDL, cùng Redis và RabbitMQ.

---

## 1. Yêu Cầu Cài Đặt (Prerequisites)

- **Docker Desktop** (hoặc Docker Engine + Docker Compose V2).
- **Supabase Cloud** hoặc **Supabase Local CLI** cho quản trị CSDL.
- **Node.js** (>= 20.x) và **pnpm** (>= 10.x) dùng hỗ trợ thao tác Sync Database.

---

## 2. Chuẩn Bị File Môi Trường (.env)

Hệ thống Docker yêu cầu biến môi trường cho từng ứng dụng. Tạo các file `.env` sau:
- `apps/web/.env`
- `apps/admin/.env`
- `apps/workers/.env`

> **Lưu ý**: `REDIS_URL` và `RABBITMQ_URL` đã được override trong `docker-compose.yml` qua block `environment` để trỏ tới các container nội bộ. Bạn không cần khai báo chúng trong file `.env` khi chạy Docker. Tuy nhiên, khi chạy dev local (không Docker), bạn cần khai báo URL cloud (Upstash, CloudAMQP) hoặc `localhost` trong `.env`.

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

---

## 3. Khởi Tạo Cơ Sở Dữ Liệu (Supabase)

```bash
pnpm install

# Liên kết với Project trên Supabase Cloud
npx supabase link --project-ref <mã-project-trên-supabase-của-bạn>

# Đẩy lược đồ (Schema) CSDL lên máy chủ
npx supabase db push
```

> Bạn có thể chạy seed data thủ công qua SQL Editor trên Dashboard Supabase.

---

## 4. Xây Dựng Và Khởi Chạy Với Docker

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

---

## 5. Thiết Lập Microsoft Entra ID (Auth)

1. Đăng ký trên [Azure Portal](https://portal.azure.com/).
2. Đặt URL Callback: `https://<mã-project-supabase>.supabase.co/auth/v1/callback` (Cloud) hoặc `http://localhost:54321/auth/v1/callback` (Local CLI).
3. Lấy `Client ID` & `Client Secret` rồi cài vào **Authentication > Providers > Azure** trên Supabase Dashboard.

---

## 6. Lệnh Docker Thường Dùng

| Thao Tác                          | Lệnh                              |
| :-------------------------------- | :--------------------------------- |
| Dừng tất cả dịch vụ              | `docker-compose down`              |
| Rebuild & Khởi động              | `docker-compose up --build -d`     |
| Xem danh sách Container          | `docker-compose ps`                |
| Theo dõi Log toàn cục            | `docker-compose logs -f`           |
| Log riêng cho Web                | `docker-compose logs -f web`       |
| Log riêng cho RabbitMQ           | `docker-compose logs -f rabbitmq`  |

---

## 7. Cấu Trúc Cơ Sở Dữ Liệu (Supabase Schema)

Schema `public` bao gồm các bảng sau (tất cả đều bật RLS - Row Level Security):

### 7.1 Người dùng & Quan hệ

#### `profiles`
Thông tin hồ sơ người dùng (liên kết với `auth.users`).

| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | FK → `auth.users.id` |
| `display_name` | text | `''` | Unique |
| `username` | text | — | Unique |
| `email` | text | — | Unique |
| `avatar_url` | text | — | URL ảnh đại diện |
| `background_url` | text | — | Ảnh bìa |
| `description` | text | — | Mô tả bản thân |
| `slug` | text | — | Slug URL |
| `phone_number` | text | `''` | |
| `birth_date` | date | — | |
| `global_role` | enum | — | `admin`, `student`, `lecturer`, `moderator`, `banned` |
| `friend_count` | int | `0` | |
| `settings` | jsonb | — | Cài đặt cá nhân |
| `create_at` | timestamp | `now()` | |
| `updated_at` | timestamp | `now()` | |

#### `friendships`
Quan hệ bạn bè giữa 2 người dùng.

| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `requester_id` | uuid | — | FK → `profiles.id` |
| `addressee_id` | uuid | — | FK → `profiles.id` |
| `status` | enum | `pending` | `pending`, `friends`, `blocked`, `following` |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

---

### 7.2 Bài viết & Tương tác

#### `posts`
Bài viết của người dùng.

| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `author_id` | uuid | — | FK → `profiles.id` |
| `content` | text | — | Nội dung bài viết |
| `media_urls` | text[] | — | Danh sách URL media |
| `privacy_level` | enum | `public` | `public`, `friends`, `private` |
| `like_count` | int | `0` | |
| `comment_count` | int | `0` | |
| `share_count` | int | `0` | |
| `moderation_status` | enum | — | `approved`, `rejected`, `flagged`, `pending` |
| `is_flagged` | bool | `false` | |
| `flag_reason` | text | — | |
| `moderation_reason` | text | — | |
| `is_deleted` | bool | `false` | |
| `deleted_at` | timestamptz | — | |
| `deleted_by` | uuid | — | FK → `profiles.id` |
| `group_id` | uuid | — | FK → `groups.id` |
| `is_anonymous` | bool | `false` | Ẩn danh tác giả |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | — | |

#### `post_comments`
Bình luận (hỗ trợ reply lồng nhau qua `parent_id`).

| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `post_id` | uuid | — | FK → `posts.id` |
| `user_id` | uuid | — | FK → `profiles.id` |
| `parent_id` | uuid | — | FK → `post_comments.id` (NULL = top-level) |
| `content` | text | — | `length(trim(content)) > 0` |
| `like_count` | int | `0` | |
| `reply_count` | int | `0` | |
| `is_edited` | bool | `false` | |
| `is_deleted` | bool | `false` | |
| `is_anonymous` | bool | `false` | |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | — | |

#### `post_likes`
| Cột | Kiểu | Ghi chú |
|:----|:------|:--------|
| `id` | uuid (PK) | |
| `post_id` | uuid | FK → `posts.id` |
| `user_id` | uuid | FK → `auth.users.id` |
| `created_at` | timestamptz | `now()` |

#### `comment_likes`
| Cột | Kiểu | Ghi chú |
|:----|:------|:--------|
| `id` | uuid (PK) | |
| `comment_id` | uuid | FK → `post_comments.id` |
| `user_id` | uuid | FK → `auth.users.id` |
| `created_at` | timestamptz | `now()` |

#### `post_shares`
| Cột | Kiểu | Ghi chú |
|:----|:------|:--------|
| `id` | uuid (PK) | |
| `post_id` | uuid | FK → `posts.id` |
| `user_id` | uuid | FK → `auth.users.id` |
| `caption` | text | Nội dung chia sẻ kèm theo |
| `created_at` | timestamptz | `now()` |

#### `hashtags` & `post_hashtags`
Quản lý hashtag và liên kết many-to-many với bài viết.

| Bảng `hashtags` | Kiểu | Ghi chú |
|:------|:------|:--------|
| `id` | uuid (PK) | |
| `name` | varchar | Unique |
| `post_count` | int | `0` |
| `created_at` | timestamp | `now()` |

| Bảng `post_hashtags` | Kiểu | Ghi chú |
|:------|:------|:--------|
| `id` | uuid (PK) | |
| `post_id` | uuid | FK → `posts.id` |
| `hashtag_id` | uuid | FK → `hashtags.id` |

---

### 7.3 Nhóm (Groups)

#### `groups`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `name` | text | — | |
| `slug` | text | — | Unique |
| `description` | text | — | |
| `avatar_url` | text | — | |
| `cover_url` | text | — | |
| `privacy_level` | text | `public` | `public`, `private` |
| `membership_mode` | text | `auto` | `auto`, `request` |
| `allow_anonymous_posts` | bool | `false` | |
| `allow_anonymous_comments` | bool | `false` | |
| `created_by` | uuid | — | FK → `profiles.id` |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

#### `group_members`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `group_id` | uuid (PK) | — | FK → `groups.id` |
| `user_id` | uuid (PK) | — | FK → `profiles.id` |
| `role` | enum | `member` | `admin`, `sub_admin`, `moderator`, `member` |
| `status` | enum | `pending` | `active`, `banned`, `pending` |
| `joined_at` | timestamptz | `now()` | |

---

### 7.4 Nhắn tin (Messaging)

#### `conversations`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `type` | enum | `direct` | `direct`, `group` |
| `name` | text | — | Tên nhóm chat |
| `avatar_url` | text | — | |
| `created_by` | uuid | — | FK → `profiles.id` |
| `last_message_at` | timestamptz | `now()` | |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

#### `conversation_members`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `conversation_id` | uuid | — | FK → `conversations.id` |
| `user_id` | uuid | — | FK → `profiles.id` |
| `role` | text | `member` | |
| `is_muted` | bool | `false` | |
| `last_read_at` | timestamptz | — | |
| `joined_at` | timestamptz | `now()` | |

#### `messages`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `conversation_id` | uuid | — | FK → `conversations.id` |
| `sender_id` | uuid | — | FK → `profiles.id` |
| `content` | text | — | |
| `message_type` | enum | `text` | `text`, `image`, `file`, `system` |
| `media_urls` | text[] | — | |
| `reply_to_id` | uuid | — | FK → `messages.id` |
| `is_edited` | bool | `false` | |
| `is_deleted` | bool | `false` | |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | — | |

---

### 7.5 Thông báo & Hệ thống

#### `notifications`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `recipient_id` | uuid | — | FK → `profiles.id` |
| `sender_id` | uuid | — | FK → `profiles.id` |
| `type` | enum | — | `follow`, `friend`, `like`, `comment`, `share`, `mention`, `post_reply`, `system`, `group`, `post` |
| `entity_type` | text | — | |
| `entity_id` | uuid | — | |
| `title` | text | — | |
| `message` | text | — | |
| `metadata` | jsonb | `{}` | |
| `is_read` | bool | `false` | |
| `read_at` | timestamptz | — | |
| `created_at` | timestamptz | `now()` | |

#### `system_announcements`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `title` | text | — | |
| `message` | text | — | |
| `type` | text | `info` | `info`, `warning`, `success`, `error` |
| `start_time` | timestamptz | — | |
| `end_time` | timestamptz | — | |
| `is_active` | bool | `true` | |
| `created_by` | uuid | — | FK → `profiles.id` |
| `created_at` | timestamptz | `now()` | |

---

### 7.6 Kiểm duyệt & Báo cáo (Moderation)

#### `reports`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `reporter_id` | uuid | — | FK → `profiles.id` |
| `reported_type` | text | — | `post`, `comment`, `user`, `message` |
| `reported_id` | uuid | — | |
| `reason` | text | — | |
| `description` | text | — | |
| `status` | enum | — | `pending`, `reviewed`, `resolved`, `dismissed` |
| `reviewed_by` | uuid | — | FK → `profiles.id` |
| `reviewed_at` | timestamptz | — | |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

#### `post_appeals`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `post_id` | uuid | — | FK → `posts.id` |
| `user_id` | uuid | — | FK → `profiles.id` |
| `reason` | text | — | |
| `status` | text | `pending` | `pending`, `reviewed`, `resolved` |
| `created_at` | timestamptz | `now()` | |

#### `blocked_keywords`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `gen_random_uuid()` | |
| `keyword` | text | — | |
| `match_type` | enum | `partial` | `exact`, `partial` |
| `scope` | text | `global` | `global`, `group` |
| `group_id` | uuid | — | FK → `groups.id` |
| `created_by` | uuid | — | FK → `profiles.id` |
| `created_at` | timestamptz | `now()` | |

#### `moderation_actions`
| Cột | Kiểu | Ghi chú |
|:----|:------|:--------|
| `id` | uuid (PK) | |
| `target_type` | text | |
| `target_id` | uuid | |
| `action_type` | enum | `ai_flagged`, `keyword_blocked`, `admin_deleted`, `user_recalled`, `admin_flagged` |
| `reason` | text | |
| `matched_keyword` | text | |
| `ai_score` | float | |
| `created_by` | uuid | FK → `auth.users.id` |
| `created_at` | timestamptz | `now()` |

#### `ai_analysis_logs`
| Cột | Kiểu | Ghi chú |
|:----|:------|:--------|
| `id` | uuid (PK) | |
| `target_type` | text | `post`, `comment`, `review`, `message` |
| `target_id` | uuid | |
| `model_name` | text | Tên model AI đã dùng |
| `analysis_type` | text | |
| `label` | text | Nhãn phân loại |
| `score` | float | |
| `confidence` | float | |
| `metadata` | jsonb | `{}` |
| `created_at` | timestamptz | `now()` |

---

### 7.7 Hàng đợi xử lý (Queue)

#### `post_queue_status`
| Cột | Kiểu | Mặc định | Ghi chú |
|:----|:------|:---------|:--------|
| `id` | uuid (PK) | `uuid_generate_v4()` | |
| `user_id` | uuid | — | FK → `profiles.id` |
| `post_id` | uuid | — | FK → `posts.id` |
| `status` | enum | — | `pending`, `processing`, `completed`, `failed` |
| `content` | text | — | |
| `privacy_level` | enum | — | `public`, `friends`, `private` |
| `media_count` | int | `0` | |
| `error_message` | text | — | |
| `retry_count` | int | `0` | |
| `operation_type` | enum | — | `SELECT`, `CREATE`, `UPDATE`, `DELETE` |
| `group_id` | uuid | — | FK → `groups.id` |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

---

## 8. Cấu Trúc Thư Mục

```text
the-last/
├── apps/
│   ├── web/           # Ứng dụng Frontend chính (Next.js)
│   ├── admin/         # Ứng dụng Quản trị (Next.js)
│   └── workers/       # Background Worker (RabbitMQ, HF_TOKEN...)
├── packages/          # Thư viện dùng chung
│   ├── eslint-config/ # Cấu hình ESLint chung
│   ├── rabbitmq/      # Client RabbitMQ
│   ├── redis/         # Client Redis
│   ├── shared/        # Types, Interface dùng chung
│   ├── supabase/      # Supabase Client/Server
│   ├── typescript-config/
│   ├── ui/            # UI Component Library (Tailwind, Radix UI)
│   └── utils/         # Utility helpers
├── supabase/          # Migrations, Seed, Edge Functions
├── infra/             # Dockerfiles cho Redis, RabbitMQ
├── docker-compose.yml
└── turbo.json
```
