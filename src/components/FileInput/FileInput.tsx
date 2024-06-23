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
  // size in bytes
  sizeLimit: number; // bytes
}
export default function FileInput({
  onInput,
  multiple,
  formats,
  sizeLimit,
}: FileInputProps) {
  const handleFileInput: React.FormEventHandler<HTMLInputElement> = (e) => {
    const files = e.currentTarget.files;
    if (!files) return;
    const formData = new FormData();
    let error: FileInputError | undefined;
    let totalSize: number = 0;
    for (let i = 0; i < files.length; i++) {
      // check if each file is a valid file type
      if (!formats.includes(files[i].type)) {
        error = {
          message: `Invalid file type. Supported file types are include ${formats.join(
            ", "
          )}.`,
          code: "INVALID_FILE_TYPE",
          filename: files[i].name,
        };
        break;
      }
      totalSize += files[i].size;
      if (totalSize > sizeLimit) {
        error = {
          message: `File size exceeds the limit of ${sizeLimit} MB.`,
          code: "SIZE_LIMIT_EXCEEDED",
          filename: files[i].name,
        };
        break;
      }

      formData.append("files", files[i]);
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
