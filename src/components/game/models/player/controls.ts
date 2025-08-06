import {
  Euler,
  Camera,
  Sprite,
  Vector3,
  Object3D,
  Raycaster,
  Spherical,
  Quaternion,
  type Scene,
} from 'three';

import Component from '../../world/component';
import { Network } from '../../../../network/network';
import { createTextSprite, updateSpritePosition } from '../../interface/utilities/TextSprite';
import { Input } from '../../interface/input';
import { adjustHue } from '../../tools/adjustHue';
import ModelPhysics from '../physics';

export default class PlayerControls extends Component {
  // Info
  public name: string = 'PlayerControls';

  // Movement
  private timeZeroToMax: number = 0.08;
  private maxMovementSpeed: number = 50.0;
  private currentMovementSpeed: Vector3 = new Vector3();
  private acceleration: number = this.maxMovementSpeed / this.timeZeroToMax;
  private decceleration: number = -7.0;
  private maxY: number = 0.25; // Example maximum height
  private tempVector3 = new Vector3();
  private forwardDirection = new Vector3();
  private rightDirection = new Vector3();
  private upDirection = new Vector3();

  // Physics
  private lastModelQuaternion: Quaternion = new Quaternion();
  private playerPhysicsBody!: Ammo.btRigidBody;
  private tempVec: Vector3 = new Vector3();
  private transform!: Ammo.btTransform;
  private zeroVec!: Ammo.btVector3;

  // Location
  private lastUpdate: number = 0;
  private lastPosition: Vector3 = new Vector3();
  private lastRotation: Quaternion = new Quaternion();
  private fallThreshold: number = -10000; // Y-coordinate threshold to consider player has fallen
  private safeRespawnLocation: Vector3 = new Vector3(0, 0, 0); // Safe respawn location

  // Camera
  private cameraPolarAngle!: number; // y-plane
  private cameraAzimuthalAngle!: number; // xz-plane
  private cameraRotationSpeed: number = 0.005;
  private cameraMinDistance: number = 10;
  private cameraDistance: number = 50;
  private cameraMaxDistance: number = 100;
  private cameraVerticalMin: number = 0.2; // radians
  private cameraVerticalMax: number = Math.PI; // radians
  private cameraCollisionDistance: null | number = null;
  private isRightMouseDown: boolean = false;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;
  private isTouching: boolean = false;

  // Nametag
  private nametagSprite!: Sprite;
  public showNametagSprite: boolean = false;

  // Messaging
  private lastMessageSprite!: Sprite;
  private messageSprite!: Sprite;

  // Parents
  private camera: Camera;
  private scene: Scene;
  private model: Object3D;
  private storage: PlayerStorage;
  private network: Network;
  private canvas: HTMLCanvasElement;
  private input: Input;
  private enmat: Enmat;

  constructor(camera: Camera, scene: Scene, model: Object3D, storage: PlayerStorage, network: Network, canvas: HTMLCanvasElement, input: Input, enmat: Enmat) {
    super();

    this.camera = camera;
    this.scene = scene;
    this.model = model;
    this.storage = storage;
    this.network = network;
    this.canvas = canvas;
    this.input = input;
    this.enmat = enmat;
  }

  initialise(): void {
    this.setupPhysics();
    this.setupPlayerPositioning();
    this.setupCameraPositioning();
    this.setupListeners();
    this.setupNametag();
    this.setupMessaging();
    this.setupModel();

    adjustHue(this.model, 0.5)
  }

  /**
   * Retrieves the PlayerPhysics component and sets it's body as a usable
   * property, and initialises the zero vector property.
   */
  private setupPhysics() {
    const cPlayerPhysics = this.getComponent("PlayerPhysics") as ModelPhysics;
    this.playerPhysicsBody = cPlayerPhysics.body as Ammo.btRigidBody;
    this.zeroVec = new this.enmat.ammo.btVector3(0.0, 0.0, 0.0);
  }

  /**
   * Retrieves the players last known model position and quaternion from the
   * storage property, and applies that to it's model.
   */
  private setupPlayerPositioning() {
    const { position, quaternion } = this.storage.state.location.player;

    this.model.position.set(position.x, position.y, position.z);
    this.model.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

    this.transform = new this.enmat.ammo.btTransform();
    this.transform.setOrigin(new this.enmat.ammo.btVector3(position.x, position.y, position.z));

  }

  /**
   * Retrieves the players last known camera position and quaternion from the
   * storage property, and applies that to it's camera.
   */
  private setupCameraPositioning(): void {
    const { position, quaternion } = this.storage.state.location.camera;

    // Calculate the camera's orientation based on its saved relative position and quaternion
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

    // Update the internal spherical coordinates based on the camera's current quaternion
    const spherical = new Spherical().setFromVector3(this.camera.position.sub(this.model.position));
    this.cameraPolarAngle = spherical.phi;
    this.cameraAzimuthalAngle = spherical.theta;

    // Look at the model position if needed
    this.camera.lookAt(this.model.position);
  }

  /**
   * Event listener controller, adds events to this.input that facillitate
   * various functionalities that the player engages in.
   */
  private setupListeners() {
    this.input.addContextMenuListener(this.onContextMenu, this.canvas);
    this.input.addMouseDownListener(this.onMouseDown as EventListener, this.canvas);
    this.input.addMouseUpListener(this.onMouseUp as EventListener, this.canvas);
    this.input.addMouseMoveListener(this.onMouseMove as EventListener, this.canvas);
    this.input.addMouseWheelListener(this.onMouseWheel as EventListener, this.canvas);
    this.input.addMouseLeaveListener(this.onMouseLeave as EventListener, this.canvas);
    this.input.addTouchStartListener(this.onTouchStart as EventListener, this.canvas);
    this.input.addTouchMoveListener(this.onTouchMove as EventListener, this.canvas);
    this.input.addTouchEndListener(this.onTouchEnd as EventListener, this.canvas);
  }

  /**
   * Creates a nametag sprite that hovers above the players head.
   */
  private setupNametag() {
    // Create Nametag Sprites
    if (this.showNametagSprite) {
      setTimeout(() => {
        // Timeout provides time for the font to load.
        this.nametagSprite = createTextSprite(this.storage.state.name, 5, 30, this.model, this.scene, this.camera) as Sprite;
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
      if (message.type != 'local' || message.id !== this.storage.state.id) return;
      this.messageSprite = createTextSprite(message.content, 5, 30, this.model, this.scene, this.camera) as Sprite;

      // Expiration
      const messageExpiration = 6000;
      setTimeout(() => this.scene.remove(this.messageSprite as Sprite), messageExpiration)

      if (this.lastMessageSprite) this.scene.remove(this.lastMessageSprite)
      this.lastMessageSprite = this.messageSprite;
    }

    this.network.socket.on('chat:message', setMessage);

    // Destroy Messaging sprites
    this.network.socket.on('player:left', (id) => {
      if (id === this.storage.state.id) {
        if (this.nametagSprite && this.showNametagSprite) this.scene.remove(this.nametagSprite);

        this.network.socket.off('chat:message', setMessage);
      }
    })
  }

    /**
   * Places the model in the scene, and adds a socket listener
   * to remove the player when they leave;
   */
  private setupModel() {
    this.scene.add(this.model);

    this.network.socket.on('player:left', (id) => {
      if (id === this.storage.state.id) this.scene.remove(this.model);
    })
  }

  /**
   * Disables the usage of the right-click context menu.
   *
   * @param event
   * @returns
   */
  private onContextMenu = (event: Event) => event.preventDefault();

  /**
   * Applies camera drag stylings to non-touch devices, and also labels the
   * this.isRightMouseDown value as value when the user is engaging a right-click.
   *
   * @param event
   */
  private onMouseDown = (event: MouseEvent) => {
    if (this.canvas === event.target) {
      if (!this.input.isTouchDevice() && event.button === 2) { // Right mouse button
        document.body.style.cursor = 'grabbing';
        this.isRightMouseDown = true;
      }
    }
  }

  /**
   * Provides the MouseEvent values to dragCamera in order for the player to be
   * able to effectively control their third person camera. Requires this.isRightMouseDown
   * to be labelled as true, which is set inside of this.onMouseDown().
   *
   * @param event
   */
  private onMouseMove = (event: MouseEvent) => {
    if (!this.input.isTouchDevice() && this.isRightMouseDown) this.dragCamera(event.movementX, event.movementY)
  }

  /**
   * Removes camera drag stylings from non-touch devices, and also labels the
   * this.isRightMouseDown value as false when the user is no longer engaging
   * in a right-click.
   *
   * @param event
   */
  private onMouseUp = (event: MouseEvent) => {
    if (!this.input.isTouchDevice() && event.button === 2) {
      document.body.style.cursor = 'default';
      this.isRightMouseDown = false;
    }
  }

  /**
   * The mousewheel event controls the camera's third-person proximity to the player, increasing/decrasing
   * the distance based on the direction of the mouse wheel's travel.
   *
   * @param event
   */
  private onMouseWheel = (event: WheelEvent) => {
    if (!this.input.isTouchDevice()) {
      // Directly adjust cameraDistance based on scroll input.
      const zoomAmount = event.deltaY * -0.02; // Scale and invert deltaY.
      this.cameraDistance += zoomAmount;
      this.cameraDistance = Math.max(this.cameraMinDistance, Math.min(this.cameraMaxDistance, this.cameraDistance));

      // Always check for collisions in case the new desired distance or the current distance is obstructed.
      this.handleCameraCollision();
    }
  }

  /**
   * Removes camera drag stylings from non-touch devices, and also labels the
   * this.isRightMouseDown value as false when the user is no longer engaging
   * in a right-click.
   *
   */
  private onMouseLeave = () => {
    if (!this.input.isTouchDevice()) {
      document.body.style.cursor = 'default';
      this.isRightMouseDown = false;
    }
  }

  /**
   * A touchstart event that sets isTouching to true and registers the touch related movement
   * values as properties to be utilised by the onTouchMove method.
   *
   *
   * @param event
   */
  private onTouchStart = (event: TouchEvent) => {
    // One Finger - Camera Drag (Touch Device)
    if (this.input.isTouchDevice() && event.touches.length === 1) {
      this.lastTouchX = event.touches[0]?.clientX ?? 0;
      this.lastTouchY = event.touches[0]?.clientY ?? 0;
      this.isTouching = true;
    }
  }

  /**
   * A touchmove that, when one finger is pressed and moved, controls the camera drag,
   * used to control the direction that the player/camera is pointed in, similar to the
   * usage of the right-click functionality on non-touch devices.
   *
   * @param event
   */
  private onTouchMove = (event: TouchEvent) => {
    // One Finger - Camera Drag (Touch Device)
    if (this.input.isTouchDevice() && this.isTouching && (event.touches.length == 1 || event.touches.length == 2)) {
      const touchX = event.touches[0]?.clientX ?? 0;
      const touchY = event.touches[0]?.clientY ?? 0;

      // Calculate movement
      const intensity = 2;
      const movementX = (touchX - this.lastTouchX) * intensity;
      const movementY = (touchY - this.lastTouchY) * intensity;

      this.dragCamera(movementX, movementY)

      // Update last positions
      this.lastTouchX = touchX;
      this.lastTouchY = touchY;
    }
  }

  /**
   * A touchend event that sets isTouching to false and prevents
   * further registration of touch related movement.
   *
   * @param event
   */
  private onTouchEnd = (event: TouchEvent) => {
    // One Finger - Camera Drag (Touch Device)
    if (this.input.isTouchDevice() && event.touches.length <= 1) {
      this.isTouching = false;
    }
  }

  /**
   * Prevents the camara from colliding into objects, and clipping through
   * them by zooming the camera into the player, and then returning the
   * camera zoom distance to it's original value once the collision has ended.
   *
   * @returns
   */
  private handleCameraCollision() {
    const directionToCamera = this.tempVector3.subVectors(this.camera.position, this.model.position).normalize();
    const raycaster = new Raycaster(this.model.position, directionToCamera, 0, this.cameraMaxDistance);

    raycaster.camera = this.camera;
    let collisions = raycaster.intersectObjects(this.scene.children, true);
    collisions = collisions.filter((c) =>
      // Types
      c.object.type.toLowerCase() !== 'skeletonhelper' &&
      c.object.type.toLowerCase() !== 'linesegments' &&
      c.object.type.toLowerCase() !== 'camerahelper' &&
      c.object.type.toLowerCase() !== 'sprite' &&
      // Names
      c.object.name.toLowerCase() !== 'player' &&
      c.object.name.toLowerCase() !== 'mesh' &&
      c.object.name.toLowerCase() !== 'cube' &&
      c.object.name.toLowerCase() !== 'ocean'
    )

    if (collisions.length > 0) {
      const closestCollision = collisions[0];
      console.log(closestCollision, 'COLLISION!')
      if (!closestCollision) return;

      // Adjust the camera distance due to collision, ensuring it doesn't clip through objects.
      this.cameraCollisionDistance = closestCollision.distance - 2; // Minor offset to avoid z-fighting.
      this.cameraDistance = Math.max(this.cameraMinDistance, this.cameraCollisionDistance);
    } else {
      // If there's no collision, and we're currently adjusting for a collision, start moving back to the last preferred distance.
      if (this.cameraCollisionDistance !== null) {
        this.cameraCollisionDistance = null; // Reset collision distance tracking.
        // Smooth transition back to cameraDistance if needed.
        // This check is to avoid unnecessary adjustments if the camera is already at the preferred distance.
        if (this.cameraDistance > 0.01) {
          const adjustmentSpeed = 0.05; // Adjust this value as needed for smoothness.
          this.cameraDistance += this.cameraDistance * adjustmentSpeed;
          this.cameraDistance = Math.max(this.cameraMinDistance, Math.min(this.cameraMaxDistance, this.cameraDistance));
        }
      }
    }
  }

  /**
   * Method to adjust the camera based on x and y values.
   *
   * @param movementX
   * @param movementY
   */
  private dragCamera(movementX: number, movementY: number) {
    // Use pre-allocated vectors and quaternions to reduce garbage collection
    this.cameraAzimuthalAngle -= movementX * this.cameraRotationSpeed;
    this.cameraPolarAngle = Math.max(this.cameraVerticalMin, Math.min(this.cameraVerticalMax, this.cameraPolarAngle - movementY * this.cameraRotationSpeed));

    this.handleCameraCollision();
  }

  /**
   * Handles the player's accelerattion.
   *
   * @param direction
   * @param t
   */
  private accelerate(direction: Vector3, t: number): void {
    const accel = this.tempVec.copy(direction).multiplyScalar(this.acceleration * t);
    this.currentMovementSpeed.add(accel);
    this.currentMovementSpeed.clampLength(0, this.maxMovementSpeed);
  }

  /**
   * Handles the player's deacceleration.
   * @param t
   */
  private decelerate(t: number): void {
    const decel = this.tempVec.copy(this.currentMovementSpeed).multiplyScalar(this.decceleration * t);
    this.currentMovementSpeed.add(decel);
  }

  /**
   * Controls the players directional movement through the player's control of the camera.
   *
   * @param currentPosition
   * @param currentQuaternion
   */
  private updateCamera(currentPosition: Vector3, currentQuaternion: Quaternion): void {
    const lerpFactor = 0.1; // Adjust this value to control the smoothness (0.0 - 1.0)
    this.model.position.lerp(currentPosition, lerpFactor);
    this.model.quaternion.slerp(currentQuaternion, lerpFactor);

    // Calculate the camera's position using spherical coordinates to create a 3rd Person Look
    const spherical = new Spherical(
      this.cameraDistance,
      this.cameraPolarAngle - 0.1, // Offset to make the camera look slightly downwards
      this.cameraAzimuthalAngle
    );

    // Apply the new spherical coordinates to get the new camera position
    const position = new Vector3().setFromSpherical(spherical).add(this.model.position);

    // Adjust the camera's height if needed to ensure it's above the ground or model
    position.y += 10;

    this.camera.position.copy(position);
    this.camera.lookAt(this.model.position);

    // Ensure the model's orientation is aligned with the terrain, not the camera's tilt
    // The model should only rotate around the Y axis to stay upright
    this.model.quaternion.copy(this.camera.quaternion);
    this.model.quaternion.normalize();
  }

  /**
   * Method to update physics body rotation to match the model's rotation
   *
   * @returns
   */
  updatePlayerPhysicsBodyRotation() {
    if (!this.playerPhysicsBody || !this.model) return;

    // Check if the model's rotation has changed significantly since the last update
    if (!this.model.quaternion.equals(this.lastModelQuaternion)) {
      // Convert Three.js quaternion to Ammo.js quaternion
      const ammoQuaternion = new this.enmat.ammo.btQuaternion(
        this.model.quaternion.x,
        this.model.quaternion.y,
        this.model.quaternion.z,
        this.model.quaternion.w
      );

      // Update the physics body's rotation
      const transform = new this.enmat.ammo.btTransform();

      this.playerPhysicsBody.getMotionState().getWorldTransform(transform);

      transform.setRotation(ammoQuaternion);

      this.playerPhysicsBody.getMotionState().setWorldTransform(transform);
      this.playerPhysicsBody.setCenterOfMassTransform(transform);

      // Update the last known quaternion
      this.lastModelQuaternion.copy(this.model.quaternion);

      // Clean up the Ammo.js objects to avoid memory leaks
      this.enmat.ammo.destroy(ammoQuaternion);
      this.enmat.ammo.destroy(transform);
    }
  }

  /**
   * Updates the player's movement direction and veolcity via
   * their interaction with various keys or touch events.
   *
   * @param t
   * @returns
   */
  updateVelocity(t: number) {
    if (document.activeElement?.tagName === "INPUT") return;

    // Reuse vectors for direction calculation
    this.forwardDirection.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.rightDirection.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    this.upDirection.set(0, 1, 0).applyQuaternion(this.camera.quaternion);

    // Movement calculation logic...
    let forwardFactor = 0;
    let rightFactor = 0;
    let upFactor = 0;
    let direction = this.tempVector3.set(0, 0, 0);

    // Combine directions based on input factors
    direction = direction.addScaledVector(this.forwardDirection, forwardFactor)
                         .addScaledVector(this.rightDirection, rightFactor)
                         .addScaledVector(this.upDirection, upFactor)
                         .normalize();

    if (this.input.isTouchDevice()) {
      // Mobile
      forwardFactor = this.input.getTouchCount() >= 2 ? 1 : 0;

      // Combine forward and right vectors based on input factors.
      direction = new Vector3().addScaledVector(this.forwardDirection, forwardFactor).normalize();
    } else {
      // Desktop
      forwardFactor = this.input.getKeyDown("KeyW") - this.input.getKeyDown("KeyS");
      rightFactor = this.input.getKeyDown("KeyD") - this.input.getKeyDown("KeyA");
      upFactor = this.input.getKeyDown("Space") - this.input.getKeyDown("ShiftLeft");

      // Combine forward and right vectors based on input factors.
      direction = new Vector3()
        .addScaledVector(this.forwardDirection, forwardFactor)
        .addScaledVector(this.rightDirection, rightFactor)
        .addScaledVector(this.upDirection, upFactor).normalize();
    }

    // Check and constrain the Y-axis position
    const potentialYPosition = this.model.position.y + this.currentMovementSpeed.y * t;
    if (potentialYPosition > this.maxY) {
      // Prevent movement above the water surface by setting the Y component of the speed to 0
      this.currentMovementSpeed.setY(0);
    }

    // Apply the direction to the physics body's velocity. Ensure to scale it by the desired speed.
    const velocity = this.playerPhysicsBody.getLinearVelocity();
    const speed = this.currentMovementSpeed.length(); // Use the magnitude of currentMovementSpeed as the speed.

    velocity.setValue(direction.x * speed, direction.y * speed, direction.z * speed);

    this.playerPhysicsBody.setLinearVelocity(velocity);

    this.decelerate(t);
    this.accelerate(direction, t);

    // Apply movement based on model's orientation
    velocity.setX(this.currentMovementSpeed.x);
    velocity.setZ(this.currentMovementSpeed.z);

    this.playerPhysicsBody.setLinearVelocity(velocity);
    this.playerPhysicsBody.setAngularVelocity(this.zeroVec);
  }

  /**
   * Allows the user to change the player's rotation via
   * arrow keys on the keyboard.
   *
   * @param deltaTime
   */
  private updateCameraFromKeyboard(deltaTime: number) {
    if (!this.input.isTouchDevice()) {
      let movementX = 0;
      let movementY = 0;

      const intensity = 175;

      if (this.input.getKeyDown('ArrowLeft') === 1) { movementX -= intensity * deltaTime; }
      if (this.input.getKeyDown('ArrowRight') === 1) { movementX += intensity * deltaTime; }
      if (this.input.getKeyDown('ArrowUp') === 1) { movementY -= intensity * deltaTime; }
      if (this.input.getKeyDown('ArrowDown') === 1) { movementY += intensity * deltaTime; }

      if (movementX !== 0 || movementY !== 0) this.dragCamera(movementX, movementY);
    }
  }

  /**
   * A timestep method which is called on every animation frame, this calls various other
   * functional methods that are intrinsic to the player's movement, direction, and veolcity.
   *
   *
   * @param deltaTime
   */
  async update(deltaTime: number): Promise<void> {
    if (this.nametagSprite && this.showNametagSprite) updateSpritePosition(this.nametagSprite, 5, this.model, this.camera);
    if (this.messageSprite) updateSpritePosition(this.messageSprite, 5, this.model, this.camera);

    // Update the physics body's rotation to match the model's rotation.
    this.updatePlayerPhysicsBodyRotation();

    // Align model's rotation with its velocity.
    this.updateVelocity(deltaTime);

    // Control the camera with the directional arrows.
    this.updateCameraFromKeyboard(deltaTime)

    // Updates the player's position when movement is registered.
    this.updatePlayerPosition();
  }

  /**
   * Handles the player's position and motion, and prevents
   * them from falling continuously past the games fall threshold.
   *
   */
  async updatePlayerPosition() {
    // Update logic, including movement and rotation updates
    const ms = this.playerPhysicsBody.getMotionState();

    if (ms) {
      ms.getWorldTransform(this.transform);
      const p = this.transform.getOrigin();
      const q = this.transform.getRotation(); // Quaternion

      this.parent.setPosition(this.camera.position);
      this.parent.setRotation(this.camera.quaternion);

      if (p.y() >= this.maxY) {
        // Set the Y position to the maximum allowed value
        p.setY(this.maxY - 1);
        this.transform.setOrigin(p);
        this.playerPhysicsBody.getMotionState().setWorldTransform(this.transform);
        this.playerPhysicsBody.setWorldTransform(this.transform);
      }

      // Check if the player has fallen
      if (p.y() < this.fallThreshold) {
        await this.resetPlayerPosition();
      }

      // Only send the player's location if they've moved a significant amount
      const currentPosition = new Vector3(p.x(), p.y(), p.z());
      const currentQuaternion = new Quaternion(q.x(), q.y(), q.z(), q.w());

      // Define thresholds
      const positionThreshold = 0.01;
      const rotationThreshold = 0.01;

      // Calculate changes
      const positionChangeMagnitude = currentPosition.distanceTo(this.lastPosition);
      const rotationChangeMagnitude = this.lastRotation.angleTo(currentQuaternion);

      // Determine if changes are significant
      const positionChanged = positionChangeMagnitude > positionThreshold;
      const rotationChanged = rotationChangeMagnitude > rotationThreshold;

      // After setting the camera position, ensure it's looking at the correct point
      this.updateCamera(currentPosition, currentQuaternion);

      // Position and rotation change functionality that updates the camera
      if ((positionChanged || rotationChanged) && this.model) {
        // Consider adding a threshold to minimize network traffic
        const distanceMoved = this.lastPosition.distanceTo(currentPosition);
        const distanceRotated = this.lastRotation.angleTo(currentQuaternion);

        // Position and rotation change functionality that updates the database
        if (distanceMoved > 1.0 || distanceRotated > 0.0085) { // Threshold distance can be adjusted
          this.lastPosition.copy(currentPosition); // Update last known position
          this.lastRotation.copy(currentQuaternion); // Update last known position

          // Throttle player location updates to every 100-200ms
          const currentTime = performance.now();
          if (currentTime - this.lastUpdate > 100) { // Throttle to every 100ms
            this.lastUpdate = currentTime;

            this.updatePositionOnServer(currentPosition, this.model.rotation, this.model.quaternion)
          };
        }
      }
    }
  }

  /**
   * Resets the player to a safe position, rotation, and quaternion based
   * on predefined values set in this class's properties. For instance, if the
   * player fell through the world, this would bring them back to a safe position
   * in the map.
   */
  private async resetPlayerPosition() {
    console.warn("Resetting player position");
    // Obtain a reference to the Ammo library's btVector3 class for position setting
    const btVector3 = this.enmat.ammo.btVector3;

    // Reset position to a safe location
    const safePosition = this.safeRespawnLocation;
    const safeRotation = new Euler();
    const safeQuaternion = new Quaternion();
    const newOrigin = new btVector3(safePosition.x, safePosition.y, safePosition.z);

    // Temporarily disable physics simulation for the player body, if applicable
    // this.playerPhysicsBody.setActivationState(4); // 4 represents DISABLE_SIMULATION in some physics engines

    // Reset the velocity to ensure the body doesn't continue to move
    this.playerPhysicsBody.setLinearVelocity(new btVector3(0, 0, 0));
    this.playerPhysicsBody.setAngularVelocity(new btVector3(0, 0, 0));

    // Update the motion state's world transform to the new position
    const newTransform = new this.enmat.ammo.btTransform();
    newTransform.setIdentity();
    newTransform.setOrigin(newOrigin);
    this.playerPhysicsBody.setWorldTransform(newTransform);
    this.playerPhysicsBody.getMotionState().setWorldTransform(newTransform);

    // Re-enable physics simulation for the player body, if it was disabled
    // this.playerPhysicsBody.setActivationState(1); // 1 typically represents ACTIVE_TAG

    // Optionally, update the position on the server
    await this.updatePositionOnServer(safePosition, safeRotation, safeQuaternion);
  }

  /**
   * Sends location based data to the server so the players location history
   * is saved permanently.
   *
   * @param position
   * @param rotation
   * @param quaternion
   */
  private async updatePositionOnServer(position: Vector3, rotation: Euler, quaternion: Quaternion) {
    // Construct the location object to match your server's expected format
    const location: PlayerLocation = {
      player: {
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        },
        rotation: {
          x: rotation.x,
          y: rotation.y,
          z: rotation.z
        },
        quaternion: {
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w
        }
      },
      camera: {
        position: {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z
        },
        rotation: {
          x: this.camera.rotation.x,
          y: this.camera.rotation.y,
          z: this.camera.rotation.z
        },
        quaternion: {
          x: this.camera.quaternion.x,
          y: this.camera.quaternion.y,
          z: this.camera.quaternion.z,
          w: this.camera.quaternion.w
        }
      }
    };

    // Update the player's position on the server
    await fetch('https://api.idiot.surf/player/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: this.storage.state.id,
          location
        }),
        credentials: 'include',
      })
      .then((res) => res.json())
      .then((data) => this.network.socket.emit('player:moved', data))
      .catch(error => console.error('Error saving position:', error));
  }
}
