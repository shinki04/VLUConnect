import LoginForm from "@/components/auth/LoginForm";
interface LoginPageProps {
  propName: string;
}

const LoginPage: React.FC<LoginPageProps> = () => {
 return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover"
      style={{ backgroundImage: "url('/view_VLU.jpg')" }}
    >
      <div className="absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        <LoginForm />
      </div>
    </div>
  );

};

export default LoginPage;
