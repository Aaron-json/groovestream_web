import "./UserProfilePage.css";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { useContext, useEffect, useState, useRef, useReducer } from "react";
import { FileInput } from "../../components";
import axiosClient from "../../api/axiosClient";
import { profile_icon } from "../../default-icons";
import moment from "moment/moment";
const supportedProfilePictureFormats = ["image/jpeg", "image/png"];

export default function UserProfilePage() {
  const [user, setUser] = useState();
  // we do not want react to rerender the page when changes are made only when applied.
  // so do not create a new object on every change, just add to the mutabla object
  // useRef since it does not cause re-renders
  const [profileChanges, profileChangesDispatch] = useReducer(
    profileChangesReducer,
    {}
  );

  const [ifApplyingChangesFailed, setIfApplyingChangesFailed] = useState(false);

  const { accessTokenRef, request, logout } = useContext(authenticationContext);
  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      const response = await request(async () => {
        return await axiosClient.get("/user", {
          headers: {
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
          params: {
            fields: [
              "profilePicture",
              "firstName",
              "lastName",
              "dateOfBirth",
              "dateCreated",
              "email",
              "friends",
            ],
          },
        });
      });
      setUser(response.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function applyChanges() {
    const updateQuery = {};
    let UpdateQueryEmpty = true;
    for (const field in profileChanges) {
      // new change is the same as the old version
      if (profileChanges[field].value === user[field]) continue;
      // changes made are not valid values for that field
      if (profileChanges[field].valid === false) {
        console.log(ifApplyingChangesFailed);
        setIfApplyingChangesFailed(true);
        return;
      }
      if (field === "dateOfBirth") {
        //change the date of Birth to its time stamp
        const timestamp = getTimestamp(profileChanges.dateOfBirth.value);
        if (timestamp !== user.dateOfBirth) {
          updateQuery.dateOfBirth = timestamp;
          UpdateQueryEmpty = false;
        }
      } else {
        updateQuery[field] = profileChanges[field].value;
        UpdateQueryEmpty = false;
      }
    }
    // check if any valid changes happened
    if (UpdateQueryEmpty) return;
    try {
      const response = await request(async () => {
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
    if (user.profilePicture) {
      console.log(user.profilePicture);
      return `data:${user.profilePicture.mimeType};base64,${user.profilePicture.data}`;
    } else {
      return profile_icon;
    }
  }

  async function handleProfilePictureUpload(formData, error) {
    //profile picture change is done separate from
    if (error || !formData) {
      console.log(error);
      return;
    }
    try {
      console.log(formData.get("files").type);
      const response = await request(
        async () =>
          await axiosClient.put("/user/profilePicture", formData, {
            headers: {
              Authorization: `Bearer ${accessTokenRef.current}`,
              "Content-Type": "multipart/form-data",
            },
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
              : moment(user.dateOfBirth).format("DD-MM-YYYY")
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
        Friends: {user.friends.length}
      </label>
      <label className="user-profile-page-label">
        Date Joined: {moment(user.dateCreated).format("DD MMMM YYYY")}
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
function getTimestamp(dateString) {
  const [day, month, year] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function ifvalidEmail() {}
function profileChangesReducer(state, action) {
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
  }
}
