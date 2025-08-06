import {
  Cache,
  Scene,
  CameraHelper,
  AudioListener,
  TextureLoader,
  WebGLRenderer,
  SRGBColorSpace,
  PCFSoftShadowMap,
  CubeTextureLoader,
  PerspectiveCamera,
  ReinhardToneMapping,
} from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

import Stats from 'three/examples/jsm/libs/stats.module';
import AmmoWrapper from './components/game/world/physics';
import AmmoDebugDrawer from './components/game/world/debug';

import Loop from './components/game/world/loop';
import Entity from './components/game/world/entity';
import Resizer from './components/game/world/resizer';
// import Navmesh from './components/game/level/navmesh';
import Component from './components/game/world/component';
// import Lighting from './components/game/level/lighting';
import Shaders from './components/game/level/shaders/shaders';
import EntityManager from './components/game/world/entityManager';

import Ocean from './components/game/level/ocean/ocean';
import OceanMaterials from './components/game/level/ocean/materials';

import Skybox from './components/game/level/skybox/skybox';
import SkyboxMaterials from './components/game/level/skybox/materials';

import PlayerAnimations from './components/game/models/player/animations';
import PlayerContent from './components/game/models/player/content';
import PlayerControls from './components/game/models/player/controls';
import PlayerPortrait from './components/game/models/player/portrait';

import InvaderContent from './components/game/models/invader/content';
import InvaderControls from './components/game/models/invader/controls';
import InvaderAnimations from './components/game/models/invader/animations';

import { Network } from './network/network';
import { Input } from './components/game/interface/input';

import { Socket } from 'socket.io-client';
import ModelPhysics from './components/game/models/physics';

type Loader = GLTFLoader | OBJLoader | TextureLoader;

type LoadedAssets = {
  [key: string]: LoadedAsset;
}

export type LoadedAsset = any;

interface Asset {
  loader: Loader;
  url: string | string[];
  name: string;
  data?: LoadedAsset;
}

export class World {
  private enmat: Enmat;
  private renderer: WebGLRenderer;
  private physics: Ammo.btDiscreteDynamicsWorld;
  private camera: PerspectiveCamera;
  private scene: Scene;
  public loop: Loop;
  private network: Network;
  private input: Input;
  private container: HTMLElement;
  private assets: LoadedAssets;
  private loaders = {
    gltf: new GLTFLoader(),
    obj: new OBJLoader(),
    texture: new TextureLoader(),
  }

  public entities: EntityManager;
  public player: PlayerStorage;
  public players: Players;
  public spinning: boolean;
  public socket: Socket;

  // Debuggers
  private debug = false; // Change this value to add debug utilities into the scene.
  private stats!: Stats
  private debugAmmo!: AmmoDebugDrawer
  private cameraHelper!: CameraHelper

  constructor(container: HTMLElement, enmat: Enmat, network: Network,) {
    this.enmat = enmat;

    this.renderer = this.createRenderer();
    this.physics = this.createPhysics();
    this.camera = this.createCamera();
    this.scene = this.createScene();

    this.loop = new Loop(this.camera, this.scene, this.renderer)
    this.entities = new EntityManager();
    this.network = network;
    this.input = new Input;

    this.players = this.network.players;
    this.player = this.network.player;
    this.socket = this.network.socket;
    this.container = container;
    this.spinning = true;
    this.assets = {};

    // Add Game Container Element
    this.container.append(this.renderer.domElement)

    // Add Camera to Scene
    this.scene.add(this.camera)

    // Initialise Resizer
    new Resizer(this.container, this.camera, this.renderer)
  }

  public async init() {
    this.setupTHREESettings();
    await this.setupWorld();
    await this.setupPlayer();
    await this.setupInvaders();
  }

  private setupTHREESettings() {
    Cache.enabled = true;
  }

  private createPhysics(): Ammo.btDiscreteDynamicsWorld {
    // Collision configuration setup for the physics world.
    // It provides algorithms for broadphase collision detection, which is the first step in detecting collisions.
    const collisionConfiguration = new this.enmat.ammo.btDefaultCollisionConfiguration();

    // Dispatcher for managing collision detection.
    // It uses the collision configuration to create an algorithm for dispatching collision pairs.
    const dispatcher = new this.enmat.ammo.btCollisionDispatcher(collisionConfiguration);

    // Broadphase interface for broad-phase collision detection.
    // It efficiently finds pairs of objects that are potentially colliding.
    const broadphase = new this.enmat.ammo.btDbvtBroadphase();

    // Solver for constraints and contact points.
    // It calculates the impulses and forces to apply for the physical interactions.
    const solver = new this.enmat.ammo.btSequentialImpulseConstraintSolver();

    // The discrete dynamics world is where the simulation happens.
    // It takes care of integrating the physics over time.
    const physics = new this.enmat.ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);

    // Sets the gravity for the entire physics world.
    // All rigid bodies in the world will be affected by this gravity unless explicitly exempted.
    // -15 is standard.
    physics.setGravity(new this.enmat.ammo.btVector3(0.0, 5, 0.0));

    // A callback function that gets called on every physics simulation tick.
    // It's a place to add custom logic that needs to run at each step of the simulation, such as applying forces.
    const physicsUpdateCallback = (world: any, timeStep: number) => this.physicsUpdate(world, timeStep);

    // Converts the JavaScript function into a C++ function pointer that Ammo.js can use.
    // This is necessary because Ammo.js is compiled from C++ and expects to call C++ functions.
    const fp = this.enmat.ammo.addFunction(physicsUpdateCallback, 'void(any,double)');

    // Sets the function to be called back at every simulation tick.
    // This allows integrating custom logic into the physics simulation loop.
    physics.setInternalTickCallback(fp, null, true);

    // Returns the configured physics world, ready for simulation.
    return physics;
  }

  private createCamera(): PerspectiveCamera {
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.add(new AudioListener())

    return camera;
  }

  private createRenderer(): WebGLRenderer {
    const renderer = new WebGLRenderer({ antialias: true })

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.toneMapping = ReinhardToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0xEEEEEE);

    return renderer
  }

  private createScene(): Scene {
    const scene = new Scene()
    return scene
  }

  private async assetLoader(assetsToLoad: Asset[]) {
    // Modify the loadAsset function to handle both single URLs and arrays
    const loadAsset = async (loader: Loader, url: string | string[], name: string): Promise<LoadedAsset> => {
      try {
        // Check if the loader is an instance of CubeTextureLoader and the url is an array
        if (loader instanceof CubeTextureLoader && Array.isArray(url)) {
          const data = await loader.loadAsync(url); // loadAsync expects an array of strings for CubeTextureLoader
          return data;
        } else if (typeof url === 'string') {
          // @ts-ignore
          const data = await loader.loadAsync(url); // For other loaders, url is expected to be a string
          return data;
        } else {
          throw new Error(`Invalid URL type for asset '${name}'.`);
        }
      } catch (error) {
        console.error(`Error loading ${name}:`, error);
        throw error;
      }
    };

    // Process each asset to load
    const assetPromises = assetsToLoad.map(asset => loadAsset(asset.loader, asset.url, asset.name));

    await Promise.all(assetPromises).then((loadedAssets) => {
      loadedAssets.forEach((data, index) => {
        const name = assetsToLoad[index]?.name;
        if (name) this.assets[name] = data;
      });
    }).catch(error => console.error('Error loading assets:', error));
  }

  private createEntity(components: Component[], name: string): any {
    const entity = new Entity();
    entity.setName(name);
    components.forEach((component) => entity.addComponent(component))
    return entity;
  }

  private async setupWorld() {
    const assetsToLoad: Asset[] = [
      { loader: this.loaders.obj, url: './assets/navmesh.obj', name: 'navmesh'},
      { loader: this.loaders.gltf, url: './assets/model/model_faceless.gltf', name: 'player'}
    ];

    await this.assetLoader(assetsToLoad);

    const cShaders = new Shaders();

    const cSkybox = new Skybox(this.camera, this.scene);
    const cSkyboxMaterials = new SkyboxMaterials();

    const cOcean = new Ocean(this.assets.player.scene, this.scene);
    const cOceanMaterials = new OceanMaterials(this.entities, this.camera);

    // const cNavmesh = new Navmesh(this.scene, this.assets?.navmesh);
    // const cLighting = new Lighting(this.scene);

    const settingsComponents  = [cShaders] as Component[];
    const skyboxComponents = [cSkyboxMaterials, cSkybox] as Component[];
    const worldComponents = [cOceanMaterials, cOcean] as Component[];
    // const lightingComponents = [cLighting] as Component[];

    const settings = this.createEntity(settingsComponents, 'settings');
    const skybox = this.createEntity(skyboxComponents, 'skybox');
    const ocean = this.createEntity(worldComponents, 'ocean');
    // const lighting = this.createEntity(lightingComponents, 'lighting');

    this.entities.add(settings)
    this.entities.add(skybox);
    this.entities.add(ocean);
    // this.entities.add(lighting);

    this.entities.initialise();
  }

  private async setupPlayer() {
    const cPlayerPhysics = new ModelPhysics(this.physics, this.assets.player.scene, this.player, this.enmat, 'PlayerPhysics');
    const cPlayerControls = new PlayerControls(this.camera, this.scene, this.assets.player.scene, this.player, this.network, this.renderer.domElement, this.input, this.enmat);
    const cPlayerContent = new PlayerContent(this.assets.player, this);
    const cPlayerAnimations = new PlayerAnimations(this.assets.player, this.input);
    const cPlayerPortrait = new PlayerPortrait(this.renderer, this.assets.player.scene, this.scene);

    const playerComponents = [
      cPlayerPhysics,
      cPlayerControls,
      cPlayerContent,
      cPlayerAnimations,
      cPlayerPortrait,
    ];

    const player = this.createEntity(playerComponents, 'player');

    this.entities.add(player);
    this.entities.initialise();
  }

  private async setupInvaders() {
    const addInvader = async (invaderStorage: PlayerStorage) => {
      const assetsToLoad: Asset[] = [
        { loader: this.loaders.gltf, url: './assets/model/model.gltf', name: `invader-${invaderStorage.state.id}`}
      ];

      await this.assetLoader(assetsToLoad);

      const invaderRef = `invader-${invaderStorage.state.id}`;
      const invaderAsset = this.assets[invaderRef];

      const cInvaderPhysics = new ModelPhysics(this.physics, invaderAsset.scene, invaderStorage, this.enmat, 'InvaderPhysics');
      const cInvaderControls = new InvaderControls(this.camera, this.scene, invaderAsset.scene, invaderStorage, this.network, this.enmat);
      const cInvaderContent = new InvaderContent(invaderAsset, this, invaderStorage);
      const cInvaderAnimations = new InvaderAnimations(invaderAsset, this.input);

      const invaderComponents = [cInvaderPhysics, cInvaderControls, cInvaderContent, cInvaderAnimations];
      const invader = this.createEntity(invaderComponents, invaderRef);

      this.entities.add(invader);
      this.entities.initialise();
    }

    // Handle Other Players
    for (const id in this.network.players) {
      if (Number(id) !== this.player.state.id) {
        const invaderStorage = this.network.players[id] as PlayerStorage;
        await addInvader(invaderStorage)
      }
    }

    this.network.socket.on("player:new", async (invaderStorage: PlayerStorage) => {
      // Ensures the invader is not the current player.
      if (invaderStorage.state.id !== this.player.state.id) {
        await addInvader(invaderStorage)
        console.log("An invader has entered fishworld");
      }
    });

    this.network.socket.on("player:left", (id) => {
      if (Number(id) !== this.player.state.id) {
        const invaderRef = `invader-${id}`;
        const invader = this.entities.get(invaderRef);
        const cInvaderPhysics = invader?.getComponent('InvaderPhysics');

        cInvaderPhysics?.dispose();
        this.entities.remove(invaderRef);

        console.log("An invader has left fishworld");
        delete this.assets[invaderRef];
      }
    });
  }

  private debuggers(command: 'start' | 'update' | 'stop') {
    if (this.debug) {
      switch(command) {
        case 'start':
          this.debugAmmo = new AmmoDebugDrawer(this.enmat, this.scene, this.physics);
          this.debugAmmo.enable();
          this.cameraHelper = new CameraHelper(this.camera);
          this.stats = new Stats();
          this.stats.dom.classList.add("!left-[51rem]", "!bottom-[26rem]", "!top-unset", "-translate-x-1/2")
          document.body.appendChild(this.stats.dom);
          break;
        case 'update':
          this.debugAmmo.update();
          this.stats.update();
          this.cameraHelper.update();
          break;
        case 'stop':
          this.debugAmmo.disable();
          this.cameraHelper.dispose();
          this.stats.end();
          this.stats.dom.remove();
          break;
      }
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }

  public start() {
    this.loop.start()
    this.debuggers('start');
    this.loop.updatables.push(this);
    this.container.classList.remove("invisible");
    document.body.classList.remove('game-loaded');
  }

  private update() {
    this.physics.stepSimulation(this.loop.time, 10);
    this.entities.update(this.loop.time);
    this.updateObjects();
    this.render();
    this.debuggers('update');
  }

  private updateObjects() {
    this.players = this.network.players;
    this.player = this.network.player;
  }

  private physicsUpdate(world: any, time: number) {
    this.entities.physicsUpdate(world, time)
  }

  public stop() {
    this.loop.stop()
  }

  public destroy() {
    this.stop();
    this.debuggers('stop');
    this.renderer.dispose();
    this.input.clearEventListeners();
    this.spinning = false;
    document.body.classList.remove('game-loaded');

    const container = this.renderer.domElement?.parentElement;
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }
}

export const createWorld = async (container: HTMLElement, storage: PlayerStorage): Promise<World> => {
  return new Promise((resolve, reject) => {
    if (!container || container.hasChildNodes()) {
      reject(new Error('Game container not found or already initialized.'));
      return;
    }

    const network = new Network(storage);

    // Listen for the custom event before initializing the world
    const onPlayersInitialized = async () => {
      network.eventTarget.removeEventListener('network:initialised', onPlayersInitialized);

      AmmoWrapper.initialise(async (enmat: Enmat) => {
        const world = new World(container, enmat, network);

        await world.init()
          .then(() => {
            world.start(); // Begin animation loop
            resolve(world); // Resolve the promise with the world instance
          })
          .catch((err) => reject(err));
      });
    };

    network.eventTarget.addEventListener('network:initialised', onPlayersInitialized);
  });
};
