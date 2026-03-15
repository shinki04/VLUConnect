Tổng số thông báo (toast) tìm thấy: **162**

### `apps/admin/components/appeals/AppealsDataTable.tsx`
- **Loại:** `error` | **Dòng:** 90
  ```typescript
  toast.error("Không thể tải danh sách khiếu nại")
  ```
- **Loại:** `success` | **Dòng:** 120
  ```typescript
  toast.success(
          action === "approve_post"
            ? "Đã khôi phục bài viết"
            : "Đã từ chối khiếu nại",
        )
  ```
- **Loại:** `error` | **Dòng:** 127
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```

### `apps/admin/components/groups/GroupsDataTable.tsx`
- **Loại:** `error` | **Dòng:** 81
  ```typescript
  toast.error("Lỗi khi tải danh sách nhóm")
  ```
- **Loại:** `error` | **Dòng:** 105
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 107
  ```typescript
  toast.success("Xóa nhóm thành công")
  ```
- **Loại:** `error` | **Dòng:** 113
  ```typescript
  toast.error("Đã xảy ra lỗi khi xóa nhóm")
  ```

### `apps/admin/components/moderation/KeywordsManager.tsx`
- **Loại:** `error` | **Dòng:** 64
  ```typescript
  toast.error("Vui lòng nhập từ khóa")
  ```
- **Loại:** `error` | **Dòng:** 72
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 74
  ```typescript
  toast.success("Đã thêm từ khóa")
  ```
- **Loại:** `error` | **Dòng:** 92
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```
- **Loại:** `error` | **Dòng:** 105
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 107
  ```typescript
  toast.success("Đã xóa từ khóa")
  ```
- **Loại:** `error` | **Dòng:** 122
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```

### `apps/admin/hooks/useToastFromCookies.ts`
- **Loại:** `error` | **Dòng:** 12
  ```typescript
  toast.error(errorMessage)
  ```
- **Loại:** `success` | **Dòng:** 16
  ```typescript
  toast.success(successMessage)
  ```

### `apps/web/app/(main)/groups/page.tsx`
- **Loại:** `error` | **Dòng:** 39
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 41
  ```typescript
  toast.success(
            result.status === "active"
              ? "Đã tham gia nhóm thành công"
              : "Đã gửi yêu cầu tham gia nhóm",
          )
  ```
- **Loại:** `error` | **Dòng:** 51
  ```typescript
  toast.error("Đã xảy ra lỗi khi tham gia nhóm")
  ```

### `apps/web/app/messages/MessagesClient.tsx`
- **Loại:** `success` | **Dòng:** 132
  ```typescript
  toast.success("Đã tạo cuộc trò chuyện mới")
  ```
- **Loại:** `error` | **Dòng:** 134
  ```typescript
  toast.error("Không thể tạo cuộc trò chuyện")
  ```
- **Loại:** `success` | **Dòng:** 148
  ```typescript
  toast.success("Đã tạo nhóm mới")
  ```
- **Loại:** `error` | **Dòng:** 152
  ```typescript
  toast.error(errorMessage)
  ```
- **Loại:** `success` | **Dòng:** 169
  ```typescript
  toast.success("Đã rời khỏi nhóm")
  ```
- **Loại:** `error` | **Dòng:** 171
  ```typescript
  toast.error("Không thể rời nhóm")
  ```

### `apps/web/components/dashboard/ContactList.tsx`
- **Loại:** `error` | **Dòng:** 34
  ```typescript
  toast.error("Không thể mở cuộc trò chuyện")
  ```

### `apps/web/components/friends/UserList.tsx`
- **Loại:** `error` | **Dòng:** 45
  ```typescript
  toast.error("Không thể mở cuộc trò chuyện")
  ```
- **Loại:** `success` | **Dòng:** 60
  ```typescript
  toast.success(successMsg)
  ```
- **Loại:** `error` | **Dòng:** 64
  ```typescript
  toast.error("Đã xảy ra lỗi")
  ```

### `apps/web/components/friendship/FriendButton.tsx`
- **Loại:** `success` | **Dòng:** 116
  ```typescript
  toast.success("Đã gửi lời mời kết bạn")
  ```
- **Loại:** `success` | **Dòng:** 123
  ```typescript
  toast.success("Đã hủy lời mời kết bạn")
  ```
- **Loại:** `success` | **Dòng:** 130
  ```typescript
  toast.success("Đã chấp nhận lời mời kết bạn")
  ```
- **Loại:** `info` | **Dòng:** 137
  ```typescript
  toast.info("Đã từ chối lời mời kết bạn")
  ```
- **Loại:** `success` | **Dòng:** 143
  ```typescript
  toast.success("Đã hủy kết bạn")
  ```

### `apps/web/components/friendship/FriendRequestList.tsx`
- **Loại:** `success` | **Dòng:** 98
  ```typescript
  toast.success("Đã chấp nhận lời mời")
  ```
- **Loại:** `info` | **Dòng:** 113
  ```typescript
  toast.info("Đã từ chối lời mời")
  ```

### `apps/web/components/groups/blocked-keywords-form.tsx`
- **Loại:** `error` | **Dòng:** 72
  ```typescript
  toast.error("Vui lòng nhập từ khóa")
  ```
- **Loại:** `error` | **Dòng:** 80
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 82
  ```typescript
  toast.success("Đã thêm từ khóa")
  ```
- **Loại:** `error` | **Dòng:** 88
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```
- **Loại:** `error` | **Dòng:** 101
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 103
  ```typescript
  toast.success("Đã xóa từ khóa")
  ```
- **Loại:** `error` | **Dòng:** 112
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```

### `apps/web/components/groups/create-group-dialog.tsx`
- **Loại:** `error` | **Dòng:** 58
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `error` | **Dòng:** 60
  ```typescript
  toast.error("Please check the form for errors")
  ```
- **Loại:** `success` | **Dòng:** 63
  ```typescript
  toast.success("Group created successfully!")
  ```
- **Loại:** `error` | **Dòng:** 72
  ```typescript
  toast.error(`Something went wrong: ${message}`)
  ```

### `apps/web/components/groups/group-header.tsx`
- **Loại:** `error` | **Dòng:** 40
  ```typescript
  toast.error(res.error)
  ```
- **Loại:** `success` | **Dòng:** 42
  ```typescript
  toast.success("Yêu cầu đã được gửi!")
  ```
- **Loại:** `success` | **Dòng:** 44
  ```typescript
  toast.success("Đã tham gia group!")
  ```
- **Loại:** `error` | **Dòng:** 48
  ```typescript
  toast.error("Không thể tham gia group")
  ```
- **Loại:** `error` | **Dòng:** 56
  ```typescript
  toast.error("Admin không thể rời group. Hãy chuyển quyền admin trước.")
  ```
- **Loại:** `error` | **Dòng:** 64
  ```typescript
  toast.error(res.error)
  ```
- **Loại:** `success` | **Dòng:** 66
  ```typescript
  toast.success("Đã rời khỏi group")
  ```
- **Loại:** `error` | **Dòng:** 70
  ```typescript
  toast.error("Không thể rời group")
  ```

### `apps/web/components/groups/group-settings-form.tsx`
- **Loại:** `error` | **Dòng:** 99
  ```typescript
  toast.error(validationError)
  ```
- **Loại:** `error` | **Dòng:** 117
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 120
  ```typescript
  toast.success("Đã cập nhật ảnh đại diện")
  ```
- **Loại:** `error` | **Dòng:** 123
  ```typescript
  toast.error("Không thể upload ảnh")
  ```
- **Loại:** `error` | **Dòng:** 127
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```
- **Loại:** `error` | **Dòng:** 140
  ```typescript
  toast.error(validationError)
  ```
- **Loại:** `error` | **Dòng:** 158
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 161
  ```typescript
  toast.success("Đã cập nhật ảnh bìa")
  ```
- **Loại:** `error` | **Dòng:** 164
  ```typescript
  toast.error("Không thể upload ảnh")
  ```
- **Loại:** `error` | **Dòng:** 168
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```
- **Loại:** `error` | **Dòng:** 190
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 192
  ```typescript
  toast.success("Đã cập nhật group")
  ```
- **Loại:** `error` | **Dòng:** 196
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```
- **Loại:** `error` | **Dòng:** 207
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `error` | **Dòng:** 216
  ```typescript
  toast.error(message)
  ```

### `apps/web/components/messaging/ChatRightSidebar.tsx`
- **Loại:** `success` | **Dòng:** 132
  ```typescript
  toast.success("Đã xóa thành viên khỏi nhóm")
  ```
- **Loại:** `error` | **Dòng:** 135
  ```typescript
  toast.error(error instanceof Error ? error.message : "Không thể xóa thành viên")
  ```
- **Loại:** `success` | **Dòng:** 148
  ```typescript
  toast.success("Đã chuyển quyền quản trị")
  ```
- **Loại:** `error` | **Dòng:** 151
  ```typescript
  toast.error(error instanceof Error ? error.message : "Không thể chuyển quyền")
  ```
- **Loại:** `success` | **Dòng:** 164
  ```typescript
  toast.success("Đã cập nhật vai trò thành viên")
  ```
- **Loại:** `error` | **Dòng:** 167
  ```typescript
  toast.error(error instanceof Error ? error.message : "Không thể cập nhật vai trò")
  ```

### `apps/web/components/messaging/GroupSettingsSheet.tsx`
- **Loại:** `success` | **Dòng:** 141
  ```typescript
  toast.success("Đã xóa thành viên khỏi nhóm")
  ```
- **Loại:** `error` | **Dòng:** 144
  ```typescript
  toast.error(error instanceof Error ? error.message : "Không thể xóa thành viên")
  ```
- **Loại:** `success` | **Dòng:** 157
  ```typescript
  toast.success("Đã chuyển quyền quản trị")
  ```
- **Loại:** `error` | **Dòng:** 160
  ```typescript
  toast.error(error instanceof Error ? error.message : "Không thể chuyển quyền")
  ```
- **Loại:** `success` | **Dòng:** 173
  ```typescript
  toast.success("Đã cập nhật vai trò thành viên")
  ```
- **Loại:** `error` | **Dòng:** 176
  ```typescript
  toast.error(error instanceof Error ? error.message : "Không thể cập nhật vai trò")
  ```

### `apps/web/components/messaging/MessageBubble.tsx`
- **Loại:** `success` | **Dòng:** 119
  ```typescript
  toast.success("Đã chỉnh sửa tin nhắn")
  ```
- **Loại:** `error` | **Dòng:** 122
  ```typescript
  toast.error(error instanceof Error ? error.message : "Lỗi khi chỉnh sửa")
  ```
- **Loại:** `success` | **Dòng:** 133
  ```typescript
  toast.success("Đã thu hồi tin nhắn")
  ```
- **Loại:** `error` | **Dòng:** 136
  ```typescript
  toast.error(error instanceof Error ? error.message : "Lỗi khi thu hồi")
  ```

### `apps/web/components/posts/AddPost.tsx`
- **Loại:** `error` | **Dòng:** 64
  ```typescript
  toast.error("Vui lòng đăng nhập để đăng bài")
  ```
- **Loại:** `error` | **Dòng:** 73
  ```typescript
  toast.error(`Dữ liệu không hợp lệ: ${errors}`)
  ```
- **Loại:** `error` | **Dòng:** 88
  ```typescript
  toast.error("Có lỗi xảy ra")
  ```
- **Loại:** `loading` | **Dòng:** 97
  ```typescript
  toast.loading("Đang upload media...", { id: "upload" })
  ```
- **Loại:** `dismiss` | **Dòng:** 101
  ```typescript
  toast.dismiss("upload")
  ```
- **Loại:** `error` | **Dòng:** 106
  ```typescript
  toast.error("Một số file upload thất bại", { id: "upload" })
  ```
- **Loại:** `success` | **Dòng:** 137
  ```typescript
  toast.success("Bài đăng đã vào danh sách chờ")
  ```
- **Loại:** `error` | **Dòng:** 148
  ```typescript
  toast.error(
            error instanceof Error ? error.message : "Có lỗi xảy ra khi đăng bài",
          )
  ```

### `apps/web/components/posts/EditPost.tsx`
- **Loại:** `loading` | **Dòng:** 65
  ```typescript
  toast.loading("Đang cập nhật bài viết...", { id: "update-post" })
  ```
- **Loại:** `error` | **Dòng:** 104
  ```typescript
  toast.error("Một số file upload thất bại", { id: "update-post" })
  ```
- **Loại:** `success` | **Dòng:** 164
  ```typescript
  toast.success("Cập nhật bài viết thành công", { id: "update-post" })
  ```
- **Loại:** `error` | **Dòng:** 173
  ```typescript
  toast.error(
            error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật",
            { id: "update-post" }
          )
  ```
- **Loại:** `error` | **Dòng:** 197
  ```typescript
  toast.error("Không thể tải một số file")
  ```

### `apps/web/components/posts/PostCard.tsx`
- **Loại:** `success` | **Dòng:** 92
  ```typescript
  toast.success("Xóa thành công", { id: post.id })
  ```
- **Loại:** `error` | **Dòng:** 96
  ```typescript
  toast.error("Có lỗi", { id: post.id })
  ```

### `apps/web/components/profile/Profile.tsx`
- **Loại:** `error` | **Dòng:** 89
  ```typescript
  toast.error(`Dữ liệu không hợp lệ: ${errors}`)
  ```
- **Loại:** `success` | **Dòng:** 109
  ```typescript
  toast.success("Cập nhật hồ sơ thành công!")
  ```
- **Loại:** `error` | **Dòng:** 113
  ```typescript
  toast.error("Có lỗi xảy ra khi cập nhật hồ sơ")
  ```

### `apps/web/components/reports/ReportDialog.tsx`
- **Loại:** `error` | **Dòng:** 69
  ```typescript
  toast.error("Vui lòng chọn lý do báo cáo")
  ```
- **Loại:** `success` | **Dòng:** 96
  ```typescript
  toast.success("Báo cáo đã được gửi thành công")
  ```
- **Loại:** `error` | **Dòng:** 102
  ```typescript
  toast.error(
          error instanceof Error ? error.message : "Có lỗi xảy ra khi gửi báo cáo"
        )
  ```

### `apps/web/components/setting/PostManagementList.tsx`
- **Loại:** `error` | **Dòng:** 167
  ```typescript
  toast.error("Không thể tải bài viết", {
          description: "Vui lòng thử lại sau",
        })
  ```
- **Loại:** `success` | **Dòng:** 249
  ```typescript
  toast.success(
          "Kháng cáo đã được gửi thành công. Vui lòng chờ quản trị viên xử lý.",
        )
  ```
- **Loại:** `error` | **Dòng:** 256
  ```typescript
  toast.error(
          error instanceof Error ? error.message : "Lỗi khi gửi kháng cáo",
        )
  ```

### `apps/web/components/setting/ProfileForm.tsx`
- **Loại:** `success` | **Dòng:** 72
  ```typescript
  toast.success("Cập nhật thông tin thành công!")
  ```
- **Loại:** `error` | **Dòng:** 77
  ```typescript
  toast.error(error.message || "Lỗi cập nhật. Vui lòng thử lại.")
  ```

### `apps/web/components/setting/VerificationForm.tsx`
- **Loại:** `success` | **Dòng:** 32
  ```typescript
  toast.success(
          "Xác thực thành công! Vui lòng làm mới trang hoặc đăng nhập lại để cập nhật quyền hạn.",
        )
  ```
- **Loại:** `error` | **Dòng:** 38
  ```typescript
  toast.error(error.message || "Đã có lỗi xảy ra")
  ```

### `apps/web/components/ToastHandler.tsx`
- **Loại:** `error` | **Dòng:** 29
  ```typescript
  toast.error(error === "login" ? "Đăng nhập thất bại" : error)
  ```
- **Loại:** `success` | **Dòng:** 33
  ```typescript
  toast.success(
    //       success === "login" ? "Đăng nhập thành công! Chào mừng bạn!" : success
    //     )
  ```

### `apps/web/hooks/useGroup.ts`
- **Loại:** `error` | **Dòng:** 177
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 179
  ```typescript
  toast.success("Đã cập nhật role")
  ```
- **Loại:** `error` | **Dòng:** 183
  ```typescript
  toast.error("Lỗi khi cập nhật role")
  ```
- **Loại:** `error` | **Dòng:** 190
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 192
  ```typescript
  toast.success("Đã xóa thành viên")
  ```
- **Loại:** `error` | **Dòng:** 196
  ```typescript
  toast.error("Lỗi khi xóa thành viên")
  ```
- **Loại:** `error` | **Dòng:** 203
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 205
  ```typescript
  toast.success("Đã duyệt thành viên")
  ```
- **Loại:** `error` | **Dòng:** 209
  ```typescript
  toast.error("Lỗi khi duyệt thành viên")
  ```
- **Loại:** `error` | **Dòng:** 216
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 218
  ```typescript
  toast.success("Đã từ chối thành viên")
  ```
- **Loại:** `error` | **Dòng:** 222
  ```typescript
  toast.error("Lỗi khi từ chối thành viên")
  ```
- **Loại:** `error` | **Dòng:** 229
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 231
  ```typescript
  toast.success("Đã chuyển quyền admin")
  ```
- **Loại:** `error` | **Dòng:** 235
  ```typescript
  toast.error("Lỗi khi chuyển quyền admin")
  ```
- **Loại:** `error` | **Dòng:** 242
  ```typescript
  toast.error(result.error)
  ```
- **Loại:** `success` | **Dòng:** 244
  ```typescript
  toast.success(`Đã duyệt ${result.approvedCount} thành viên`)
  ```
- **Loại:** `error` | **Dòng:** 248
  ```typescript
  toast.error("Lỗi khi duyệt tất cả thành viên")
  ```

### `apps/web/hooks/useMessageUppy.ts`
- **Loại:** `error` | **Dòng:** 180
  ```typescript
  toast.error(`File "${file?.name}" vượt quá ${sizeLimit}MB!`)
  ```
- **Loại:** `error` | **Dòng:** 182
  ```typescript
  toast.error(error?.message || `File "${file?.name}" không hợp lệ`)
  ```

### `apps/web/hooks/usePost.ts`
- **Loại:** `error` | **Dòng:** 68
  ```typescript
  toast.error(error.message || "Có lỗi xảy ra khi đăng bài")
  ```
- **Loại:** `error` | **Dòng:** 163
  ```typescript
  toast.error(error.message || "Có lỗi xảy ra khi đăng bài")
  ```
- **Loại:** `error` | **Dòng:** 187
  ```typescript
  toast.error(error.message || "Có lỗi xảy ra khi đăng bài")
  ```
- **Loại:** `success` | **Dòng:** 248
  ```typescript
  toast.success("Cập nhật bài viết thành công")
  ```
- **Loại:** `error` | **Dòng:** 252
  ```typescript
  toast.error(error.message || "Có lỗi xảy ra khi cập nhật bài viết")
  ```

### `apps/web/hooks/usePostInteractions.ts`
- **Loại:** `error` | **Dòng:** 68
  ```typescript
  toast.error("Lỗi cập nhật lượt thích.")
  ```
- **Loại:** `success` | **Dòng:** 117
  ```typescript
  toast.success("Đã chia sẻ bài viết!")
  ```
- **Loại:** `error` | **Dòng:** 121
  ```typescript
  toast.error("Chia sẻ thất bại.")
  ```
- **Loại:** `error` | **Dòng:** 206
  ```typescript
  toast.error("Lỗi cập nhật lượt thích.")
  ```
- **Loại:** `error` | **Dòng:** 307
  ```typescript
  toast.error("Không thể gửi bình luận. Thử lại?")
  ```
- **Loại:** `error` | **Dòng:** 320
  ```typescript
  toast.error("Xóa bình luận thất bại.")
  ```
- **Loại:** `success` | **Dòng:** 333
  ```typescript
  toast.success("Đã cập nhật bình luận")
  ```
- **Loại:** `error` | **Dòng:** 336
  ```typescript
  toast.error("Cập nhật thất bại.")
  ```

### `apps/web/hooks/usePostQueueStatus.ts`
- **Loại:** `loading` | **Dòng:** 64
  ```typescript
  toast.loading(
                    `Đang tải lên bài viết${
                      newItem.media_count! > 0
                        ? ` với ${newItem.media_count} file`
                        : ""
             ...
  ```
- **Loại:** `loading` | **Dòng:** 89
  ```typescript
  toast.loading("Đang xử lý bài viết...", {
                      id: existingToastId, // Sử dụng cùng ID
                    })
  ```
- **Loại:** `loading` | **Dòng:** 95
  ```typescript
  toast.loading("Đang xử lý bài viết...")
  ```
- **Loại:** `success` | **Dòng:** 102
  ```typescript
  toast.success("Bài viết đã đăng thành công!", {
                      id: existingToastId, // Sử dụng cùng ID
                    })
  ```
- **Loại:** `success` | **Dòng:** 111
  ```typescript
  toast.success("Bài viết đã đăng thành công!")
  ```
- **Loại:** `error` | **Dòng:** 133
  ```typescript
  toast.error(updatedItem.error_message || "Lỗi khi đăng bài", {
                      id: existingToastId, // Sử dụng cùng ID
                      description: `Đã thử ${updatedItem.retry_count} lần`,
     ...
  ```
- **Loại:** `error` | **Dòng:** 149
  ```typescript
  toast.error(updatedItem.error_message || "Lỗi khi đăng bài", {
                      description: `Đã thử ${updatedItem.retry_count} lần`,
                      action: {
                        label: "Đón...
  ```
- **Loại:** `dismiss` | **Dòng:** 178
  ```typescript
  toast.dismiss(existingToastId)
  ```
- **Loại:** `dismiss` | **Dòng:** 196
  ```typescript
  toast.dismiss(toastId)
  ```

### `apps/web/hooks/useToastFromCookies.ts`
- **Loại:** `error` | **Dòng:** 12
  ```typescript
  toast.error(errorMessage)
  ```
- **Loại:** `success` | **Dòng:** 16
  ```typescript
  toast.success(successMessage)
  ```

### `apps/web/hooks/useUppy.ts`
- **Loại:** `error` | **Dòng:** 97
  ```typescript
  toast.error(`File "${file!.name}" vượt quá 10MB!`)
  ```
- **Loại:** `error` | **Dòng:** 99
  ```typescript
  toast.error(error?.message || `File "${file!.name}" không hợp lệ`)
  ```

