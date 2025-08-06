import React, { useEffect, useRef, useState } from 'react';

import type { World } from '../../world';
import { createWorld } from '../../world';
import { checkSessionAndLoginAutomatically } from '../db/db';
import { useNavigate } from 'react-router-dom';

import Interface from './interface/Interface';

interface GameProps {
  storage: PlayerStorage;
  onGameEnd: () => void; // Callback to handle game end
  clearLoader: () => void; // Callback to handle removal of loader
}

const Game: React.FC<GameProps> = ({ storage, onGameEnd, clearLoader }) => {
  const container = useRef<HTMLDivElement | null>(null);
  const [world, setWorld] = useState<World>({} as World); // Track if the game has been initialized
  const [playerStorage, setPlayerStorage] = useState<PlayerStorage>({} as PlayerStorage);
  const navigate = useNavigate();

  /** Use the session validation api */
  useEffect(() => {
    if (container.current && !storage.isLoggedIn && !world.spinning) {
      checkSessionAndLoginAutomatically(
        (storage) => startGame(container.current, storage), // On Success (The player is logged in, start the game)
        () => navigate('/terminal') // On Failure (The player isn't logged in, return to the terminal)
      );
    }
  }, [container, storage.isLoggedIn]);

  useEffect(() => {
    if (container.current && storage.isLoggedIn && !world.spinning) startGame(container.current, storage);
  }, [container, storage]);

  const startGame = (container: HTMLDivElement | null, storage: PlayerStorage) => {
    if (!container) return;
    setPlayerStorage(storage)
    createWorld(container, storage)
    .then(createdWorld => {
      setWorld(createdWorld);
      clearLoader();
    })
    .catch(error => {
      console.error(error);
      // TODO: Handle the error appropriately.
      onGameEnd();
    });
  }

  return (
    <>
      {world.spinning && playerStorage.isLoggedIn ? <Interface world={world} storage={playerStorage} onGameEnd={onGameEnd} /> : null}
      <div
        className="w-full h-full"
        ref={container}
      />
    </>
  );
};

export default Game;
