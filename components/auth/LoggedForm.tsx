import React from "react";
import styles from "./LoginForm.module.css";
import { Button } from "../ui/button";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";

function LoggedForm() {
  return (
    <div className={styles.loginBox}>
      <div className={`mb-4 flex flex-col items-center`}>
        <img src="/logo_white.png" alt="VLU Logo" className={styles.logo} />
      </div>

      <div className="w-full flex flex-col gap-4">
        <div className="text-center">
          <label className={styles.label + " text-center"}>
            Bạn đã đăng nhập
          </label>
          <Link href={"/dashboard"}>
            <Button>Quay lại Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoggedForm;
