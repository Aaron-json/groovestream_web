import "./UserProfilePage.css";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { useContext, useEffect, useState, useReducer } from "react";
import { FileInput } from "../../components";
import axiosClient from "../../api/axiosClient";
import { profile_icon } from "../../assets/default-icons";
import { FileInputError } from "../../components/FileInput/FileInput";
import { uploadProfilePicture } from "../../api/requests/media";
import { getUserFields } from "../../api/requests/user";
import {
  convertToTimeStamp,
  userInfoInputValidator,
} from "../../api/validation/FormInput";
import { format } from "date-fns";
const supportedProfilePictureFormats = ["image/jpeg", "image/png"];

const profileChangesReducer = (
  state: ProfileChanges,
  action: ProfileChangesUpdateAction | ProfileChangesResetAction
) => {
  // fix to return a new object to cause a state change
  switch (action.type) {
    case "update":
      // update a field's object with the new value in the payload
      return {
        ...state,
        [action.field]: {
          ...state[action.field],
          ...action.payload,
        },
      };
    case "reset":
      // remove all changes
      return {};

    default:
      return state;
  }
};

export default function UserProfilePage() {
  const [user, setUser] = useState<User | undefined>();
  // we do not want react to rerender the page when changes are made only when applied.
  // so do not create a new object on every change, just add to the mutabla object
  // useRef since it does not cause re-renders
  const [profileChanges, profileChangesDispatch] = useReducer(
    profileChangesReducer,
    {}
  );

  const { logout } = useContext(authenticationContext)!;
  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      const fields = [
        "profilePicture",
        "firstName",
        "lastName",
        "dateOfBirth",
        "createdAt",
        "email",
      ];
      const userInfo = await getUserFields(fields);
      setUser(userInfo);
    } catch (err) {
      console.log(err);
    }
  }

  type UserUpdateQuery = {
    [key in keyof ProfileChanges]: User[key];
  };
  async function applyChanges() {
    const updateQuery: UserUpdateQuery = {};
    let UpdateQueryEmpty = true;
    let field: keyof ProfileChanges;
    for (field in profileChanges) {
      // new change is the same as the old version of that field
      if (profileChanges[field]!.value === user![field]) continue;
      const ifValid = userInfoInputValidator(
        field,
        profileChanges[field]?.value
      );
      if (!ifValid.valid) {
        // changes made are not valid values for that field
        profileChangesDispatch({
          type: "update",
          field,
          payload: {
            errMessage: ifValid.message,
          },
        });
        // skip the iteration
        continue;
      }
      if (field === "dateOfBirth") {
        //change the date of Birth to its time stamp
        const timestamp = convertToTimeStamp(profileChanges.dateOfBirth!.value);
        if (timestamp !== convertToTimeStamp(user!.dateOfBirth!)) {
          updateQuery.dateOfBirth = new Date(timestamp).toDateString();
          UpdateQueryEmpty = false;
        }
      } else {
        updateQuery[field] = profileChanges[field]!.value;
        UpdateQueryEmpty = false;
      }
    }

    // check if any valid changes happened
    if (UpdateQueryEmpty) return;
    try {
      await axiosClient.put("/user", {
        fields: updateQuery,
      });
    } catch (error) {
      console.log(error);
    }
    await fetchUserData();
  }

  function getProfilePicture() {
    if (user!.profilePicture) {
      const { mimeType, data, encoding } = user!.profilePicture;
      return `data:${mimeType};${encoding},${data}`;
    } else {
      return profile_icon;
    }
  }

  async function handleProfilePictureUpload(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    //profile picture change is done separate from
    if (error || !formData) {
      console.log(error);
      return;
    }
    try {
      await uploadProfilePicture(formData);
    } catch (error) {}
  }

  if (!user) return null;
  return (
    <section className="user-profile-page">
      <div className="user-profile-page-profile-picture-div">
        <img
          className="user-profile-page-profile-picture"
          src={getProfilePicture()}
          alt=""
        />
        <label className="user-profile-page-add-photo-btn">
          {user.profilePicture ? "Change photo" : "Upload Picture"}
          <FileInput
            onInput={handleProfilePictureUpload}
            formats={supportedProfilePictureFormats}
          />
        </label>
      </div>

      <div className="user-profile-page-name-div">
        <label className={`user-profile-page-label`}>
          First Name <br />
          <span className="form-err-message">
            {profileChanges.firstName?.errMessage}
          </span>
          <input
            className="user-profile-page-name-input form-input"
            value={
              // show the updated version
              profileChanges.firstName
                ? profileChanges.firstName.value
                : user.firstName
            }
            type="text"
            onChange={(e) => {
              profileChangesDispatch({
                type: "update",
                field: "firstName",
                payload: { value: e.target.value },
              });
            }}
          />
        </label>
        <label className={`user-profile-page-label`}>
          Last Name <br />
          <span className="form-err-message">
            {profileChanges.lastName?.errMessage}
          </span>
          <input
            className="user-profile-page-name-input form-input"
            value={
              // show the updated version
              profileChanges.lastName
                ? profileChanges.lastName.value
                : user.lastName
            }
            type="text"
            onChange={(e) => {
              profileChangesDispatch({
                type: "update",
                field: "lastName",
                payload: { value: e.target.value },
              });
            }}
          />
        </label>
      </div>
      <label className="user-profile-page-label">
        Email
        <input
          className="form-input"
          disabled={true}
          placeholder={user.email}
          type="email"
        />
      </label>
      <label className={`user-profile-page-label`}>
        Birthday <small>(DD-MM-YYYY)</small> <br />
        <span className="form-err-message">
          {profileChanges.dateOfBirth?.errMessage}
        </span>
        <input
          value={
            // show the updated version
            profileChanges.dateOfBirth
              ? profileChanges.dateOfBirth.value
              : format(new Date(user.dateOfBirth!), "dd-MM-yyyy")
          }
          className="form-input"
          type="text"
          onChange={(e) => {
            profileChangesDispatch({
              type: "update",
              field: "dateOfBirth",
              payload: { value: e.target.value },
            });
          }}
        />
      </label>
      <label className="user-profile-page-label">
        Date Joined: {format(new Date(user.createdAt!), "do MMMM yyyy")}
      </label>
      <div className="user-profile-page-footer">
        <button
          onClick={() => logout()}
          className="form-button user-profile-page-logout-btn"
        >
          Logout
        </button>
        <button className="form-button" onClick={applyChanges}>
          Apply
        </button>
      </div>
    </section>
  );
}

interface ProfileChangesField {
  value: string;
  errMessage: string;
}
interface ProfileChanges {
  firstName?: ProfileChangesField;
  lastName?: ProfileChangesField;
  email?: ProfileChangesField;
  dateOfBirth?: ProfileChangesField;
}
// interface UserUpdateQuery{
//   firstName?: User["firstName"];
//   lastName?: User["lastName"];
//   email?:User["email"];
//   dateOfBirth?:User["dateOfBirth"];
//   dateCreated?: User["dateCreated"];
// }
type ProfileChangesUpdateAction = {
  type: "update";
  field: keyof ProfileChanges;
  payload: {
    // these values will overwrite the current state values
    value?: string;
    errMessage?: string;
  };
};

type ProfileChangesResetAction = {
  type: "reset";
};
