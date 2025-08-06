import React from 'react';
import { useNavigate } from 'react-router-dom';

const TerminalPanel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className='pb-5 font-wrongun'>
        <h1>FISHWORLD</h1>
      </div>

      <div className='flex flex-col items-center justify-center gap-2 lg:flex-row'>
        <button
          className='w-16 button button--primary'
          onClick={() => navigate('/register')}
        >
          New User
        </button>

        <button
          className='w-16 button button--primary'
          onClick={() => navigate('/login')}
        >
          Existing User
        </button>
      </div>
    </>
  );
};

export default TerminalPanel;
