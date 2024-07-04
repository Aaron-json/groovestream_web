import React from "react";
import "./FileInput.css";

export enum FileInputErrorCode {
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  SIZE_LIMIT_EXCEEDED = "SIZE_LIMIT_EXCEEDED",
}
export interface FileInputError {
  message: string;
  code: FileInputErrorCode;
  filename: string | undefined;
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
          message: `Invalid file type. Supported file types are: ${formats.join(
            ", "
          )}.`,
          code: FileInputErrorCode.INVALID_FILE_TYPE,
          filename: files[i].name,
        };
        break;
      }
      totalSize += files[i].size;
      if (totalSize > sizeLimit) {
        error = {
          message: `File size exceeds the limit of ${Math.round(sizeLimit / 1000)} MB.`,
          code: FileInputErrorCode.SIZE_LIMIT_EXCEEDED,
          filename: undefined,
        };
        break;
      }

      formData.append("files", files[i]);
    }

    // is value is not reset, selecting the same files a second time
    // will not trigger the onInput event
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
