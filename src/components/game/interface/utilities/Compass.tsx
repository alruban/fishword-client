import React from 'react';
import { World } from '../../../../world';
import { MathUtils, Quaternion } from 'three';
import { getObjectBearing } from '../../tools/getObjectBearing';

interface CompassProps {
  world: World;
}

interface CompassState {
  bearing?: Bearing; // Assuming Bearing is defined elsewhere
}

class Compass extends React.Component<CompassProps, CompassState> {
  private canvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: CompassProps) {
    super(props);
    this.canvasRef = React.createRef<HTMLCanvasElement>();
    this.state = {};
  }

  componentDidMount() {
    const { world } = this.props;
    if (world.players) {
      this.updateSonar(world.players);

      world.loop.updatables.push(this);
    }
  }

  async update() {
    const { world } = this.props;
    if (world.players) {
      this.updateSonar(world.players);
    }
  }

  updateSonar = (players: Players) => {
    const player = players[this.props.world.player.state.id];
    if (!player) return;

    const otherPlayers = Object.values(players).filter(
      otherPlayer => otherPlayer.state.id !== player.state.id,
    );

    const quaternion = new Quaternion(
      player.state.location.player.quaternion.x,
      player.state.location.player.quaternion.y,
      player.state.location.player.quaternion.z,
      player.state.location.player.quaternion.w,
    );

    const playerBearing = {
      degrees: getObjectBearing(quaternion),
      quaternion: player.state.location.player.quaternion,
      position: player.state.location.player.position,
    };

    this.setState({ bearing: playerBearing });
    this.drawCompass(playerBearing.degrees, player, otherPlayers);
  };

  drawCompass = (bearing: number, player: PlayerStorage, otherPlayers: PlayerStorage[]) => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.8; // Adjust the radius as needed

    const primaryColor = '#00FF00'

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw sonar background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    // Draw concentric circles
    ctx.strokeStyle = '#1f77b4'; // Lighter blue for the circles
    for (let i = 1; i <= 4; i++) { // Draw 4 concentric circles
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 4) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw radial lines
    ctx.strokeStyle = '#1f77b4';
    for (let i = 0; i < 360; i += 45) { // Every 45 degrees
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const x = centerX + radius * Math.cos(i * Math.PI / 180);
      const y = centerY + radius * Math.sin(i * Math.PI / 180);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw the cardinal points
    const cardinalPoints = {
      'N': { x: centerX, y: centerY - radius },
      'E': { x: centerX + radius, y: centerY },
      'S': { x: centerX, y: centerY + radius },
      'W': { x: centerX - radius, y: centerY },
    };

    ctx.font = '1.6rem Arial'; // Adjust font size and type as needed
    ctx.fillStyle = primaryColor; // Text color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Adjust the offset to place the text correctly
    const textOffset = 25;

    for (const [point, { x, y }] of Object.entries(cardinalPoints)) {
      let adjustedX = x;
      let adjustedY = y;

      // Adjust the text position slightly based on which cardinal point it is
      if (point === 'N') adjustedY -= textOffset;
      if (point === 'E') adjustedX += textOffset;
      if (point === 'S') adjustedY += textOffset;
      if (point === 'W') adjustedX -= textOffset;

      ctx.fillText(point, adjustedX, adjustedY);
    }

    // Draw the sonar pulse
    const pulseWidth = 2;
    const pulseDistance = (Date.now() / 10) % radius; // Animate the pulse

    ctx.save();
    ctx.translate(centerX, centerY);

    // Use the current bearing from the ref
    ctx.rotate((bearing - 90) * Math.PI / 180);

    // Create a gradient for the sonar pulse
    const gradient = ctx.createLinearGradient(0, -pulseWidth, pulseDistance, pulseWidth);
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0.8)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pulseDistance, -pulseWidth);
    ctx.lineTo(pulseDistance, pulseWidth);
    ctx.closePath();
    ctx.fill();
    ctx.restore();  // Restore the context after drawing the pulse and before drawing the blips

    const maxRadarDistance = 2000;
    const playerPosition = player.state.location.player.position;

    // Draw blips for other players
    otherPlayers.forEach(otherPlayer => {
      const quaternion = new Quaternion(
        otherPlayer.state.location.player.quaternion.x,
        otherPlayer.state.location.player.quaternion.y,
        otherPlayer.state.location.player.quaternion.z,
        otherPlayer.state.location.player.quaternion.w
      );

      const playerBearing = {
        degrees: getObjectBearing(quaternion),
        quaternion: otherPlayer.state.location.player.quaternion,
        position: otherPlayer.state.location.player.position
      }

      const dx = otherPlayer.state.location.player.position.x - playerPosition.x;
      const dz = otherPlayer.state.location.player.position.z - playerPosition.z;

      let distanceToPlayer = Math.sqrt(dx ** 2 + dz ** 2);

      // Skip drawing if the player is out of radar range
      if (distanceToPlayer > maxRadarDistance) return;

      // Calculate the angle to the other player in radians from the player's current position
      let angleToPlayer = Math.atan2(-dz, -dx);

      // Convert player's bearing from degrees to radians and adjust the angle
      let playerBearingRadians = MathUtils.degToRad(playerBearing.degrees);
      let angleRelativeToBearing = angleToPlayer - playerBearingRadians;

      // Ensure angle is between 0 and 2*PI
      angleRelativeToBearing = (angleToPlayer + 2 * Math.PI) % (2 * Math.PI);

      // Calculate blip position
      let blipDistance = distanceToPlayer / maxRadarDistance * radius; // Scale distance to fit radar
      let blipX = centerX + blipDistance * Math.cos(angleRelativeToBearing);
      let blipY = centerY + blipDistance * Math.sin(angleRelativeToBearing);

      // Draw the blip
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(blipX, blipY, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Restore context
    ctx.restore();

    // Optionally, add a central dot to represent the submarine
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();
  };

  render() {
    const { bearing } = this.state;
    return (
      <div className='flex flex-col p-3 select-none rounded-lg max-w-[14.1rem] lg:max-w-[23.6rem] gap-y-3 border border-solid border-key-yellow-inactive bg-key-black-lighter'>
        <div className='border border-solid rounded-lg border-key-yellow-inactive terminal'>
          <canvas ref={this.canvasRef} width="512" height="512" className='w-full'/>
        </div>

        <p className="px-1 pt-[2px] !flex justify-center items-center text-2xs lg:text-sm !shadow-none border border-solid border-key-yellow-inactive rounded-lg text-terminal">
          {bearing?.position ? `${bearing.position.x.toFixed(2)}, ${bearing.position.y.toFixed(2)}, ${bearing.position.z.toFixed(2)}` : ''}
        </p>
      </div>
    );
  }
}

export default Compass;
