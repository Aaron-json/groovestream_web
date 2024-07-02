import "./RegistrationForm.css";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  validateDateString,
  validateFirstName,
  validateLastName,
  validatePassword,
  validateUsername,
} from "../../validation/FormInput";
import { userSignUp } from "../../api/requests/user";
import { Axios, AxiosError } from "axios";
import { FieldValues, useForm } from "react-hook-form";
import { ResponseError } from "../../types/errors";

const RegistrationForm = () => {
  const navigator = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  async function submitHandler(formValues: FieldValues) {
    try {
      await userSignUp({
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        username: formValues.username,
        password: formValues.password,
        dateOfBirth: formValues.dateOfBirth,
      });
      navigator("/login");
    } catch (error: any) {
      if (
        ((error as AxiosError).response?.data as ResponseError).errCode ===
        "INV01"
      ) {
        setSubmitError("Username is already in use");
      } else {
        setSubmitError("Error occured. Please try again later");
      }
    }
  }

  return (
    <form className="register-form" onSubmit={handleSubmit(submitHandler)}>
      <h2>Sign up</h2>
      {submitError && <span className="form-err-message">{submitError}</span>}
      <label htmlFor="register-firstname-input">
        First Name
        <br />
        {errors.firstName && (
          <span className="form-err-message">
            {errors.firstName.message?.toString()}
          </span>
        )}
        <input
          id="register-firstName-input"
          className="form-input"
          {...register("firstName", {
            required: true,
            validate: validateFirstName,
          })}
          type="text"
          placeholder="first name"
        />
      </label>
      <label
        className="register-lastname-label"
        htmlFor="register-lastname-input"
      >
        Last Name
        <br />
        {errors.lastName && (
          <span className="form-err-message">
            {errors.lastName.message?.toString()}
          </span>
        )}
        <input
          id="register-lastname-input"
          className="form-input"
          {...register("lastName", {
            required: true,
            validate: validateLastName,
          })}
          type="text"
          placeholder="last name"
        />
      </label>

      <label
        className="register-username-label"
        htmlFor="register-username-input"
      >
        Username
        <br />
        {errors.username && (
          <span className="form-err-message">
            {errors.username.message?.toString()}
          </span>
        )}
        <input
          id="register-username-input"
          className="form-input"
          type="text"
          {...register("username", {
            required: true,
            validate: validateUsername,
          })}
          placeholder="username"
        />
      </label>
      <label
        className="register-password-label"
        htmlFor="register-password-input"
      >
        Password
        <br />
        {errors.password && (
          <span className="form-err-message">
            {errors.password.message?.toString()}
          </span>
        )}
        <input
          id="register-password-input"
          className="form-input"
          type={"password"}
          {...register("password", {
            required: true,
            validate: validatePassword,
          })}
          placeholder="password"
        />
      </label>

      <label htmlFor="">
        Date of Birth <small>(YYYY-MM-DD)</small>
        <br />
        {errors.dateOfBirth && (
          <span className="form-err-message">
            {errors.dateOfBirth.message?.toString()}
          </span>
        )}
        <input
          id="register-date-of-birth"
          className="form-input"
          type="date"
          {...register("dateOfBirth", {
            required: true,
            // browser will validate the date
          })}
        />
      </label>
      <button disabled={isSubmitting} type="submit" className="form-button">
        Submit
      </button>
      <p className="register-login-option">
        Already have an account?{" "}
        <NavLink className="register-login-toggle" to="/login">
          Login
        </NavLink>
      </p>
    </form>
  );
};

export default RegistrationForm;
