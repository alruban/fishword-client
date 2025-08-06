import Component from "../../world/component";
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  Object3D,
  Scene
} from "three";
import OceanMaterials from "./materials";

export default class Ocean extends Component {
  public name: string = 'Ocean';

  private model: Object3D;
  private scene: Scene;

  public surface = new Mesh();
  public volume = new Mesh();

  constructor(model: Object3D, scene: Scene) {
    super();

    this.model = model;
    this.scene = scene;
  }

  initialise(): void {
    const halfSize = 500;
    const depth = 1000;

    const surfaceVertices = new Float32Array([
      -halfSize, 0, -halfSize,
      halfSize, 0, -halfSize,
      -halfSize, 0, halfSize,
      halfSize, 0, halfSize
    ]);

    const surfaceIndices = [
      2, 3, 0,
      3, 1, 0
    ];

    const surfaceGeometry = new BufferGeometry();
    surfaceGeometry.setAttribute("position", new BufferAttribute(surfaceVertices, 3));
    surfaceGeometry.setIndex(surfaceIndices);

    this.surface.geometry = surfaceGeometry;

    const oceanMaterials = this.parent?.getComponent('OceanMaterials') as OceanMaterials;
    this.surface.material = oceanMaterials.surface;

    const volumeVertices = new Float32Array([
      -halfSize, -depth, -halfSize,
      halfSize, -depth, -halfSize,
      -halfSize, -depth, halfSize,
      halfSize, -depth, halfSize,

      -halfSize, 0, -halfSize,
      halfSize, 0, -halfSize,
      -halfSize, 0, halfSize,
      halfSize, 0, halfSize
    ]);

    const volumeIndices = [
      2, 3, 0, 3, 1, 0,
      0, 1, 4, 1, 5, 4,
      1, 3, 5, 3, 7, 5,
      3, 2, 7, 2, 6, 7,
      2, 0, 6, 0, 4, 6
    ];

    const volumeGeometry = new BufferGeometry();
    volumeGeometry.setAttribute("position", new BufferAttribute(volumeVertices, 3));
    volumeGeometry.setIndex(volumeIndices);

    this.volume.geometry = volumeGeometry;
    this.volume.material = oceanMaterials.volume;

    this.volume.parent = this.surface;
    this.surface.add(this.volume);
    this.surface.name = this.name;

    this.scene.add(this.surface);
  }

  async update(deltaTime: number) {
    this.surface.position.set(this.model.position.x, 0, this.model.position.z);
  }

  setStaticCollider(mesh: Mesh): void {
    // const shape = this.enmat.createConvexHullShape(mesh);
    // const mass = 0;
    // const transform = new this.enmat.ammo.btTransform();
    // transform.setIdentity();
    // const motionState = new this.enmat.ammo.btDefaultMotionState(transform);

    // const localInertia = new this.enmat.ammo.btVector3(0,0,0);
    // const rbInfo = new this.enmat.ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    // const object = new this.enmat.ammo.btRigidBody(rbInfo)

    // object.parentEntity = this.parent;
    // object.mesh = mesh;

    // this.physics.addRigidBody(object);
  }
}
