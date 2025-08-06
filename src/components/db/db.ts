import React from "react";

/**
 * Connects to the login endpoint on the fishworld api to log the player in.
 *
 * @param username
 * @param password
 * @param callback
 */
export const playerLogin = async (
  username: string,
  password: string,
  successCallback?: (storage: PlayerStorage) => void,
  failedCallback?: (error: Error) => void
) => {
  await fetch('https://api.idiot.surf/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
      }),
      credentials: 'include',
    })
    .then((res) => {
      if (!res.ok && res) {
        if (res.status === 401) {
          // If the server responds with a non-2xx status, throw an error.
          throw new Error('Invalid username or password.');
        } else {
          throw new Error('Unknown login error.');
        }
      }
      return res.json();
    })
    .then((storage: PlayerStorage) => {
      console.log('Login successful, player data:', storage);
      if (successCallback) successCallback(storage);
    })
    .catch((err) => {
      console.error(`Login failed. ${err}`);
      if (failedCallback) failedCallback(err);
    })
}

/**
 * Connects to the logout endpoint on the fishworld api to log the player out.
 *
 * @param callback
 */
export const playerLogout = async (successCallback?: () => void, failedCallback?: () => void) => {
  await fetch("https://api.idiot.surf/logout", {
    method: 'POST',
    credentials: 'include'
  })
    .then((res) => res.text())
    .then(() => {
      console.log('Logged out successfuly');
      if (successCallback) successCallback();
    })
    .catch((err) => {
      console.error(`Logout failed. ${err}`);
      if (failedCallback) failedCallback();
    })
}

/**
 * Connects to the register endpoint on the fishworld api to register the player with a username and password.
 *
 * @param username
 * @param password
 * @param callback
 */
export const playerRegister = async (
  formData: FormData,
  successCallback?: () => void,
  failedCallback?: (error: Error) => void
) => {
  const response = await fetch('https://api.idiot.surf/register', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (failedCallback) failedCallback(new Error(errorText));
    return;
  }

  console.log('Registered successfully!');
  if (successCallback) successCallback();
};

/**
 * Connects to the session validation endpoint on the fishworld api to verify whether or not
 * the user is already logged in via their session cookie.
 *
 * @param successCallback
 * @param failedCallback
 */
export const checkSessionAndLoginAutomatically = async (successCallback?: (storage: PlayerStorage) => void, failedCallback?: () => void) => {
  try {
    const response = await fetch('https://api.idiot.surf/player/session/validate', {
      credentials: 'include',
    });

    const storage = await response.json() as PlayerStorage;
    if (storage.isLoggedIn) {
      console.log("User is logged in:", storage);
      // Proceed with the application as a logged-in user
      if (successCallback) successCallback(storage);
    } else {
      console.log("User is not logged in");
      if (failedCallback) failedCallback();
    }
  } catch (error) {
    console.error("Error checking session:", error);
  }
};

/**
 * Connects to the faceUpload endpoint on the fishworld api to replace the saved face image on the player's data.
 *
 * @param username
 * @param password
 * @param callback
 */
export const playerUploadFace = async (
  formData: FormData,
  successCallback?: (data: { face: string }) => void,
  failedCallback?: (error: Error) => void
) => {
  await fetch('https://api.idiot.surf/player/settings/face', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })
    .then((res) => res.json())
    .then(data => {
      console.log('Face uploaded successfully!');
      if (successCallback) successCallback(data);
    })
    .catch(error => {
      if (failedCallback) failedCallback(new Error(error.message));
    });
};
