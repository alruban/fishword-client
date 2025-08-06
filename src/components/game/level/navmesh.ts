import Component from '../world/component';
import { Pathfinding } from 'three-pathfinding';
import { Scene, Mesh, Vector3 } from 'three';

export default class Navmesh extends Component {
  scene: Scene;
  name: string;
  zone: string;
  mesh: Mesh;
  pathfinding: any;

  constructor(scene: Scene, mesh: Mesh) {
    super();
    this.scene = scene;
    this.name = "navmesh";
    this.zone = "world";
    this.mesh = mesh;
  }

  initialise(): void {
    this.pathfinding = new Pathfinding();

    this.mesh.traverse((node: any) => {
      if (node.isMesh) this.pathfinding.setZoneData(this.zone, Pathfinding.createZone(node.geometry));
    });
  }

  getRandomNode(p: Vector3, range: number): Vector3 {
    const groupID = this.pathfinding.getGroup(this.zone, p);
    return this.pathfinding.getRandomNode(this.zone, groupID, p, range);
  }

  findPath(a: Vector3, b: Vector3): Vector3[] {
    const groupID = this.pathfinding.getGroup(this.zone, a);
    return this.pathfinding.findPath(a, b, this.zone, groupID);
  }
}
