import { MathUtils, Vector3, Quaternion } from "three";

export const getObjectBearing = (quaternion: Quaternion): number => {
  // Forward direction in model's local space
  const forward = new Vector3(0, 0, -1);

  // Apply quaternion to get forward direction in world space
  forward.applyQuaternion(quaternion);

  // Project onto XZ plane by ignoring Y component
  forward.y = 0;
  forward.normalize();

  // Calculate angle in radians between forward direction and north
  let angleRadians = Math.atan2(forward.x, forward.z);

  // Convert angle to degrees
  let angleDegrees = MathUtils.radToDeg(angleRadians);

  // Normalize to 0-360 range
  angleDegrees = (360 - angleDegrees + 360) % 360;

  return angleDegrees;
};
