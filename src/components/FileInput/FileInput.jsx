import "./FileInput.css";

const errorFormats = {
  INVALID_TYPE: {
    message: "one of the selected files is not a valid format",
    code: "INVALID_TYPE",
  },
  EXPECTED_FORMATS_UNSPECIFIED: {
    message: "an array of the required file types if required",
    code: "EXPECTED_FORMATS_UNSPECIFIED",
  },
};
export default function FileInput({ onInput, multiple, formats }) {
  function validFileType(file) {
    return formats.includes(file.type);
  }

  function handleFileInput(e) {
    // check if supported formats are specified
    if (!formats) {
      onInput(null, errorFormats.EXPECTED_FORMATS_UNSPECIFIED);
      e.target.value = null;
      return;
    }
    const files = e.target.files;
    const formData = new FormData();
    let error = null;
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
    e.target.value = null;
  }

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
