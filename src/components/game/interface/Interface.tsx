import React, { useRef, useEffect, useState } from "react";
import type { World } from "../../../world";

import ChatBox from "./utilities/ChatBox";
import Compass from "./utilities/Compass";
import UserPortrait from "./utilities/UserPortrait";
import InteractionPanel from "./utilities/InteractionPanel";
import MobileViewChanger, { MobileViewerState } from "./utilities/MobileViewChanger";

interface InterfaceProps {
  world: World;
  storage: PlayerStorage;
  onGameEnd: () => void; // Callback to handle game end
}

const Interface: React.FC<InterfaceProps> = ({ world, storage, onGameEnd }) => {
  const handleOnGameEnd = () => onGameEnd();
  const interfaceEl = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<MobileViewerState>('chat')

  const handleMobileViewChange = (view: MobileViewerState) => {
    setMobileView(view)
  }

  useEffect(() => {
    const handleOnContextMenu = (event: Event) => event.preventDefault();
    const handleTouch = (event: TouchEvent) => event.preventDefault();
    const handleTouchEngagement = (event: TouchEvent) => {
      const target = event.target as HTMLElement;
      if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA' && target?.tagName !== 'SELECT') {
        event.preventDefault()
      }
    };

    if (interfaceEl.current) {
      // Attach the event listener as non-passive
      document.addEventListener('oncontextmenu', handleOnContextMenu, { passive: false });
      // interfaceEl.current.addEventListener('touchmove', handleTouch, { passive: false });
      // interfaceEl.current.addEventListener('touchstart', handleTouchEngagement, { passive: false });
      // interfaceEl.current.addEventListener('touchend', handleTouchEngagement, { passive: false });
    }

    // Cleanup function to remove the event listener
    return () => {
      if (interfaceEl.current) {
        document.removeEventListener('oncontextmenu', handleOnContextMenu);
        // interfaceEl.current.removeEventListener('touchmove', handleTouch);
        // interfaceEl.current.removeEventListener('touchstart', handleTouchEngagement);
        // interfaceEl.current.removeEventListener('touchend', handleTouchEngagement);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div
      className="font-wrongun"
      ref={interfaceEl}
    >
      <div
        className="absolute top-0 left-0 p-3 z-1 bg-key-black-darker"
        style={{
          borderRadius: '0 0 1rem 0'
        }}
      >
        <UserPortrait world={world} />
      </div>

      <div
        className="absolute top-0 right-0 flex p-3 z-1 bg-key-black-darker"
        style={{
          borderRadius: '0 0 0 1rem'
        }}
      >
        <Compass world={world} />
      </div>

      <div
        className="absolute right-0 p-3 bottom-1/2 bg-key-black-darker z-1 lg:hidden"
        style={{
          borderRadius: '1rem 0 0 1rem'
        }}
      >
        <MobileViewChanger
          world={world}
          viewChange={ handleMobileViewChange}
        />
      </div>

      <div
        className={`absolute bottom-0 left-0 justify-between w-full p-3 bg-key-black-darker lg:max-w-[60rem] z-1 ${mobileView === 'chat' ? 'flex' : 'max-lg:hidden flex'}`}
        style={{
          borderRadius: '0 1rem 0 0'
        }}
      >
        <ChatBox
          socket={world.socket}
          storage={storage}
        />
      </div>

      <div
        className={`absolute bottom-0 right-0 p-3 bg-key-black-darker z-1 ${mobileView === 'pda' ? 'flex' : 'max-lg:hidden flex'}`}
        style={{
          borderRadius: '1rem 0 0 0'
        }}
      >
        <InteractionPanel
          onGameEnd={handleOnGameEnd}
          world={world}
        />
      </div>
    </div>
  )
}

export default Interface;
