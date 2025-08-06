type Enmat = {
  ammo: typeof Ammo
  createConvexHullShape: (object: THREE.Object3D) => Ammo.btConvexHullShape,
  createConvexGeom: (object: THREE.Object3D) => THREE.BufferGeometry,
}

type Players = {
  [x: string]: PlayerStorage
}

type PlayerStorage = {
  isLoggedIn: boolean;
  state: PlayerState;
  socket: string;
}

type PlayerState = {
  id: number,
  name: string,
  location: PlayerLocation,
  inventory: {},
  last_login: string
  face: string // Base64
}

type PlayerLocation = {
  player: LocationCollection;
  camera: LocationCollection;
};

type PlayerMessage = {
  type: 'local' | 'world' | 'error';
  content: string;
  from: string;
  id: number;
  time: string;
}

type Bearing = {
  degrees: number;
  quaternion: {
    x: number,
    y: number,
    z: number,
    w: number,
  },
  position: {
    x: number,
    y: number,
    z: number,
  }
};

type LocationCollection = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number, w: number };
}

type Interactors = 'inventory' | 'settings'
