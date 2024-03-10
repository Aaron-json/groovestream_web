import "./LoginForm.css";
import { NavLink } from "react-router-dom";
import { FormEvent, useContext, useState } from "react";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { AxiosError } from "axios";

const LoginForm = () => {
  const { login } = useContext(authenticationContext)!;
  const [formState, setFormState] = useState<FormState>({ state: "input" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormState({ state: "loading" });
    const username = (
      document.getElementById("login-username-input") as HTMLInputElement
    ).value;
    const password = (
      document.getElementById("login-password-input") as HTMLInputElement
    ).value;
    const credentials = { username, password };
    try {
      await login(credentials);
    } catch (error) {
      if ((error as AxiosError).code === "ERR_NETWORK") {
        setFormState({ state: "error", message: "Network Error" });
      } else {
        setFormState({
          state: "error",
          message: "Could not log in. Please check your login information",
        });
      }
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h3 className="login-form-header">Login</h3>
      <span className="form-err-message">
        {formState.state === "error" ? formState.message : undefined}
      </span>
      <label className="login-username-label">
        Username
        <input
          className="form-input"
          id="login-username-input"
          type="text"
          placeholder="Username"
        />
      </label>
      <label className="login-password-label">
        Password
        <input
          className="form-input"
          id="login-password-input"
          type="password"
          placeholder="Password"
        />
      </label>
      <button
        type="submit"
        className="login-submit form-button"
        disabled={formState.state === "loading"}
      >
        Login
      </button>
      <p>
        Don't have an account?{" "}
        <NavLink className="register-login-toggle" to="/register">
          Register
        </NavLink>
      </p>
    </form>
  );
};

export default LoginForm;
