import LoggedForm from "@/components/auth/LoggedForm";
import LoginForm from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

import React from "react";

async function LoginPage() {
  // Check user logged in
  const supabase = await createClient();
  // Lấy user hiện tại
  const { data } = await supabase.auth.getUser();

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover"
      style={{ backgroundImage: "url('/view_VLU.jpg')" }}
    >
      <div className="absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        {!data.user ? <LoginForm /> : <LoggedForm />}

        {/* {error && (
          <div className="text-red-600 font-medium mt-2">{error.message}</div>
        )} */}
      </div>
    </div>
  );
}

export default LoginPage;
