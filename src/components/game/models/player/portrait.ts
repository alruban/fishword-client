import {
  SkeletonHelper,
  CameraHelper,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  PointLight,
  PointLightHelper
} from 'three';
import Component from '../../world/component';

export default class PlayerPortrait extends Component {
  public name: string = "PlayerPortrait";

  public portraitLight!: PointLight;
  public portraitCamera!: PerspectiveCamera;
  public portraitRenderTarget!: WebGLRenderTarget;

  private renderer: WebGLRenderer;
  private model: Object3D;
  private scene: Scene;

  private modelFace!: Object3D;

  private debug = false;
  private portraitCameraHelper!: CameraHelper;
  private portraitLightHelper!: PointLightHelper;
  private skeletonHelper!: SkeletonHelper;

  constructor(renderer: WebGLRenderer, model: Object3D, scene: Scene) {
    super();

    this.renderer = renderer;
    this.model = model;
    this.scene = scene;
  }

  initialise(): void {
    this.createPlayerPortaitCamera();
    this.setPortraitPosition();
  }

  createPlayerPortaitCamera() {
    // Create the portrait camera and position it in front of the model's face
    this.portraitCamera = new PerspectiveCamera(35, 1, 0.1, 1000);
    this.portraitLight = new PointLight(0xffffff, 50, 0);

    if (this.debug) this.setupDebug();
    this.lookAtCharacterFace();
  }

  setupDebug() {
    this.portraitCameraHelper = new CameraHelper(this.portraitCamera)
    this.portraitLightHelper = new PointLightHelper(this.portraitLight);
    this.skeletonHelper = new SkeletonHelper(this.model);

    this.scene.add(this.portraitCameraHelper);
    this.scene.add(this.portraitLightHelper);
    this.scene.add(this.skeletonHelper)
  }

  updateDebug() {
    this.portraitCameraHelper.update();
    this.portraitLightHelper.update();
  }

  lookAtCharacterFace() {
    this.model.traverse((object) => {
      if (object.type.toLowerCase() === 'bone' && object.name.toLowerCase() === 'camera') {
        this.modelFace = object;

        // Obtain the world position of the model's head or the specific bone
        const worldPosition = new Vector3();
        object.getWorldPosition(worldPosition);

        // Direct the spotlight to look at the world position of the head bone
        this.portraitLight.position.copy(this.portraitCamera.position);
        this.portraitLight.updateMatrixWorld(); // Ensure the target's matrix is updated immediately

        // Align the camera to look at the model's head
        this.portraitCamera.lookAt(worldPosition);

        // Add the target to the scene if not already added
        if (!this.portraitLight.parent) {
          this.scene.add(this.portraitLight);
        }
      }
    });
  }

  setPortraitPosition() {
    this.lookAtCharacterFace();

    // Transform the offset into the model's local space to world space
    const cameraPosition = this.model.localToWorld(new Vector3(1, 0.5, -17.5));

    this.portraitLight.position.copy(cameraPosition);
    this.portraitCamera.position.copy(cameraPosition);

    // Initialize the render target for the portrait
    this.portraitRenderTarget = new WebGLRenderTarget(512, 512);
  }

  // Add a method in your World class to get portrait data URL
  getPortraitDataUrl(): string {
    // Render the portrait to its render target
    this.renderer.setRenderTarget(this.portraitRenderTarget);
    this.renderer.render(this.scene, this.portraitCamera);

    // IMPORTANT: Switch back to rendering to the canvas
    this.renderer.setRenderTarget(null);

    const { width, height } = this.portraitRenderTarget;
    const pixels = new Uint8Array(width * height * 4);

    // Read the pixels from the WebGLRenderTarget
    this.renderer.readRenderTargetPixels(this.portraitRenderTarget, 0, 0, width, height, pixels);

    // Create a canvas and draw the pixels onto it
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return '';
    const imageData = context.createImageData(width, height);
    imageData.data.set(pixels);

    // Draw the image data on the canvas
    context.putImageData(imageData, 0, 0);

    // Create a new canvas to draw the flipped image
    const flipCanvas = document.createElement('canvas');
    flipCanvas.width = width;
    flipCanvas.height = height;
    const flipContext = flipCanvas.getContext('2d');
    if (!flipContext) return '';

    // Flip the image by transforming the context
    flipContext.scale(1, -1); // Flip vertically
    flipContext.drawImage(canvas, 0, -height);

    return flipCanvas.toDataURL();
  }

  async update(deltaTime: number): Promise<void> {
    if (this.debug) this.updateDebug();

    this.setPortraitPosition();
  }
}
