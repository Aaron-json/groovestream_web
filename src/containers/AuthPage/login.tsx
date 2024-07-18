import { supabaseClient } from "../../App";
import { FieldValues, useForm } from "react-hook-form";
import { AuthAction } from "./AuthPage";
import { useState } from "react";
import { FormState } from "../../types/formstate"
import { SignInWithPasswordCredentials } from "@supabase/supabase-js";

export default function LoginForm({ setAuthAction: setAuthAction }: { setAuthAction: (type: AuthAction) => void }) {
  const { register, handleSubmit } = useForm()
  const [formState, setFormState] = useState<FormState>({ state: "input" })

  async function onSubmit(fields: FieldValues) {
    setFormState({ state: "loading" })
    const loginResponse = await supabaseClient.auth.signInWithPassword(fields as SignInWithPasswordCredentials)
    if (loginResponse.error) {
      console.log(loginResponse.error)
      setFormState({ state: "error", message: loginResponse.error.message })
      return
    }
    setFormState({ state: "submitted" })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <h2>
        Sign in
      </h2>
      <span className={formState.state === "error" ? "form-err-message" : undefined}>{formState.message}</span>
      <label>
        Email address
        <input {...register("email")} className="form-input" type="text" />
      </label>
      <label>
        Your password
        <input {...register("password")} className="form-input" type="password" />
      </label>
      <button disabled={formState.state === "loading"} className="form-button">
        Sign in
      </button >
      <span className="auth-page-action"
        onClick={() => setAuthAction("signup")}> Dont have an account? Sign up
      </span>

    </form>
  );
}
