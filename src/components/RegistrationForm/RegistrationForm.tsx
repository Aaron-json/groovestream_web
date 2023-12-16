import React, { useReducer } from "react";
import { NavLink, useNavigate } from "react-router-dom";
// import { useContext } from "react";
import "./RegistrationForm.css";
import axiosClient from "../../api/axiosClient";
import {
  convertToTimeStamp,
  validateDateString,
  validateFirstName,
  validateLastName,
  validatePassword,
} from "../../api/validation/FormInput";

interface RegistrationFieldsAction {
  type: keyof RegistrationFields;
  payload: string;
}
interface RegistrationFieldObj {
  value: string;
  valid: boolean;
}
interface PasswordFieldObj extends RegistrationFieldObj {
  show: boolean;
}
interface RegistrationFields {
  firstName: RegistrationFieldObj;
  lastName: RegistrationFieldObj;
  email: RegistrationFieldObj;
  dateOfBirth: RegistrationFieldObj;
  password: PasswordFieldObj;
  confirmPassword: PasswordFieldObj;
}
type RegistrationFieldsReducer = React.Reducer<
  RegistrationFields,
  RegistrationFieldsAction
>;
const RegistrationForm = () => {
  // const { refreshAuthentication } = useContext(authenticationContext)
  const navigator = useNavigate();
  const [registrationFields, registrationFieldsDispatch] =
    useReducer<RegistrationFieldsReducer>(registrationFieldsReducer, {
      firstName: { value: "", valid: true },
      lastName: { value: "", valid: true },
      email: { value: "", valid: true },
      dateOfBirth: { value: "", valid: true },
      password: { value: "", valid: true, show: false },
      confirmPassword: { value: "", valid: true, show: false },
    });

  function registrationFieldsReducer(
    prevState: RegistrationFields,
    action: RegistrationFieldsAction
  ): RegistrationFields {
    switch (action.type) {
      case "firstName":
        return {
          ...prevState,
          firstName: {
            value: action.payload,
            valid: validateFirstName(action.payload),
          },
        };
      case "lastName":
        return {
          ...prevState,
          lastName: {
            value: action.payload,
            valid: validateLastName(action.payload),
          },
        };
      case "email":
        return {
          ...prevState,
          email: { value: action.payload, valid: true },
        };
      case "dateOfBirth":
        return {
          ...prevState,
          dateOfBirth: {
            value: action.payload,
            valid: validateDateString(action.payload),
          },
        };
      case "password":
        let ifValidPassword = validatePassword(action.payload);
        return {
          ...prevState,
          password: {
            value: action.payload,
            valid: ifValidPassword,
            show: false,
          },
        };
      case "confirmPassword":
        let ifValidConfirmPassword =
          action.payload === prevState.password.value;

        return {
          ...prevState,
          confirmPassword: {
            value: action.payload,
            valid: ifValidConfirmPassword,
            show: false,
          },
        };
    }
  }
  type RegistrationQueryBody = {
    [key in keyof RegistrationFields]?: any;
  };
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // get values from input fieldsr
    let key: keyof RegistrationFields;
    const registrationQuery: RegistrationQueryBody = {};
    for (key in registrationFields) {
      //check if any field is invalid
      if (registrationFields[key].valid === false) {
        console.log(`${key} is invalid`);
        return;
      }
    }
    registrationQuery.firstName = registrationFields.firstName.value;
    registrationQuery.lastName = registrationFields.lastName.value;
    registrationQuery.dateOfBirth = convertToTimeStamp(
      registrationFields.dateOfBirth.value
    );
    registrationQuery.email = registrationFields.email.value;
    registrationQuery.password = registrationFields.password.value;
    console.log(registrationQuery);
    try {
      const response = await axiosClient.post("/user", registrationQuery);
      console.log(response);
      if (response.status == 201) {
        navigator("/login");
      }
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <h3 className="register-form-header">Sign up</h3>
      <label
        className="register-firname-label"
        htmlFor="register-firstname-input"
      >
        First Name
      </label>
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

      <label
        className="register-lastname-label"
        htmlFor="register-lastname-input"
      >
        Last Name
      </label>
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

      <label
        className="register-username-label"
        htmlFor="register-username-input"
      >
        Username
      </label>
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
      <label
        className="register-password-label"
        htmlFor="register-password-input"
      >
        Password
      </label>
      <input
        id="register-password-input"
        className="form-input"
        type="password"
        value={registrationFields.password.value}
        onChange={(e) =>
          registrationFieldsDispatch({
            type: "password",
            payload: e.target.value,
          })
        }
        placeholder="password"
      />
      <label
        className="register-confirm-password-label"
        htmlFor="register-confirm-password-input"
      >
        Confirm Password
      </label>
      <input
        id="register-confirm-password-input"
        className="form-input"
        type="password"
        value={registrationFields.confirmPassword.value}
        onChange={(e) =>
          registrationFieldsDispatch({
            type: "confirmPassword",
            payload: e.target.value,
          })
        }
        placeholder="password"
      />
      <label htmlFor="">
        Date of Birth <small>(DD-MM-YYYY)</small>
      </label>
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
      <button type="submit" className="login-submit">
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
