import React, { useState } from "react";
import type { World } from "../../../../world";
import LogoutButton from "./interactions/buttons/LogoutButton";
import SettingsButton from "./interactions/buttons/SettingsButton";
import Interactor from "./interactions/Interactor";
import InventoryButton from "./interactions/buttons/InventoryButton";

interface InteractionPanelProps {
  world: World;
  onGameEnd: () => void; // Callback to handle game end
}

const InteractionPanel: React.FC<InteractionPanelProps> = ({world, onGameEnd}) => {
  const [activeInteractor, setActiveInteractor] = useState<Interactors>('inventory');

  const onButtonChange = (interactor: Interactors) => {
    setActiveInteractor(interactor);
  };

  return (
    <div className="select-none">
      <div className="flex flex-col justify-between border border-solid border-key-yellow-inactive p-3 rounded-lg bg-key-black-lighter gap-y-2 min-h-18 max-w-[23.6rem]">
        <div className="flex gap-x-2 w-fit">
          <div className="key key--yellow"></div>
          <div className="key key--yellow"></div>
          <InventoryButton
            world={world}
            onInventoryToggled={onButtonChange}
            isActive={activeInteractor === 'inventory'}
          />
          <div className="key key--yellow"></div>
          <div className="key key--yellow"></div>
        </div>

        <Interactor
          world={world}
          activeInteractor={activeInteractor}
        />

        <div className="flex gap-x-2 w-fit">
          <div className="key key--yellow"></div>
          <SettingsButton
            world={world}
            onSettingsToggled={onButtonChange}
            isActive={activeInteractor === 'settings'}
          />
          <LogoutButton
            onGameEnd={onGameEnd}
            world={world}
          />
          <div className="key key--yellow"></div>
          <div className="key key--yellow"></div>
        </div>
      </div>
    </div>
  )
}

export default InteractionPanel;
