import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { playerLogin, playerRegister } from '../../db/db';
import { useNavigate } from 'react-router-dom';

// Define the props interface
interface RegistrationPanelProps {
  onClose: () => void;
  onGameStart: (storage: PlayerStorage) => void; // Callback to handle game start
}

const RegistrationPanel: React.FC<RegistrationPanelProps> = ({ onClose, onGameStart }) => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(true);

  const errorEl = useRef<HTMLElement | null>(null);

  const faceFileTriggerEl = useRef<HTMLLabelElement | null>(null);
  const faceFileTriggerElDefaultText = "Upload JPEG File";

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setActivePanel(false);
        onClose();
      }
    };

    if (activePanel) {
      document.addEventListener("keydown", handleGlobalKeyDown);
      return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [activePanel, onClose]);

  const handleError = (error: Error | null) => {
    if (errorEl.current && error) errorEl.current.textContent = String(error);
  }

  const handleFaceFileChange = (e: any) => {
    if (e.target.files.length > 0) {
      if (!e.target.files[0]) return;

      const fileSize = e.target.files[0].size / 1024 / 1024; // in MB
      const fileType = e.target.files[0].type;
      const fileName = e.target.files[0].name;

      if (fileSize > 2) {
        handleError(new Error('The file is too large. Please select a file that is less than 2MB.'));

        e.target.value = ''; // Reset the input
        if (faceFileTriggerEl.current) faceFileTriggerEl.current.textContent = faceFileTriggerElDefaultText;
      } else if (fileType !== "image/jpeg") {
        handleError(new Error('The uploaded image is not a JPEG/JPG file.'));

        e.target.value = ''; // Reset the input
        if (faceFileTriggerEl.current) faceFileTriggerEl.current.textContent = faceFileTriggerElDefaultText;
      } else {
        if (faceFileTriggerEl.current) faceFileTriggerEl.current.textContent = fileName;
      }
    }
  }

  const handleRegisterForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    playerRegister(
      formData,
      () => {
        setActivePanel(false);
        playerLogin(
          username,
          password,
          (storage) => {
            onGameStart(storage)
            handleError(null)
          },
          (error: Error) => handleError(error)
        )
      },
      (error: Error) => handleError(error)
    )
  };

  return (
    <>
      <form
        className="flex flex-col items-center justify-center w-full h-full text-sm text-left gap-y-4"
        onSubmit={handleRegisterForm}
      >
        <p className='text-md font-wrongun'>
          Create a new account
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

          <div className="flex items-center justify-between gap-x-2">
            <p>Email: </p>
            <input
              className='w-full'
              name="email"
              type="email"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-x-2">
            <p>Face: </p>

            <div className='w-full h-fit'>
              <label
                htmlFor="face"
                className="custom-file-upload"
                ref={faceFileTriggerEl}
              >
                  {faceFileTriggerElDefaultText}
              </label>
              <input
                className='w-full'
                id='face'
                name="face"
                type="file"
                accept="image/jpeg"
                onChange={handleFaceFileChange}
                required
              />
            </div>
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
            Register
          </button>

          <button
            className='w-16 button button--primary'
            onClick={() => navigate('/terminal')}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default RegistrationPanel;
