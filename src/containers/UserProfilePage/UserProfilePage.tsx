import "./UserProfilePage.css";
import { authenticationContext } from "../../contexts/AuthenticationContext";
import { useContext, useEffect, useState } from "react";
import { FileInput, LoadingSpinnerDiv } from "../../components";
import { edit_icon, profile_icon } from "../../assets/default-icons";
import { FileInputError } from "../../components/FileInput/FileInput";
import {
  getOwnProfilePicture,
  getUser,
  updateUserInfo,
  uploadProfilePicture,
} from "../../api/requests/user";
import {
  validateDateString,
  validateFirstName,
  validateLastName,
  validateUsername,
} from "../../validation/FormInput";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supportedProfilePictureFormats } from "../../global/media/media";
import { useForm } from "react-hook-form";
import { User } from "../../types/user";
type EditField = "firstName" | "lastName" | "username" | "dateOfBirth";
export default function UserProfilePage() {
  const { logout } = useContext(authenticationContext)!;
  const [editFields, setEditFields] = useState<EditField[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const {
    data: user,
    error: userDataErr,
    isLoading: userDataLoading,
    refetch: refetchUserData,
  } = useQuery({
    queryFn: async () => getUser(),
    queryKey: ["user"],
  });
  const {
    data: profilePicture,
    error: profilePictureErr,
    isLoading: profilePictureLoading,
    refetch: refetchProfilePicture,
  } = useQuery({
    queryFn: async () => getOwnProfilePicture(),
    queryKey: ["user-profile-picture"],
  });

  function toggleEditMode(field: EditField) {
    let originalLength = editFields.length;
    const newArr = editFields.filter((item) => item !== field);
    if (newArr.length === originalLength) {
      // add the field
      setEditFields([...editFields, field]);
      setValue(field, "");
    } else {
      setEditFields(newArr);
      //field is not disabled, reset so current val in the
      // placeholder can be displayed.
      setValue(field, "");
      // reset any previous errors on this field
      // since the field has been cleared
      clearErrors(field);
    }
  }
  async function applyChanges(fieldValues: Partial<User>) {
    try {
      // filter values
      const updateQueryData: any = {};
      let field: keyof User;
      for (field in fieldValues) {
        if (fieldValues[field]) {
          updateQueryData[field] = fieldValues[field];
        }
      }
      await updateUserInfo(updateQueryData);
      await refetchUserData();
      // reset edit fields if they
      setEditFields([]);
      reset();
    } catch (error) {
      console.log(error);
    }
  }
  async function handleProfilePictureUpload(
    formData: FormData | undefined,
    error: FileInputError | undefined
  ) {
    //profile picture change is done separate from
    if (error || !formData) {
      return;
    }
    try {
      await uploadProfilePicture(formData);

      await refetchProfilePicture();
    } catch (error) {}
  }

  function getProfileIconDisplay() {
    if (profilePictureErr) {
      return <div>Error Encountered</div>;
    } else if (profilePictureLoading) {
      return <LoadingSpinnerDiv />;
    }
    let src;
    if (!profilePicture) {
      src = profile_icon;
    } else {
      const { mimeType, data, encoding } = profilePicture;
      src = `data:${mimeType};${encoding},${data}`;
    }
    return (
      <div className="user-profile-page-profile-picture-div">
        <img className="user-profile-page-profile-picture" src={src} alt="" />
        <label className="user-profile-page-add-photo-btn">
          {profilePicture ? "Change photo" : "Upload Picture"}
          <FileInput
            onInput={handleProfilePictureUpload}
            formats={supportedProfilePictureFormats}
          />
        </label>
      </div>
    );
  }

  if (!user) return null;
  return (
    <form className="user-profile-page" onSubmit={handleSubmit(applyChanges)}>
      {getProfileIconDisplay()}

      <div className="user-profile-page-name-div">
        <div className="user-profile-page-input-group">
          <label
            className="user-profile-page-label"
            htmlFor="user-profile-firstname-input"
          >
            First Name
            <img
              src={edit_icon}
              onClick={() => toggleEditMode("firstName")}
              alt=""
            />
          </label>
          {errors.firstName && (
            <span className="form-err-message">
              {errors.firstName.message?.toString()}
            </span>
          )}
          <input
            id="user-profile-firstname-input"
            className="form-input"
            {...register("firstName", {
              validate: validateFirstName,
              disabled: !editFields.includes("firstName"),
            })}
            placeholder={
              !editFields.includes("firstName") ? user.firstName : undefined
            }
            type="text"
          />
        </div>
        <div className="user-profile-page-input-group">
          <label
            className="user-profile-page-label"
            htmlFor="user-profile-lastname-input"
          >
            Last Name
            <img
              src={edit_icon}
              onClick={() => toggleEditMode("lastName")}
              alt=""
            />
          </label>
          {errors.lastName && (
            <span className="form-err-message">
              {errors.lastName.message?.toString()}
            </span>
          )}
          <input
            className="form-input"
            id="user-profile-lastname-input"
            {...register("lastName", {
              validate: validateLastName,
              disabled: !editFields.includes("lastName"),
            })}
            placeholder={
              !editFields.includes("lastName") ? user.lastName : undefined
            }
            type="text"
          />
        </div>
      </div>
      <div className="user-profile-page-input-group">
        <label
          className="user-profile-page-label"
          htmlFor="user-profile-username-input"
        >
          Username
          <img
            src={edit_icon}
            onClick={() => toggleEditMode("username")}
            alt=""
          />
        </label>
        {errors.username && (
          <span className="form-err-message">
            {errors.username.message?.toString()}
          </span>
        )}
        <input
          id="user-profile-username-input"
          className="form-input"
          {...register("username", {
            validate: validateUsername,
            disabled: !editFields.includes("username"),
          })}
          placeholder={
            !editFields.includes("username") ? user.username : undefined
          }
          type="text"
        />
      </div>
      <div className="user-profile-page-input-group">
        <label
          className="user-profile-page-label"
          htmlFor="user-profile-birthday-input"
        >
          Birthday <small> (YYYY-MM-DD)</small>
          <img
            src={edit_icon}
            onClick={() => toggleEditMode("dateOfBirth")}
            alt=""
          />
        </label>
        {errors.dateOfBirth && (
          <span className="form-err-message">
            {errors.dateOfBirth.message?.toString()}
          </span>
        )}
        <input
          id="user-profile-birthday-input"
          {...register("dateOfBirth", {
            // will get validated by the browser
            disabled: !editFields.includes("dateOfBirth"),
            validate: validateDateString,
          })}
          placeholder={
            !editFields.includes("dateOfBirth")
              ? format(new Date(user.dateOfBirth), "yyyy-MM-dd")
              : undefined
          }
          className="form-input"
          type="text"
        />
      </div>
      <label className="user-profile-page-label">
        Date Joined: {format(new Date(user.dateJoined), "do MMMM yyyy")}
      </label>
      <div className="user-profile-page-footer">
        <button
          type="button"
          onClick={() => logout()}
          className="form-button user-profile-page-logout-btn"
        >
          Logout
        </button>
        <button
          className="form-button"
          disabled={isSubmitting || editFields.length === 0}
        >
          Apply
        </button>
      </div>
    </form>
  );
}
