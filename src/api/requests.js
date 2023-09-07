/**
 * function to make resource request that requires authentication from the server.
 * In case of failed first attempt, the refreshAuthentication function will be called
 * and the request will be tried again.
 * Only catches 401 or 403 error due to lack of authorization
 * @param {Function} requestFunction - async function that makes requests to the server and requires authentication
 * @param {Function} refreshAuthentication - function that tries to get a new access token to refresh authentication
 * @returns {Promise}
 */
export async function retryRequest(requestFunction, refreshAuthentication) {

    try {
        return await requestFunction()
    }
    catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
            await refreshAuthentication()
            return await requestFunction()
        }
        else {
            throw err
        }
    }
}
/**
 * Returns a function that serves to debounce an action in a React useEffect
 * @param {Function} action - Function that gets debounced
 * @param {Function} duration - Delay of the function in milliseconds (ms)
 * @returns {Function} Clean up function to clear the timeout when components mounts again within the delay
 */
export function debounced(action, duration) {
    // allows to make debounced requests and actions
    const timeout = setTimeout(action, duration)

    return () => clearTimeout(timeout)
}

