import { useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        navigate("/", { replace: true });
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [navigate]);

  return (
    <>
      <PageMeta
        title="SignIn | Connect Care"
        description="Sign in to your Connect Care account"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
