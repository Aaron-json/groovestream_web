import "./AuthPage.css";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { AuthAction } from "./AuthPage";
import { createUser } from "../../api/requests/user";
import { FormState } from "../../types/formstate";

export default function SignUpForm({ setAuthAction }: { setAuthAction: (action: AuthAction) => void }) {
  const { register, handleSubmit } = useForm()
  const [formState, setFormState] = useState<FormState>({ state: "input" })

  async function onSubmit(fields: FieldValues) {
    setFormState({ state: "loading" })

    // create user in the backend
    try {
      await createUser({ email: fields.email, username: fields.username, password: fields.password })
    }
    catch (e) {
      console.log(e);
      setFormState({ state: "error", message: "Something went wrong. Please try again later." })
      return
    }
    setAuthAction("signin")
    setFormState({ state: "submitted", message: "Check your email for a link to verify your account." })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <h2>
        Sign up
      </h2>
      {
        formState.state === "error" &&
        <span className="form-err-message">
          {formState.message}
        </span>
      }
      {
        (formState.message && formState.state !== "error") &&
        <span>
          {formState.message}
        </span>
      }
      <label>
        Email address
        <input disabled={formState.state === "loading"} {...register("email")} className="form-input" type="text" />
      </label>
      <label>
        Username
        <input disabled={formState.state === "loading"} {...register("username")} className="form-input" type="text" />
      </label>
      <label>
        Create Password
        <input disabled={formState.state === "loading"} {...register("password")} className="form-input" type="password" />
      </label>
      <button disabled={formState.state === "loading"} className="form-button">
        Sign up
      </button >
      <span className="auth-page-action" onClick={() => setAuthAction("signin")}>
        Already have an account? Sign in
      </span>
    </form>
  );
}
