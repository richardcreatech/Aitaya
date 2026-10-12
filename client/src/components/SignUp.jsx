import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faUser,
  faEnvelope,
  faLock,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import API_URL from "../api/my_api_url";
import logo from "../assets/logo-mini.png"


function SignUp() {
  async function handleSubmit(e) {
    e.preventDefault();

    const name = e.target.name.value;
    const email = e.target.signup_email.value;
    const password = e.target.signup_password.value;

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
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

      // Signup successful
      location.href = "/auth/login";
    } catch (error) {
      console.error("Signup error:", error);

      alert("Unable to connect to the server.");
    }
  }

  return (
    <section className="auth_form">
      <div className="auth_intro">
        <img src={logo} width="130" style={{}} alt="Welcome" />

        <h1>Create your account.</h1>
        <p>A little space for you, your people, and your moments.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input_group">
          <label htmlFor="name">Name</label>

          <div className="input_box">
            <FontAwesomeIcon icon={faUser} />

            <input type="text" id="name" placeholder="Your name" required />
          </div>
        </div>

        <div className="input_group">
          <label htmlFor="signup_email">Email</label>

          <div className="input_box">
            <FontAwesomeIcon icon={faEnvelope} />

            <input
              type="email"
              id="signup_email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="input_group">
          <label htmlFor="signup_password">Password</label>

          <div className="input_box">
            <FontAwesomeIcon icon={faLock} />

            <input
              type="password"
              id="signup_password"
              placeholder="Create a password"
              required
            />
          </div>
        </div>

        <button type="submit" className="auth_btn">
          Create account
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </form>

      <p className="auth_switch">
        Already have an account?
        <Link to="/auth/login"> Log in</Link>
      </p>
    </section>
  );
}

export default SignUp;
