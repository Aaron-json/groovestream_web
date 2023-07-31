import { NavLink } from "react-router-dom";
import "./LoginForm.css";
import { useContext, useState } from "react";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import axiosClient from "../../api/axiosClient";

const LoginForm = () => {
  const { setRefreshToken, accessTokenRef, setAuthenticated } = useContext(
    authenticationContext
  );
  const [sendingRequest, setSendingRequest] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSendingRequest(true);
    const email = document.getElementById("login-username-input").value;
    const password = document.getElementById("login-password-input").value;
    const body = { email, password };
    try {
      const loginResponse = await axiosClient.post("user/login", body);
      console.log(loginResponse);
      const { refreshToken, accessToken } = loginResponse.data;
      // update authentication state
      accessTokenRef.current = accessToken;
      setAuthenticated(true);
      setSendingRequest(false);
    } catch (error) {
      console.log(error);
      setSendingRequest(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h3 className="login-form-header">Login</h3>
      <label className="login-username-label" htmlFor="login-username-input">
        Username
      </label>
      <input id="login-username-input" type="email" placeholder="Email" />
      <label className="login-password-label" htmlFor="login-password-input">
        Password
      </label>
      <input id="login-password-input" type="password" placeholder="Password" />
      <button type="submit" className="login-submit" disabled={sendingRequest}>
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
