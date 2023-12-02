interface LoadingSpinnerProps {
  size: number;
  strokeWidth?: number;
  color?: string;
}

export default function LoadingSpinner({
  size,
  strokeWidth = 2,
  color = "white",
}: LoadingSpinnerProps) {
  const radius = size / 2 - strokeWidth / 2;
  const innerRadius = radius * 0.6; // Adjust the inner radius as needed
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${circumference / 2} ${circumference / 2}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2},${size / 2})`}>
        <g transform="rotate(90)">
          <path
            d={`M${radius},0A${radius},${radius} 0 1,0 ${-radius},0`}
            fill="none"
            strokeWidth={strokeWidth}
            stroke={color}
            strokeDasharray={dashArray}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 0 0"
              to="360 0 0"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
        </g>
        <g transform="rotate(90)">
          <path
            d={`M${innerRadius},0A${innerRadius},${innerRadius} 0 1,1 ${-innerRadius},0`}
            fill="none"
            strokeWidth={strokeWidth}
            stroke={color}
            strokeDasharray={dashArray}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 0 0"
              to="-360 0 0"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </g>
    </svg>
  );
}
