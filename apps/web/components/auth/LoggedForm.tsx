import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function LoggedForm() {
  return (
    <div className="relative w-full max-w-md px-4 sm:px-0 mx-auto">
      <Card className="relative bg-[rgba(181,41,52,0.55)] rounded-xl shadow-[0_6px_40px_rgba(0,0,0,0.25)] border border-white/10 backdrop-blur-lg overflow-hidden">
        <CardContent className="relative z-10 flex flex-col items-center p-6 sm:p-10 gap-4">
          <Image
            src="/logo_white.png"
            alt="VLU Logo"
            width={150}
            height={150}
            className="mb-3 sm:mb-5"
          />

          <div className="w-full flex flex-col gap-4 text-center">
            <label className="text-white font-semibold text-lg">
              Bạn đã đăng nhập
            </label>
            <Link href="/dashboard">
              <Button>Quay lại Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoggedForm;
