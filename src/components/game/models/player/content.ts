import * as faceapi from 'face-api.js';

import { Mesh, RepeatWrapping, TextureLoader, LinearFilter, Texture } from 'three';
import Component from '../../world/component';
import { LoadedAsset, World } from '../../../../world';

export default class PlayerContent extends Component {
  public name: string = "PlayerContent";

  private asset: LoadedAsset;
  private world: World;

  private currentFaceBase64!: string;

  private video?: HTMLVideoElement;
  private canvas?: HTMLCanvasElement;

  constructor(asset: LoadedAsset, world: World) {
    super();

    this.asset = asset;
    this.world = world;
  }

  initialise(): void {
    this.handleFace();
    this.handleStream();
  }

  async handleStream() {
    await this.loadFaceApiModels(); // Load face-api.js models
    this.startVideoStream();
  }

  async loadFaceApiModels() {
    // Load models from a public directory containing the model files
    // The path may vary depending on your project's structure
    const x = await faceapi.nets.tinyFaceDetector.loadFromUri('/face_recognition/models');
    console.log('Face models loaded')
    // Load other models as needed
  }

  async detectFace() {
    const detectionOptions = new faceapi.TinyFaceDetectorOptions();

    if (!this.video || !this.canvas) return;

    // Face detection loop
    const detect = async () => {
      // @ts-expect-error
      const result = await faceapi.detectSingleFace(this.video, detectionOptions);

      if (result && this.video && this.canvas) {
        const zoomFactor = 0.75; // Adjust to zoom in more or less
        const { x, y, width, height } = result.box;
        const zoomedWidth = width * zoomFactor;
        const zoomedHeight = height * zoomFactor;
        const offsetX = (width - zoomedWidth) / 2;
        const offsetY = (height - zoomedHeight) / 2;

        const ctx = this.canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            this.video,
            x + offsetX, y + offsetY, zoomedWidth, zoomedHeight,
            0, 0, this.canvas.width, this.canvas.height
          );
        }
      }
      requestAnimationFrame(detect); // Continue detecting faces
    };

    setTimeout(() => detect(), 2000);
  }

  async update() {
    if (this.canvas) {
      console.log('1')
      this.setNewFaceFromVideo(this.canvas)
    } else {
      console.log('2')
      const base64Face = this.world.player.state.face as string;
      this.setNewFaceFromBase64(base64Face)
    }
  }

  handleFace() {
    const base64Face = this.world.player.state.face as string;

    this.currentFaceBase64 = base64Face;
    this.setNewFaceFromBase64(base64Face);
  }

  startVideoStream() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const constraints = { video: { width: 1280, height: 720 } };

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        if (!this.video) this.video = document.createElement('video');
        this.video.srcObject = stream;
        this.video.play();

        if (!this.canvas) {
          this.canvas = document.createElement('canvas');
          // Set canvas size to match video dimensions or desired texture size
          this.canvas.width = 1280;
          this.canvas.height = 720;

          document.body.append(this.canvas)

          this.canvas.classList.add("absolute", "top-0", "right-0", "w-16", "h-16", "z-1")
        }

        this.detectFace();
      }).catch((error) => {
        console.error('Error accessing the webcam', error);
      });
    }
  }

  setNewFaceFromVideo(canvas: HTMLCanvasElement) {
    if (!canvas) return;
    const texture = new Texture(this.canvas);
    texture.needsUpdate = true;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.y = -1; // Flip texture
    texture.offset.y = 1; // Offset the texture to align it correctly

    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    // texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // This method assumes that your model has been identified and you're applying the video texture to it
    this.asset.scene.traverse((child: any) => {
      if ((child as Mesh).isMesh) {
        child.material.map = texture;
        child.material.needsUpdate = true;
      }
    });
  }

  setNewFaceFromBase64(base64: string) {
    this.currentFaceBase64 = base64;

    // No need to create a Blob, just use the base64 string directly
    const textureLoader = new TextureLoader();
    const image = new Image();
    image.src = `data:image/jpeg;base64,${base64}`;
    image.onload = () => {
      const texture = textureLoader.load(image.src);
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.y = -1; // Flip texture
      texture.offset.y = 1; // Offset the texture to align it correctly

      this.asset.scene.traverse((child: any) => {
        if ((child as Mesh).isMesh) {
          // Apply the texture to the specific mesh/material
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    };
  }
}
