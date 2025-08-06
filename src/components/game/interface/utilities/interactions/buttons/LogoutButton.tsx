import React, { useState } from "react";
import type { World } from "../../../../../../world";
import { playerLogout } from "../../../../../db/db";

interface LogoutButtonProps {
  world: World;
  onGameEnd: () => void; // Callback to handle game end
}

const LogoutButton: React.FC<LogoutButtonProps> = ({world, onGameEnd}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleGameEnd = () => {
    world.destroy();
    setIsVisible(false);
    onGameEnd();
  }

  if (!isVisible) return null;

  return (
    <button
      className="flex-col key key--red key--red--active"
      onClick={() => playerLogout(handleGameEnd)}
    >
      <span className="flex h-fit">LOG</span>
      <span className="flex h-fit">OUT</span>
    </button>
  )
}

export default LogoutButton;
