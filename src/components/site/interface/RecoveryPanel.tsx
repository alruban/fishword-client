import React, { useState, useEffect } from 'react';
import { playerLogin, playerRegister } from '../../db/db';
import { useNavigate } from 'react-router-dom';

// Define the props interface
interface RecoveryPanelProps {
  onClose: () => void;
}

const RecoveryPanel: React.FC<RecoveryPanelProps> = ({ onClose }) => {
  const [activePanel, setActivePanel] = useState(true);
  const navigate = useNavigate();

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

  const handleRecoveryForm = async (e: React.FormEvent<HTMLFormElement>) => {
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
          () => navigate('/game')
        )
      }
    )
  };

  return (
    <>
      <div className='pb-5 text-md font-wrongun'>
        <p>Enter your username to recover your account</p>
      </div>

      <form
        className="flex flex-col items-center justify-center w-full h-full gap-3 text-sm text-left"
        onSubmit={handleRecoveryForm}
      >
        <div className="flex justify-between gap-x-2">
          <p>Username: </p>
          <input
            name="username"
            type="text"
            required
          />
        </div>

        <div className='flex gap-x-2'>
          <button
            className='w-16 button button--primary'
            type='submit'
          >
            Recover
          </button>

          <button
            className='w-16 button button--primary'
            onClick={() => navigate('/login')}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default RecoveryPanel;
