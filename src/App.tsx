import React, { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg'

import Game from './components/game/Game';
import BootScreen from './components/site/interface/BootScreen';
import LoginPanel from './components/site/interface/LoginPanel';
import RecoveryPanel from './components/site/interface/RecoveryPanel';
import TerminalPanel from './components/site/interface/TerminalPanel';
import RegistrationPanel from './components/site/interface/RegistrationPanel';

import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, MeshBasicMaterial, Color } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const canvasPaths = ['/terminal', '/login', '/register', '/recovery', '/game'];
  const canvasWrapperEl = useRef<HTMLDivElement>(null);

  const [isAudioOn, setIsAudioOn] = useState(false);
  const [storage, setStorage] = useState({} as PlayerStorage);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'spinning' | 'not spinning'>('not spinning');

  const rendererRef = useRef<WebGLRenderer | null>(null);
  const audioRef = useRef(new Audio('./music/terminal.mp3'));
  const meshRef = useRef(null);

  useEffect(() => {
    if (!rendererRef.current) {
      const scene = new Scene();
      const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      canvasWrapperEl.current?.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      camera.position.z = 5;

      const ambientLight = new AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 1, 1);
      scene.add(directionalLight);

      const loader = new GLTFLoader();
      loader.load('../../../assets/model/model.gltf', (gltf) => {
        gltf.scene.scale.set(1, 1, 1);
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            const material = new MeshBasicMaterial({ color: new Color(0x06dc38), wireframe: true });
            // @ts-expect-error
            child.material = material;
            // @ts-expect-error
            meshRef.current = child;
          }
        });
        scene.add(gltf.scene);
      }, undefined, (error) => console.error(error));

      const animate = () => {
        requestAnimationFrame(animate);

        // Check if the GLTF model has been loaded
        if (scene.children.length > 0) {
          // Rotate the model continuously
          scene.children.forEach((child) => {
            // @ts-expect-error
            if (child.isGroup) { // Assuming the GLTF model is added as a Group
              child.rotation.x += 0.01;
              child.rotation.y += 0.01;
            }
          });
        }

        renderer.render(scene, camera);
      };

      animate();
    }
  }, [status, rendererRef.current]);

  useEffect(() => {
    let animationFrameId: number;

    const startColor = new Color(0x06dc38);
    const endColor = new Color(0xff0000);
    let startTime = performance.now();

    const animateColor = (time: number) => {
      if (loading && meshRef.current) {
        const elapsedTime = time - startTime;
        const duration = 2000; // Duration in milliseconds for one cycle

        // Normalized time fraction of the cycle
        let timeFraction = (elapsedTime % duration) / duration;
        let colorFraction = (1 - Math.cos(2 * Math.PI * timeFraction)) / 2; // Sine wave for smooth pulsing

        // @ts-expect-error
        meshRef.current.material.color.lerpColors(startColor, endColor, colorFraction);

        animationFrameId = requestAnimationFrame(animateColor);
      } else {
        if (meshRef.current) {
          // @ts-expect-error
          meshRef.current.material.color.set(0x06dc38); // Reset to original color
        }
      }
    };

    animationFrameId = requestAnimationFrame(animateColor);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading]);

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);

    if (!isAudioOn) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const startGame = (storage: PlayerStorage) => {
    setLoading(true);
    setStorage(storage);
    navigate('/game');
    setStatus('spinning')
  };

  const endGame = () => {
    setLoading(false);
    setStorage({} as PlayerStorage);
    navigate('/terminal');
    setStatus('not spinning')
  };

  const clearLoader = () => {
    rendererRef.current?.domElement.remove();
    rendererRef.current = null;
  };

  const panel = (content: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined) => [
    <React.Fragment key="panel-content">
      <div className="h-full px-5 py-10 lg:px-10 text-body">
        <div className="w-full h-full select-none">
          <div className="flex flex-col items-center justify-end w-full h-full">
            <div className="text-center z-1 bg-blue/90 lg:w-[39rem]">
              <div className='border border-solid rounded-lg terminal-panel-background cone-gradient-background text-background-tertiary border-background-tertiary'>
                <div className='terminal-panel-background--slow'>
                  <div className='py-6 terminal-panel-background--slower px-7'>
                    { content }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <a
        className='absolute w-5 h-5 bottom-4 left-8'
        onClick={toggleAudio}
      >
        {isAudioOn ? <ReactSVG src="./images/sound-on.svg" /> : <ReactSVG src="./images/sound-off.svg" />}
      </a>

      <small className='absolute text-sm text-right bottom-4 right-8 text-background-tertiary'>v0.0.0-alpha</small>
    </React.Fragment>
  ]

  return (
    <div className='h-full lg:p-2 lg:bg-base-primary'>
      <div className='lg:border-[25px] relative h-full rounded-lg lg:border-inset lg:border-base-secondary lg:rounded-lg lg:p-[1.8rem] bg-key-black-darker'>
        <div className='terminal terminal--computer'>
          <div
            className={`absolute inset-0 w-full h-full pointer-events-none ${canvasPaths.includes(location.pathname) ? '' : 'hidden'}`}
            ref={canvasWrapperEl}
          ></div>

          <Routes>
            <Route
              path="/"
              key={'route-1'}
              element={
                <div className="h-full px-5 py-10 lg:px-10 text-body">
                  <BootScreen
                    onComplete={() => navigate('/terminal')}
                  />
                </div>
              }
            />
            <Route
              path="/terminal"
              key={'route-2'}
              element={
                panel(
                  <TerminalPanel />
                )
              }
            />
            <Route
              path="/login"
              key={'route-3'}
              element={
                panel(
                  <LoginPanel
                    onClose={() => navigate('/terminal')}
                    onGameStart={startGame}
                  />
                )
              }
            />
            <Route
              path="/register"
              key={'route-4'}
              element={
                panel(
                  <RegistrationPanel
                    onClose={() => navigate('/terminal')}
                    onGameStart={startGame}
                  />
                )
              }
            />
            <Route
              path='/recovery'
              key={'route-5'}
              element={
                panel(
                  <RecoveryPanel
                    onClose={() => navigate('/terminal')}
                  />
                )
              }
            />
            <Route
              path='/game'
              key={'route-6'}
              element={
                <Game
                  storage={storage}
                  onGameEnd={endGame}
                  clearLoader={clearLoader}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
