import { Camera, Scene, WebGLRenderer } from 'three';

export default class Loop {
  public camera
  public scene
  public renderer
  public time: number
  public updatables: any[]
  private previousTimestamp: null | number;

  constructor(
    camera: Camera,
    scene: Scene,
    renderer: WebGLRenderer
  ) {
    this.camera = camera
    this.scene = scene
    this.renderer = renderer
    this.time = 0;
    this.updatables = []
    this.previousTimestamp = null;
  }

  start() {
    this.renderer.setAnimationLoop((timestamp) => {
      if (this.previousTimestamp === null) this.previousTimestamp = timestamp;

      const delta = timestamp - this.previousTimestamp;
      let timeElapsed = Math.min(1.0 / 30.0, delta * 0.3);

      this.tick(timeElapsed);

      this.previousTimestamp = timestamp;

      // Render a frame
      this.renderer.render(this.scene, this.camera);
    })
  }

  tick(timeInSeconds: number) {
    this.time = timeInSeconds;
    for (const object of this.updatables) object.update(timeInSeconds)
  }

  stop() {
    this.renderer.setAnimationLoop(null)
  }
}
