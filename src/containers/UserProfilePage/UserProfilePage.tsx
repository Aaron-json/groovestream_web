import "./UserProfilePage.css";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { useContext, useEffect, useState, useReducer } from "react";
import { FileInput } from "../../components";
import axiosClient from "../../api/axiosClient";
import { profile_icon } from "../../assets/default-icons";
import { FileInputError } from "../../components/FileInput/FileInput";
import { uploadProfilePicture } from "../../api/requests/media";
import { getUserFields } from "../../api/requests/user";
import { convertToTimeStamp } from "../../api/validation/FormInput";
import { format } from "date-fns";
const supportedProfilePictureFormats = ["image/jpeg", "image/png"];

const profileChangesReducer = (
  state: ProfileChangesState,
  action: ProfileChangesAction
) => {
  // fix to return a new object to cause a state change
  switch (action.field) {
    case "firstName":
      const firstNamePattern = "^[a-zA-Z-]{2,}$";
      const ifValidFirstName = RegExp(firstNamePattern).test(action.value);
      return {
        ...state,
        firstName: { value: action.value, valid: ifValidFirstName },
      };
    case "lastName":
      const lastNamePattern = "^[a-zA-Z-]{2,}$";
      const ifValidLastName = RegExp(lastNamePattern).test(action.value);
      return {
        ...state,
        lastName: { value: action.value, valid: ifValidLastName },
      };
    case "dateOfBirth":
      const datePattern =
        "^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-([0-9]{4})$";
      const ifValidDate = RegExp(datePattern).test(action.value);
      return {
        ...state,
        dateOfBirth: { value: action.value, valid: ifValidDate },
      };
    case "reset":
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

  const [ifApplyingChangesFailed, setIfApplyingChangesFailed] = useState(false);

  const { accessTokenRef, request, logout } = useContext(
    authenticationContext
  )!;
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
        "dateCreated",
        "email",
        "friends",
      ];
      const userInfo = await request(
        async () =>
          await getUserFields(fields, { accessToken: accessTokenRef.current })
      );
      setUser(userInfo);
    } catch (err) {
      console.log(err);
    }
  }

  type UserUpdateQuery = {
    [key in keyof ProfileChangesState]: User[key];
  };
  async function applyChanges() {
    const updateQuery: UserUpdateQuery = {};
    let UpdateQueryEmpty = true;

    let field: keyof ProfileChangesState;
    for (field in profileChanges) {
      // new change is the same as the old version
      if (profileChanges[field]!.value === user![field]) continue;
      // changes made are not valid values for that field
      if (profileChanges[field]!.valid === false) {
        setIfApplyingChangesFailed(true);
        return;
      }
      if (field === "dateOfBirth") {
        //change the date of Birth to its time stamp
        const timestamp = convertToTimeStamp(profileChanges.dateOfBirth!.value);
        if (timestamp !== user!.dateOfBirth) {
          updateQuery.dateOfBirth = timestamp;
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
      await request(async () => {
        return await axiosClient.put(
          "/user",
          {
            fields: updateQuery,
          },
          {
            headers: {
              Authorization: `Bearer ${accessTokenRef.current}`,
            },
          }
        );
      });
    } catch (error) {
      console.log(error);
    }
    setIfApplyingChangesFailed(false);
    await fetchUserData();
  }

  function getProfilePicture() {
    if (user!.profilePicture) {
      return `data:${user!.profilePicture.mimeType};base64,${
        user!.profilePicture.data
      }`;
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
      console.log((formData.get("files") as File).type);
      await request(
        async () =>
          await uploadProfilePicture(formData, {
            accessToken: accessTokenRef.current,
          })
      );
      await fetchUserData();
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
      {ifApplyingChangesFailed && (
        <label className="user-profile-page-label changes-failed">
          One or more fields are invalid
        </label>
      )}
      <div className="user-profile-page-name-div">
        <label
          className={`user-profile-page-label${
            profileChanges?.firstName?.valid === false ? " invalid" : ""
          }`}
        >
          First Name
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
                field: "firstName",
                value: e.target.value,
              });
            }}
          />
        </label>
        <label
          className={`user-profile-page-label${
            profileChanges?.lastName?.valid === false ? " invalid" : ""
          }`}
        >
          Last Name
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
                field: "lastName",
                value: e.target.value,
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
      <label
        className={`user-profile-page-label${
          profileChanges?.dateOfBirth?.valid === false ? " invalid" : ""
        }`}
      >
        Birthday <small>(DD-MM-YYYY)</small>
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
              field: "dateOfBirth",
              value: e.target.value,
            });
          }}
        />
      </label>
      <label className="user-profile-page-label">
        Friends: {user.friends!.length}
      </label>
      <label className="user-profile-page-label">
        Date Joined: {format(new Date(user.dateCreated!), "do MMMM yyyy")}
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

/**
 * Takes date string and returns its timestamp
 * @param {String} dateString Date sting in format (DD-MM-YYYY)
 */
interface ProfileChangesField {
  value: string;
  valid: boolean;
}
interface ProfileChangesState {
  firstName?: ProfileChangesField;
  lastName?: ProfileChangesField;
  email?: ProfileChangesField;
  dateOfBirth?: ProfileChangesField;
  friends?: ProfileChangesField;
  dateCreated?: ProfileChangesField;
}
// interface UserUpdateQuery{
//   firstName?: User["firstName"];
//   lastName?: User["lastName"];
//   email?:User["email"];
//   dateOfBirth?:User["dateOfBirth"];
//   friends?:User["friends"];
//   dateCreated?: User["dateCreated"];
// }
interface ProfileChangesAction {
  field: string;
  value: string;
}
