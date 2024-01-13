import "./RegistrationForm.css";
import { useReducer, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  convertToTimeStamp,
  userInfoInputValidator,
} from "../../api/validation/FormInput";
import { userSignUp } from "../../api/requests/user";
import { AxiosError } from "axios";

const RegistrationForm = () => {
  const navigator = useNavigate();
  const [registrationFields, registrationFieldsDispatch] = useReducer(
    registrationFieldsReducer,
    {
      firstName: { value: "", errMessage: undefined },
      lastName: { value: "", errMessage: undefined },
      email: { value: "", errMessage: undefined },
      dateOfBirth: { value: "", errMessage: undefined },
      password: { value: "", show: false, errMessage: undefined },
    }
  );
  const [formState, setFormState] = useState<FormState>({ state: "input" });

  function registrationFieldsReducer(
    prevState: UserInfo,
    action: UserInfoUpdate
  ): UserInfo {
    switch (action.type) {
      case "error":
        const field = action.payload.field;
        const errMessage = action.payload.errMessage;
        return {
          ...prevState,
          // add all the previous values in registration fields
          [field]: {
            // add all the previous values in this field's object and update its error message
            ...prevState[field],
            errMessage: errMessage,
          },
        };

      case "firstName":
      case "lastName":
      case "email":
      case "dateOfBirth":
        return {
          ...prevState,
          [action.type]: {
            ...prevState[action.type],
            value: action.payload,
          },
        };
      case "password":
        return {
          ...prevState,
          password: {
            ...prevState.password,
            value: action.payload,
            show: false,
          },
        };
      default:
        return prevState;
    }
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState({ state: "loading" });
    // validate input
    const registrationQuery: any = {};
    let invalidCount = 0;
    let key: keyof UserInfo;
    for (key in registrationFields) {
      //check if any field is invalid
      // set the error message for an invalid field
      const validation = userInfoInputValidator(
        key,
        registrationFields[key].value
      );
      if (!validation.valid) {
        invalidCount++;
        registrationFieldsDispatch({
          type: "error",
          payload: {
            field: key,
            errMessage: validation.message,
          },
        });
      } else if (validation.valid && registrationFields[key].errMessage) {
        registrationFieldsDispatch({
          type: "error",
          payload: {
            field: key,
            errMessage: undefined,
          },
        });
      }
    }

    // if any field was invalid stop the action
    if (invalidCount > 0) {
      setFormState({
        state: "error",
        message: "Invalid",
      });
      return;
    }
    registrationQuery.firstName = registrationFields.firstName.value;
    registrationQuery.lastName = registrationFields.lastName.value;
    registrationQuery.dateOfBirth = convertToTimeStamp(
      registrationFields.dateOfBirth.value
    );
    registrationQuery.email = registrationFields.email.value;
    registrationQuery.password = registrationFields.password.value;
    try {
      const response = await userSignUp(registrationQuery);
      if (response.status == 201) {
        navigator("/login");
      }
    } catch (error) {
      if ((error as AxiosError).code === "ERR_NETWORK") {
        setFormState({ state: "error", message: "Network Error" });
      } else {
        setFormState({
          state: "error",
          message: "Could not sign up. Please try again later!",
        });
      }
    }
  }
  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <h2 className="register-form-header">Sign up</h2>
      <span className="form-err-message">
        {formState.state === "error" ? formState.message : undefined}
      </span>
      <label htmlFor="register-firstname-input">
        First Name
        <br />
        {
          <span className="form-err-message">
            {registrationFields.firstName.errMessage}
          </span>
        }
        <input
          id="register-firstname-input"
          className="form-input"
          value={registrationFields.firstName.value}
          onChange={(e) =>
            registrationFieldsDispatch({
              type: "firstName",
              payload: e.target.value,
            })
          }
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
        <span className="form-err-message">
          {registrationFields.lastName.errMessage}
        </span>
        <input
          id="register-lastname-input"
          className="form-input"
          value={registrationFields.lastName.value}
          onChange={(e) =>
            registrationFieldsDispatch({
              type: "lastName",
              payload: e.target.value,
            })
          }
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
        <span className="form-err-message">
          {registrationFields.email.errMessage}
        </span>
        <input
          id="register-username-input"
          className="form-input"
          type="email"
          value={registrationFields.email.value}
          onChange={(e) =>
            registrationFieldsDispatch({
              type: "email",
              payload: e.target.value,
            })
          }
          placeholder="email"
        />
      </label>
      <label
        className="register-password-label"
        htmlFor="register-password-input"
      >
        Password
        <br />
        <span className="form-err-message">
          {registrationFields.password.errMessage}
        </span>
        <input
          id="register-password-input"
          className="form-input"
          type={registrationFields.password.show ? "text" : "password"}
          value={registrationFields.password.value}
          onChange={(e) =>
            registrationFieldsDispatch({
              type: "password",
              payload: e.target.value,
            })
          }
          placeholder="password"
        />
      </label>

      <label htmlFor="">
        Date of Birth <small>(DD-MM-YYYY)</small>
        <br />
        <span className="form-err-message">
          {registrationFields.dateOfBirth.errMessage}
        </span>
        <input
          id="register-date-of-birth"
          className="form-input"
          type="text"
          value={registrationFields.dateOfBirth.value}
          onChange={(e) =>
            registrationFieldsDispatch({
              type: "dateOfBirth",
              payload: e.target.value,
            })
          }
        />
      </label>
      <button
        disabled={formState.state === "loading"}
        type="submit"
        className="form-button"
      >
        Submit
      </button>
      <p>
        Already have an account?{" "}
        <NavLink className="register-login-toggle" to="/login">
          Login
        </NavLink>
      </p>
    </form>
  );
};

export default RegistrationForm;
