import React from 'react';
import type { World } from '../../../../world';
import PlayerPortrait from '../../models/player/portrait';

interface UserPortraitProps {
  world: World;
}

interface UserPortraitState {
  portraitUrl: string;
}

class UserPortrait extends React.Component<UserPortraitProps, UserPortraitState> {
  constructor(props: UserPortraitProps) {
    super(props);
    this.state = {
      portraitUrl: '',
    };
  }

  componentDidMount() {
    const { world } = this.props;
    if (world) {
      this.updatePortrait();

      world.loop.updatables.push(this);
    }
  }

  componentDidUpdate(prevProps: UserPortraitProps) {
    if (this.props.world !== prevProps.world) {
      this.updatePortrait();
    }
  }

  updatePortrait = () => {
    const { world } = this.props;
    const player = world.entities.get('player');
    const playerPortrait = player?.getComponent('PlayerPortrait') as PlayerPortrait;
    this.setState({
      portraitUrl: playerPortrait?.getPortraitDataUrl() || '', // Assuming getPortraitDataUrl returns a string or undefined
    });
  };

  async update() {
    this.updatePortrait();
  }

  render() {
    const { portraitUrl } = this.state;
    const { world } = this.props;

    return (
      <div className="flex flex-col-reverse items-center justify-between gap-2 font-creep">
        <div className="text-md">
          <div className="flex uppercase text-body gap-x-2">
            <p className="px-2 border border-solid rounded-lg border-key-yellow-inactive h-fit">
              {world.player.state.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center w-fit gap-y-3">
          <div className="w-[14.1rem] h-[14.1rem] rounded-lg aspect-square p-2 border border-key-yellow-inactive border-solid bg-key-black-lighter">
            <div
              className="w-full h-full bg-contain"
              style={{ backgroundImage: `url(${portraitUrl})` }}
            >
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default UserPortrait;
