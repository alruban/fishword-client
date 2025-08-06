import React from "react";
import type { World } from "../../../../../world";
import SettingsInteractor from "./interactors/SettingsInteractor";
import InventoryInteractor from "./interactors/InventoryInteractor";

interface InteractorProps {
  world: World;
  activeInteractor: Interactors
}

const Interactor: React.FC<InteractorProps> = ({world, activeInteractor}) => {
  return (
    <div className="flex-grow p-2 border border-solid rounded-lg text-key-yellow-active font-creep bg-key-black-darker border-key-yellow-inactive">
      {activeInteractor === 'inventory' ? <InventoryInteractor world={world} /> : ''}
      {activeInteractor === 'settings' ? <SettingsInteractor world={world} /> : ''}
    </div>
  )
}

export default Interactor;
