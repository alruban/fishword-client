import { Box3, Object3D, Quaternion, Vector3 } from 'three';
import Component from '../world/component';

export default class ModelPhysics extends Component {
  private physics: Ammo.btDiscreteDynamicsWorld;
  private model: Object3D;

  public body: Ammo.btRigidBody | null = null;
  public name: string = "Physics";

  private storage: PlayerStorage;
  private enmat: Enmat;
  private mass: number = 5; // The player's mass, adjustable.

  constructor(physics: Ammo.btDiscreteDynamicsWorld, model: Object3D, storage: PlayerStorage, enmat: Enmat, name?: string) {
    super();
    this.physics = physics;
    this.model = model;
    this.storage = storage;
    this.enmat = enmat;

    if (name) this.name = name;
  }

  initialise(): void {
    this.setupPhysicsBody();
  }

  private setupPhysicsBody(): void {
    const { position, quaternion } = this.storage.state.location.player;
    const transform = this.createTransform(new Vector3(position.x, position.y, position.z), new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    const shape = this.createCapsuleShape();
    const body = this.createRigidBody(transform, shape);

    this.applyPhysicalProperties(body);
    this.physics.addRigidBody(body);
    this.body = body;
  }

  private createTransform(position: Vector3, quaternion: Quaternion): Ammo.btTransform {
    const transform = new this.enmat.ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new this.enmat.ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(new this.enmat.ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    return transform;
  }

  private createCapsuleShape(): Ammo.btCapsuleShape {
    const boundingBox = new Box3().setFromObject(this.model);
    const size = new Vector3();
    boundingBox.getSize(size);
    const height = size.y - (size.x > size.z ? size.x : size.z);
    const radius = size.x / 1.5;

    return new this.enmat.ammo.btCapsuleShape(radius, height);
  }

  private createRigidBody(transform: Ammo.btTransform, shape: Ammo.btCollisionShape): Ammo.btRigidBody {
    const localInertia = new this.enmat.ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(this.mass, localInertia);

    const motionState = new this.enmat.ammo.btDefaultMotionState(transform);
    const bodyInfo = new this.enmat.ammo.btRigidBodyConstructionInfo(this.mass, motionState, shape, localInertia);
    return new this.enmat.ammo.btRigidBody(bodyInfo);
  }

  private applyPhysicalProperties(body: Ammo.btRigidBody): void {
    body.setFriction(0.5);
    body.setActivationState(4); // DISABLE_DEACTIVATION to keep the object always active.

    // Apply buoyant force if needed and adjust damping for water resistance.
    const buoyancyForce = new this.enmat.ammo.btVector3(0, this.calculateBuoyantForce(), 0);
    body.applyCentralForce(buoyancyForce);
    body.setDamping(0.8, 0.5); // Adjust these values as necessary.
  }

  private calculateBuoyantForce(): number {
    const gravity = this.physics.getGravity();
    return Math.abs(gravity.y()) * this.mass * 1.1; // Example buoyancy calculation
  }

  // Simplified velocity setting, avoiding creating new Ammo objects in each call
  setVelocity(velocity: Vector3): void {
    if (this.body) {
      this.body.setLinearVelocity(new this.enmat.ammo.btVector3(velocity.x, velocity.y, velocity.z));
    }
  }

  // Added a dispose method for cleanup
  dispose(): void {
    if (this.body) {
      if (this.physics && this.body) {
        this.physics.removeRigidBody(this.body);
        if (this.body.getMotionState()) this.enmat.ammo.destroy(this.body.getMotionState());
        this.enmat.ammo.destroy(this.body);
      }
      this.body = null;
    }
  }
}
