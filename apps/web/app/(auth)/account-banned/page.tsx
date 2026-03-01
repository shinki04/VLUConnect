import { Button } from "@repo/ui/components/button";

import { signOut } from "@/app/auth/action";

export default function AccountBanned() {
  return (
    <div>
      <h1>Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên</h1>
      <Button onClick={signOut}>Đăng xuất</Button>
    </div>
  );
}
