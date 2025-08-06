import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { World } from '../../../../world';

export type MobileViewerState = 'pda' | 'chat';

interface MobileViewChangerProps {
  world: World;
  viewChange(view: MobileViewerState): void
}

const MobileViewChanger: React.FC<MobileViewChangerProps> = ({ world, viewChange }) => {
  const [currentTab, setCurrentTab] = useState<MobileViewerState>('chat');

  const handleViewChange = (view: MobileViewerState) => {
    setCurrentTab(view);
    viewChange(view);
  }

  return (
    <div className='w-full'>
      <div className='relative flex flex-col p-2 border border-solid rounded-lg w-fit gap-y-2 z-1 bg-key-black-darker border-key-yellow-inactive'>
        <button
          className={`key key--yellow ${currentTab === 'chat' ? 'key--yellow--active' : ''}`}
          onClick={() => handleViewChange('chat')}
          type='button'
        >
          Chat
        </button>
        <button
          className={`key key--blue ${currentTab === 'pda' ? 'key--blue--active' : ''}`}
          onClick={() => handleViewChange('pda')}
          title='/local'
          type='button'
        >
          PDA
        </button>
      </div>
    </div>
  );
};

export default MobileViewChanger;
