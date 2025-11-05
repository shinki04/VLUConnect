import LoginForm from "@/components/auth/LoginForm";
interface LoginPageProps {
  propName: string;
}

const LoginPage: React.FC<LoginPageProps> = () => {
  return <LoginForm />;
};

export default LoginPage;
