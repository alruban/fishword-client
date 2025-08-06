import React from "react";
import type { World } from "../../../../../../world";
import { ReactSVG } from "react-svg";

interface SettingsButtonProps {
  world: World;
  onSettingsToggled: (state: Interactors) => void;
  isActive: boolean;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({world, onSettingsToggled, isActive}) => {
  return (
    <button
      className={`flex-col key key--yellow ${isActive ? 'key--yellow--active' : ''}`}
      onClick={() => onSettingsToggled('settings')}
    >
      <ReactSVG src="./images/settings.svg" />
    </button>
  )
}

export default SettingsButton;
