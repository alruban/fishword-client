import React from "react";
import type { World } from "../../../../../../world";
import { ReactSVG } from "react-svg";

interface InventoryButtonProps {
  world: World;
  onInventoryToggled: (state: Interactors) => void;
  isActive: boolean;
}

const InventoryButton: React.FC<InventoryButtonProps> = ({world, onInventoryToggled, isActive}) => {
  return (
    <button
      className={`flex-col key key--yellow ${isActive ? 'key--yellow--active' : ''}`}
      onClick={() => onInventoryToggled('inventory')}
    >
      <ReactSVG src="./images/inventory.svg" />
    </button>
  )
}

export default InventoryButton;
