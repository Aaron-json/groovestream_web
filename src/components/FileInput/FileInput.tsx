import React, { useRef, useState } from "react";
import "./FileInput.css";

export interface FileInputError {
  message: string;
  code: string;
  filename: string;
}

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
  const handleFileInput: React.FormEventHandler<HTMLInputElement> = (e) => {
    const files = e.currentTarget.files;
    if (!files) return;
    const formData = new FormData();
    let error: FileInputError | undefined;
    for (let i = 0; i < files.length; i++) {
      // check if each file is a valid file type
      if (formats.includes(files[i].type)) {
        formData.append("files", files[i]);
      } else {
        error = {
          message: "Invalid file type",
          code: "INVALID_TYPE",
          filename: files[i].name,
        };
        break;
      }
    }

    e.currentTarget.value = "";
    if (error) {
      onInput(undefined, error);
    } else {
      onInput(formData, undefined);
    }
  };

  return (
    <input
      type="file"
      className="file-input"
      // check that multiple is the bool value true and not
      // any other object that evaluates to true.
      multiple={multiple}
      onInput={handleFileInput}
    />
  );
}
