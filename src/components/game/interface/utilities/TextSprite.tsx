import { Camera, CanvasTexture, Scene, Sprite, SpriteMaterial, Vector3 } from "three";

export const createTextSprite = (text: string, yOffset: number, size: number, model: any, scene: Scene, camera: Camera) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!canvas || !context) return;

  // Scale the canvas for high DPI displays
  const scale = window.devicePixelRatio; // Change to 1 if not needed

  const textWidth = context.measureText(text).width * 5;

  canvas.width = (textWidth + 20) * scale; // Add some padding
  canvas.height = 50 * scale; // Adjust height as needed
  context.scale(scale, scale);

  // Draw text in the center of the scaled canvas
  context.font = `Bold ${size}px WRONGUN`;
  context.fillStyle = 'gold';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2 / scale, canvas.height / 2 / scale);

  // Create texture and sprite
  const texture = new CanvasTexture(canvas);
  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false // This ensures the sprite doesn't get occluded by other objects
  });
  const sprite = new Sprite(material);

  // Adjust sprite scale if needed
  sprite.scale.set(textWidth / 100, 0.5, 1);
  sprite.scale.set(canvas.width / 40, canvas.height / 40, 1);

  // Billboarding effect: rotate the sprite to always face the camera
  sprite?.quaternion.copy(camera.quaternion);
  sprite?.rotation.copy(camera.rotation);

  // Update the position of the sprite based on model's position
  updateSpritePosition(sprite, yOffset, model, camera);

  scene.add(sprite);

  return sprite;
}

export const updateSpritePosition = (sprite: Sprite, yOffset: number, model: any, camera: Camera) => {
  const offset = new Vector3(0, yOffset, 0);
  const worldPosition = new Vector3();
  model.getWorldPosition(worldPosition);
  sprite.position.copy(worldPosition.add(offset));

  // Make sure sprite is facing the camera
  sprite.lookAt(camera.position);
}
