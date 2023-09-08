import "./FileInput.css";
const FileInput = ({ onInput }) => {
  function handleFileInput(e) {
    const files = e.target.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("media", files[i]);
    }
    onInput(formData);
  }
  return (
    <input
      name="media"
      type="file"
      className="file-input"
      multiple
      onInput={handleFileInput}
      onClick={(e) => {
        e.target.value = null;
      }}
    />
  );
};

export default FileInput;
