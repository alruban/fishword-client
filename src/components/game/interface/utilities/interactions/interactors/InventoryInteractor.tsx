import React from "react";
import { World } from "../../../../../../world";

interface InventoryInteractorProps {
  world: World
}

const InventoryInteractor: React.FC<InventoryInteractorProps> = ({world}) => {

  return (
    <>
      <p className="w-full text-center text-md">
        INVENTORY
      </p>

      <hr className="bg-key-yellow-active"/>
    </>
  )
}

export default InventoryInteractor;
