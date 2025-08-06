import React, { useState, useEffect, useRef } from 'react';
import { checkSessionAndLoginAutomatically, playerLogin } from '../../db/db';
import { useNavigate } from 'react-router-dom';

interface LoginScreenProps {
  onClose: () => void; // Assuming you'll pass this callback from the parent
  onGameStart: (storage: PlayerStorage) => void; // Callback to handle game start
}

const LoginPanel: React.FC<LoginScreenProps> = ({ onClose, onGameStart }) => {
  const [active, setActive] = useState(true);
  const errorEl = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  // Call the session check on component mount
  useEffect(() => {
    checkSessionAndLoginAutomatically((storage) => onGameStart(storage));
  }, []);

  // Handling the escape key to return to the user screen
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setActive(false);
        onClose();
      }
    };

    if (active) {
      document.addEventListener("keydown", handleGlobalKeyDown);
      return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [active, onClose]);

  const handleError = (error: Error | null) => {
    if (errorEl.current && error) errorEl.current.textContent = String(error);
  }

  const handleLoginForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Extracting username and password from the form
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    playerLogin(
      username,
      password,
      (storage) => {
        onGameStart(storage)
        handleError(null)
      },
      (error: Error) => handleError(error)
    )
  };

  return (
    <>
      <form
        className="flex flex-col items-center justify-center w-full h-full text-sm text-left gap-y-4"
        onSubmit={handleLoginForm}
      >
        <p className='text-md font-wrongun'>
          Enter your username & password
        </p>

        <div className='flex flex-col gap-y-2'>
          <div className="flex items-center justify-between gap-x-2">
            <p>Username: </p>
            <input
              className='w-full'
              name="username"
              type="text"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-x-2">
            <p>Password: </p>
            <input
              className='w-full'
              name="password"
              type="password"
              required
            />
          </div>

          <small
            className='text-validation-error'
            ref={errorEl}
          ></small>
        </div>

        <div className='flex gap-x-2'>
          <button
            className='w-16 button button--primary'
            type='submit'
          >
            Login
          </button>

          <button
            className='w-16 button button--primary'
            onClick={() => navigate('/terminal')}
          >
            Cancel
          </button>
        </div>

        <small>
          Forgotten your password?
          <a
            className='pl-1 text-white'
            onClick={() => navigate('/recovery')}
          >
            Click here.
          </a>
        </small>
      </form>
    </>
  );
};

export default LoginPanel;
