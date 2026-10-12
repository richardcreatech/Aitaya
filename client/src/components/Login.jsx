import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faEnvelope,
  faLock,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import API_URL from "../api/my_api_url";
import logo from "../assets/logo-mini.png"

function Login() {
  async function handleSubmit(e) {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      console.log(data);

      // Login successful
      location.href = "/en";
    } catch (error) {
      console.error("Login error:", error);

      alert("Unable to connect to the server.");
    }
  }

  return (
    <section className="auth_form">
      <div className="auth_intro">
        <img src={logo} width="130"  style={{}} alt="Welcome" />
        <h1>Welcome back.</h1>
        <p>Log in and get back to your little corner of the internet.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input_group">
          <label htmlFor="email">Email</label>

          <div className="input_box">
            <FontAwesomeIcon icon={faEnvelope} />

            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="input_group">
          <label htmlFor="password">Password</label>

          <div className="input_box">
            <FontAwesomeIcon icon={faLock} />

            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        <div className="auth_options">
          <label className="remember_me">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            className="forgot_password"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" className="auth_btn">
          Log in
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </form>

      <p className="auth_switch">
        Don't have an account?
        <Link to="/auth/signup"> Sign up</Link>
      </p>
    </section>
  );
}

export default Login;