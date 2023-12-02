import "./SpinnerDiv.css";
import { LoadingSpinner } from "..";

type SpinnerDivProps = {
  spinnerSize?: number;
  style?: React.CSSProperties;
};
export default function SpinnerDiv({
  spinnerSize = 75,
  style,
}: SpinnerDivProps) {
  return (
    <div style={style} className="spinner-div">
      <LoadingSpinner size={spinnerSize} />
    </div>
  );
}
