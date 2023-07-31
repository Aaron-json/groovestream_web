import { NavLink, useNavigate } from "react-router-dom";
// import { useContext } from "react";
import "./RegistrationForm.css";
// import { authenticationContext } from "../../contexts/AuthenticationContext";
import axiosClient from "../../api/axiosClient";

const RegistrationForm = () => {
  // const { refreshAuthentication } = useContext(authenticationContext)
  const navigator = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault();
    // get values from input fields
    const firstName = document.getElementById('register-firstname-input').value
    const lastName = document.getElementById('register-lastname-input').value
    const email = document.getElementById('register-username-input').value
    const password = document.getElementById('register-password-input').value
    const confirmPassword = document.getElementById('register-confirm-password-input').value
    const dateString = document.getElementById('register-date-of-birth').value

    if (confirmPassword !== password) {
      console.log("Passwords don't match mate")
      return;
    }
    const dateObj = new Date(dateString)
    const dateOfBirth = dateObj.getTime()
    const body = { firstName, lastName, email, password, dateOfBirth }
    try {
      const response = await axiosClient.post('/user', body)
      console.log(response)
      if (response.status >= 200 && response.status <= 299) {
        navigator('/login')
      }


    } catch (error) {
      console.log(error)
    }

  }
  return (
    <form className='register-form' onSubmit={handleSubmit} >
      <h3 className='register-form-header'>Sign up</h3>
      <label className="register-firname-label" htmlFor="register-firstname-input">First Name</label>
      <input id="register-firstname-input" type="text" placeholder='first name' />

      <label className="register-lastname-label" htmlFor="register-lastname-input">Last Name</label>
      <input id="register-lastname-input" type="text" placeholder='last name' />


      <label className="register-username-label" htmlFor="register-username-input">Username</label>
      <input id="register-username-input" type="email" placeholder='email' />
      <label className='register-password-label' htmlFor="register-password-input">Password</label>
      <input id="register-password-input" type="password" placeholder="password" />
      <label className='register-confirm-password-label' htmlFor="register-confirm-password-input">Confirm Password</label>
      <input id="register-confirm-password-input" type="password" placeholder="password" />
      <label htmlFor="">Date of Birth</label>
      <input id="register-date-of-birth" type="date" />
      <button type="submit" className="login-submit">Submit</button>
      <p>Already have an account? <NavLink className="register-login-toggle" to="/login">Login</NavLink></p>
    </form >
  )
};

export default RegistrationForm;
