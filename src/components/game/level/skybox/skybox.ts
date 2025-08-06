import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  MathUtils,
  Matrix3,
  Mesh,
  Scene,
  Uniform,
  Vector3
} from "three";

import Component from '../../world/component';
import SkyboxMaterials from "./materials";

export const dirToLight = new Vector3();
export const rotationMatrix = new Uniform(new Matrix3());

export default class Skybox extends Component {
  public name: string = 'Skybox';

  public camera: Camera;
  public scene: Scene;

  public skybox = new Mesh();

  public halfSize = 1500;
  public speed = 0.015;
  public initial = new Vector3(0, 1, 0);
  public axis = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(-30));
  public angle = -1;

  constructor(camera: Camera, scene: Scene) {
    super();

    this.camera = camera;
    this.scene = scene;
  }

  initialise() {
    const skyboxMaterials = this.parent?.getComponent('SkyboxMaterials') as SkyboxMaterials;

    dirToLight.copy(this.initial);

    const vertices = new Float32Array([
      -this.halfSize, -this.halfSize, -this.halfSize,
      this.halfSize, -this.halfSize, -this.halfSize,
      -this.halfSize, -this.halfSize, this.halfSize,
      this.halfSize, -this.halfSize, this.halfSize,

      -this.halfSize, this.halfSize, -this.halfSize,
      this.halfSize, this.halfSize, -this.halfSize,
      -this.halfSize, this.halfSize, this.halfSize,
      this.halfSize, this.halfSize, this.halfSize
    ]);

    const indices = [
      2, 3, 0, 3, 1, 0,
      0, 1, 4, 1, 5, 4,
      1, 3, 5, 3, 7, 5,
      3, 2, 7, 2, 6, 7,
      2, 0, 6, 0, 4, 6,
      4, 5, 6, 5, 7, 6
    ];

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(vertices, 3));
    geometry.setAttribute("coord", new BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    this.skybox.geometry = geometry;
    this.skybox.material = skyboxMaterials.material;

    this.setSkyRotationMatrix(this.angle);
    this.initial.applyMatrix3(rotationMatrix.value);
    dirToLight.set(-this.initial.x, this.initial.y, -this.initial.z);
    this.initial.set(0, 1, 0);

    this.scene.add(this.skybox)
  }

  async update(deltaTime: number) {
    this.angle += deltaTime * this.speed;
    this.setSkyRotationMatrix(this.angle);
    this.initial.applyMatrix3(rotationMatrix.value);
    dirToLight.set(-this.initial.x, this.initial.y, -this.initial.z);
    this.initial.set(0, 1, 0);
    this.skybox.position.copy(this.camera.position);
  }

  setSkyRotationMatrix(angle: number) {
    const cos = Math.cos(angle);
    const cos1 = 1 - cos;
    const sin = Math.sin(angle);
    const u = this.axis;
    const u2 = this.axis.clone().multiply(this.axis);
    rotationMatrix.value.set(
      cos + u2.x * cos1, u.x * u.y * cos1 - u.z * sin, u.x * u.z * cos1 + u.y * sin,
      u.y * u.x * cos1 + u.z * sin, cos + u2.y * cos1, u.y * u.z * cos1 - u.x * sin,
      u.z * u.x * cos1 - u.y * sin, u.z * u.y * cos1 + u.x * sin, cos + u2.z * cos1
    );
  }
}
