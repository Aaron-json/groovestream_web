import React from "react";
import "./FileInput.css";

export interface FileInputError {
  message: string;
  code: string;
}
const supportedProfilePictureFormats = ["image/jpeg", "image/png"];

type FileInputErrorNames = "INVALID_TYPE" | "EXPECTED_FORMATS_UNSPECIFIED";
type FileInputErrors = {
  [key in FileInputErrorNames]: FileInputError;
};
const errorFormats: FileInputErrors = {
  INVALID_TYPE: {
    message: "one of the selected files is not a valid format",
    code: "INVALID_TYPE",
  },
  EXPECTED_FORMATS_UNSPECIFIED: {
    message: "an array of the required file types if required",
    code: "EXPECTED_FORMATS_UNSPECIFIED",
  },
};

interface FileInputProps {
  onInput: (
    data: FormData | undefined,
    error: FileInputError | undefined
  ) => any;
  multiple?: boolean;
  formats: string[];
}
export default function FileInput({
  onInput,
  multiple,
  formats,
}: FileInputProps) {
  function validFileType(file: File) {
    return formats.includes(file.type);
  }

  const handleFileInput: React.FormEventHandler<HTMLInputElement> = (e) => {
    // check if supported formats are specified
    if (!formats) {
      onInput(undefined, errorFormats.EXPECTED_FORMATS_UNSPECIFIED);
      e.currentTarget.value = "";
      return;
    }
    const files = e.currentTarget.files;
    if (!files) return;
    const formData = new FormData();
    let error = undefined;
    for (let i = 0; i < files.length; i++) {
      // check if each file is a valid file type
      if (validFileType(files[i])) {
        formData.append("files", files[i]);
      } else {
        error = errorFormats.INVALID_TYPE;
        break;
      }
    }
    // returns files before the error and the error itself
    onInput(formData, error);
    e.currentTarget.value = "";
  };

  return (
    <input
      type="file"
      className="file-input"
      // check that multiple is the bool value true and not
      // any other object that evaluates to true.
      multiple={multiple === true && true}
      onInput={handleFileInput}
    />
  );
}
