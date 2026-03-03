import { useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
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
        title="SignUp | Connect Care"
        description="Create your Connect Care account"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
