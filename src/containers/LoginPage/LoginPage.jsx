import "./LoginPage.css";
import { LoginForm } from "../../components";

export default function ({ newUser }) {
  return (
    <section className="login-page">
      <h2>Welcome Back!</h2>
      <LoginForm />
    </section>
  );
}
