import io, { Socket } from 'socket.io-client';

export class Network {
  public players: Players;
  public player: PlayerStorage;
  public socket: Socket;
  public eventTarget: HTMLElement = document.body;

  constructor(player: PlayerStorage) {
    this.players = {} as Players;
    this.player = player;

    this.socket = io("https://api.idiot.surf", {
      withCredentials: true,
      transports: ['websocket', 'polling'] // Explicitly specify transports
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      this.logWithColor('You are now connected to FishWorld');
    });

    // Synchronises this player with the data on the server.
    this.socket.on('player:init', (players: Players) => {
      this.players = players;
      this.player = players[this.player.state.id] ?? this.player;

      // Emit a custom event indicating that players data is initialized
      const event = new Event('network:initialised');
      this.eventTarget.dispatchEvent(event);
    });

    // Listens for other players joining the game.
    this.socket.on('player:new', (player: PlayerStorage) => {
      this.players[player.state.id] = player;
      this.logWithColor('A new player has entered FishWorld', player)
    });

    // Listens for when this player, or other players, move.
    this.socket.on('player:moved', (state: PlayerState) => {
      // @ts-expect-error
      if (this.players[state.id]) this.players[state.id].state = state;
    });

    // Listens for other players leaving the game.
    this.socket.on('player:left', (id: number) => {
      delete this.players[id];
      this.logWithColor('A player has left FishWorld', id)
    });
  }

    /**
   * Prints a stylised console log to indicate the various states
   * that the component is in.
   *
   * @param text
   */
    logWithColor(text: string, data?: any) {
      console.log(
        `%c${text}`,
        "color: yellow; background: black; padding: 4px; border-radius: 2px;"
      );
      if (data) console.table(data);
    }
}
