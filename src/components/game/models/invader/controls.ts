import { Camera, Quaternion, Scene, Sprite, Vector3 } from 'three';
import Component from '../../world/component';
import { Network } from '../../../../network/network';
import { createTextSprite, updateSpritePosition } from '../../interface/utilities/TextSprite';
import InvaderPhysics from '../physics';

export default class InvaderControls extends Component {
  // Info
  public name: string = 'InvaderControls';

  // Phsyics
  private lastModelQuaternion: Quaternion = new Quaternion();
  private invaderPhysicsBody!: Ammo.btRigidBody;
  private transform!: Ammo.btTransform;

  // Nametag
  private nametagSprite!: Sprite;
  public showNametagSprite: boolean = true;

  // Messaging
  private lastMessageSprite!: Sprite;
  private messageSprite!: Sprite;

  // Parents
  private camera: Camera;
  private scene: Scene;
  private model: any;
  private invaderStorage: PlayerStorage;
  private network: Network;
  private enmat: Enmat;

  constructor(camera: Camera, scene: Scene, model: any, invaderStorage: PlayerStorage, network: Network, enmat: Enmat) {
    super();

    this.camera = camera;
    this.scene = scene;
    this.model = model;
    this.invaderStorage = invaderStorage;
    this.network = network;
    this.enmat = enmat;
  }

  initialise(): void {
    this.setupPhysics();
    this.setupInvaderPositioning();
    this.setupMovementListening();
    this.setupNametag();
    this.setupMessaging();
    this.setupModel();
  }

  /**
   * Retrieves the invaders last known model position and quaternion from the
   * storage property, and applies that to it's model.
   */
  private setupInvaderPositioning() {
    const { position, quaternion } = this.invaderStorage.state.location.player;

    // Set the player's model orientation
    this.model.position.set(position.x, position.y, position.z);
    this.model.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

    this.transform = new this.enmat.ammo.btTransform();
    this.transform.setOrigin(new this.enmat.ammo.btVector3(position.x, position.y, position.z));
  }

  /**
   * Places the model in the scene, and adds a socket listener
   * to remove the player when they leave;
   */
  private setupModel() {
    this.scene.add(this.model);

    this.network.socket.on('player:left', (id) => {
      if (id === this.invaderStorage.state.id) this.scene.remove(this.model);
    })
  }

    /**
   * Retrieves the InvaderPhysics component and sets it's body as a usable
   * property, and initialises the zero vector property.
   */
    private setupPhysics() {
      const cInvaderPhysics = this.getComponent("InvaderPhysics") as InvaderPhysics;
      this.invaderPhysicsBody = cInvaderPhysics.body as Ammo.btRigidBody;
    }

  /**
   * Creates a nametag sprite that hovers above the players head.
   */
  private setupNametag() {
    // Create Nametag Sprites
    if (this.showNametagSprite) {
      setTimeout(() => {
        // Timeout provides time for the font to load.
        this.nametagSprite = createTextSprite(this.invaderStorage.state.name, 10, 30, this.model, this.scene, this.camera) as Sprite;
      }, 500)
    }
  }

  /**
   * Creates message sprites when the chat:message emit is fired inside of ChatBox.tsx, and then
   * removes them after a short delay. Also removes previous sprites if a new sprite is created before
   * the previous sprite could expire.
   */
  private setupMessaging() {
    // Handle Messaging Sprites
    const setMessage = (message: PlayerMessage) => {
      if (message.type != 'local' || message.id !== this.invaderStorage.state.id) return;
      this.messageSprite = createTextSprite(message.content, 15, 30, this.model, this.scene, this.camera) as Sprite;

      // Expiration
      const messageExpiration = 6000;
      setTimeout(() => this.scene.remove(this.messageSprite as Sprite), messageExpiration)

      if (this.lastMessageSprite) this.scene.remove(this.lastMessageSprite)
      this.lastMessageSprite = this.messageSprite;
    }

    this.network.socket.on('chat:message', setMessage);

    // Destroy Messaging sprites
    this.network.socket.on('player:left', (id) => {
      if (id === this.invaderStorage.state.id) {
        if (this.nametagSprite && this.showNametagSprite) this.scene.remove(this.nametagSprite);
        this.network.socket.off('chat:message', setMessage);
      }
    })
  }

  /**
   * Listens for a 'player:moved' webhook on the server, if the webhook
   * fires and the id associated to it is that of the invader's, then the
   * invaders storage will update with their latest information, specifically
   * their latest positional information.
   */
  private setupMovementListening() {
    // this.network.socket.on("player:moved", (locationData) => {
    //   if (locationData.id === this.invaderStorage.state.id) {
    //     this.invaderStorage.state = locationData;
    //   }
    // });
  }

  /**
   * A timestep method which is called on every animation frame, this calls various other
   * functional methods that are intrinsic to the player's movement, direction, and veolcity.
   *
   *
   * @param deltaTime
   */
  async update(deltaTime: number): Promise<void> {
    if (this.nametagSprite && this.showNametagSprite) updateSpritePosition(this.nametagSprite, 10, this.model, this.camera);
    if (this.messageSprite) updateSpritePosition(this.messageSprite, 15, this.model, this.camera);

    // Update the physics body's rotation to match the model's rotation.
    this.updateInvaderPhysicsBodyRotation();

    // Updates the player's position when movement is registered.
    this.updateInvaderPosition();
  }

  /**
   * Method to update physics body rotation to match the model's rotation
   *
   * @returns
   */
  updateInvaderPhysicsBodyRotation() {
    if (!this.invaderPhysicsBody || !this.model) return;

    // Check if the model's rotation has changed significantly since the last update
    if (!this.model.quaternion.equals(this.lastModelQuaternion)) {
      const { quaternion} = this.invaderStorage.state.location.player;

      // Convert Three.js quaternion to Ammo.js quaternion
      const ammoQuaternion = new this.enmat.ammo.btQuaternion(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      );

      // Update the physics body's rotation
      const transform = new this.enmat.ammo.btTransform();

      this.invaderPhysicsBody.getMotionState().getWorldTransform(transform);

      transform.setRotation(ammoQuaternion);

      this.invaderPhysicsBody.getMotionState().setWorldTransform(transform);
      this.invaderPhysicsBody.setCenterOfMassTransform(transform);

      // Update the last known quaternion
      this.lastModelQuaternion.copy(this.model.quaternion);

      // Clean up the Ammo.js objects to avoid memory leaks
      this.enmat.ammo.destroy(ammoQuaternion);
      this.enmat.ammo.destroy(transform);
    }
  }

  /**
   * Handles the invaders's position and motion, and prevents
   * them from falling continuously past the games fall threshold.
   *
   */
  private updateInvaderPosition() {
    const { position, quaternion } = this.invaderStorage.state.location.player;

    // Convert the desired position and rotation into Three.js Vector3 and Quaternion
    const targetPosition = new Vector3(position.x, position.y, position.z);
    const targetQuaternion = new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

    // Lerp for smooth transition
    const lerpFactor = 0.1; // Adjust this value for smoothness
    this.model.position.lerp(targetPosition, lerpFactor);
    this.model.quaternion.slerp(targetQuaternion, lerpFactor);

    // If there's a physics body, update its transform to match the new position and orientation
    if (this.invaderPhysicsBody) {
      const ammoTransform = new this.enmat.ammo.btTransform();
      this.invaderPhysicsBody.getMotionState().getWorldTransform(ammoTransform);

      // Convert the target position and rotation into Ammo.js types
      const ammoPosition = new this.enmat.ammo.btVector3(targetPosition.x, targetPosition.y, targetPosition.z);
      const ammoQuaternion = new this.enmat.ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

      // Update the Ammo.js transform with the new position and rotation
      ammoTransform.setOrigin(ammoPosition);
      ammoTransform.setRotation(ammoQuaternion);

      // Apply the updated transform to the physics body
      this.invaderPhysicsBody.getMotionState().setWorldTransform(ammoTransform);
      this.invaderPhysicsBody.setCenterOfMassTransform(ammoTransform);

      // Clean up the created Ammo.js objects to avoid memory leaks
      this.enmat.ammo.destroy(ammoPosition);
      this.enmat.ammo.destroy(ammoQuaternion);
      this.enmat.ammo.destroy(ammoTransform);
    }
  }
}
