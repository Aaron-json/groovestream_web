import "./UserProfilePage.css";
import { useState } from "react";
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
  validateUsername,
} from "../../validation/FormInput";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  MAX_PROFILE_PICTURE_SIZE,
  supportedProfilePictureFormats,
} from "../../util/constants";
import { useForm } from "react-hook-form";
import { User } from "../../types/user";
import { supabaseClient } from "../../App";
type EditField = "firstName" | "lastName" | "username" | "dateOfBirth";
export default function UserProfilePage() {
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
      //reset so current val in the
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
    } catch (error) { }
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
            sizeLimit={MAX_PROFILE_PICTURE_SIZE}
          />
        </label>
      </div>
    );
  }

  if (!user) return null;
  return (
    <form className="user-profile-page" onSubmit={handleSubmit(applyChanges)}>
      {getProfileIconDisplay()}

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
      <label className="user-profile-page-label">
        Date Joined: {format(new Date(user.dateJoined), "do MMMM yyyy")}
      </label>
      <div className="user-profile-page-footer">
        <button
          type="button"
          onClick={() => supabaseClient.auth.signOut()}
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
