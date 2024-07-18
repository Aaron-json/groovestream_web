import { useState } from "react";
import "./AuthPage.css";
import { AppHeader } from "../../components";
import LoginForm from "./login";
import SignUpForm from "./signup";
export type AuthAction = "signup" | "signin";

export default function() {
  const [authAction, setAuthAction] = useState<AuthAction>("signin");
  return (
    <section className="auth-page">
      <AppHeader />
      {
        authAction === "signup" && <SignUpForm setAuthAction={setAuthAction} />
      }
      {
        authAction === "signin" && <LoginForm setAuthAction={setAuthAction} />
      }
    </section>
  );
}
