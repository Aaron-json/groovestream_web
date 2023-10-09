type actionFunction = () => void;
/**
 * Returns a function that serves to debounce an action in a React useEffect
 * @param {Function} action - Function that gets debounced
 * @param {number} duration - Delay of the function in milliseconds (ms)
 * @returns {Function} Clean up function to clear the timeout when components mounts again within the delay
 */
export function debounced(action: actionFunction, duration: number) {
  // allows to make debounced requests and actions
  const timeout = setTimeout(action, duration);

  return () => clearTimeout(timeout);
}
