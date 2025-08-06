import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Socket } from 'socket.io-client';

interface ChatboxProps {
  socket: Socket;
  storage: PlayerStorage;
}
const tabs = {
  all: {
    tab: 'all',
    shorthand: 'a'
  },
  local: {
    tab: 'local',
    shorthand: 'l'
  },
  world: {
    tab: 'world',
    shorthand: 'w'
  },
}

const Chatbox: React.FC<ChatboxProps> = ({ socket, storage }) => {
  const [currentTab, setCurrentTab] = useState(tabs.all);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<PlayerMessage[]>([]);
  const inputEl = useRef<HTMLInputElement>(null);
  const messagesEl = useRef<HTMLUListElement>(null);

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    /** Pressing / will focus the input element */
    if (e.code === 'Slash' || e.code === 'Enter') {
      inputEl.current?.focus();
    }

    /** Pressing Escape will blur the input element when it's currently the document's active element */
    if (e.code === 'Escape' && inputEl.current && document.activeElement === inputEl.current) {
      e.preventDefault();
      inputEl.current?.blur();
    }
  })

  /** Click outside of the input, blurs it. Disengages text input */
  document.addEventListener('mousedown', (e) => {
    if (inputEl.current !== e.target && document.activeElement === inputEl.current) inputEl.current?.blur();
  })

  useEffect(() => {
     // Define the listener function as a constant so it can be referenced later
     const messageListener = (message: PlayerMessage) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };


    // Listen for incoming local messages
    socket.on('chat:message', messageListener);

    return () => {
      socket.off('chat:message', messageListener);

      if (messagesEl.current) messagesEl.current.scrollTop = messagesEl.current.scrollHeight;
    };
  }, [messages]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Handle DATETIME
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', ' -');

    // Handle Scope
    const validScopes = ['local', 'l', 'world', 'w']

    let scope = currentTab.tab === tabs.all.tab ? tabs.local.tab : currentTab.tab;
    let sanitisedMessage = message;

    if (message[0] === '/') {
      scope = String(message.split(' ')[0]?.replace('/', '')); // 'world' | 'local'
      sanitisedMessage = message.replace(`/${scope} `, '')
    }

    if (sanitisedMessage.length === 0) return;

    if (validScopes.includes(scope)) {
      socket.emit('chat:message', {
        type: scope,
        content: sanitisedMessage,
        from: storage.state.name,
        id: storage.state.id,
        time: formattedDateTime
      } as PlayerMessage);

      setMessage('');
    } else {
      socket.emit('chat:message', {
        type: 'error',
        content: `Error /${scope} is not a valid discussion scope.`,
        from: storage.state.name,
        id: storage.state.id,
        time: formattedDateTime
      } as PlayerMessage);
    }

    inputEl.current?.blur();
  };

  const getChatStyle = (type: string) => {
    switch (type) {
      case tabs.local.tab:
      case tabs.local.shorthand:
        return 'text-chat-local';
      case tabs.world.tab:
      case tabs.world.shorthand:
        return 'text-chat-world';
      case 'error':
        return 'text-chat-error';
    }
  }

  return (
    <div className='w-full'>
      <form
        className='flex flex-col w-full p-3 border border-solid rounded-lg select-none border-key-yellow-inactive gap-y-2 h-fit bg-key-black-lighter'
        onSubmit={sendMessage}
      >
        <div className='relative flex p-2 border border-solid rounded-lg w-fit gap-x-2 z-1 bg-key-black-darker border-key-yellow-inactive'>
          <button
            className={`key key--wide key--yellow ${currentTab.tab === tabs.all.tab ? 'key--yellow--active' : ''}`}
            onClick={() => setCurrentTab(tabs.all)}
            type='button'
          >
            All
          </button>
          <button
            className={`key key--wide key--green ${currentTab.tab === tabs.local.tab ? 'key--green--active' : ''}`}
            onClick={() => setCurrentTab(tabs.local)}
            title='/local'
            type='button'
          >
            Local
          </button>
          <button
            className={`key key--wide key--red ${currentTab.tab === tabs.world.tab ? 'key--red--active' : ''}`}
            onClick={() => setCurrentTab(tabs.world)}
            title='/world'
            type='button'
          >
            Global
          </button>
        </div>

        <div className='flex flex-col p-2 border border-solid rounded-lg text-terminal bg-key-black-darker border-key-yellow-inactive'>
          <div className='flex-grow'>
            <ul
              className='mt-auto h-[10rem] overflow-auto text-md'
              ref={messagesEl}
            >
              {
                messages ? messages.map((message, index) => (
                  (message.type === currentTab.tab || message.type[0] === currentTab.shorthand) || message.type === 'error' || currentTab.tab === tabs.all.tab ?
                    <li
                      key={`message-${index}`}
                      className={getChatStyle(message.type)}
                    >
                      <p>
                        <span>
                          [{message.type.charAt(0)}]: {}
                        </span>
                        <span>
                          {message.from}: {message.content}
                        </span>
                      </p>
                    </li>
                    : null
                )) : null
              }
            </ul>
          </div>
        </div>

        <div className='flex gap-x-2'>
          <div className='flex items-center justify-center flex-grow border border-solid rounded-lg border-key-yellow-inactive'>
            <input
              type="text"
              ref={inputEl}
              className='w-full px-3 text-sm text-terminal placeholder:opacity-50 text-chat-local'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={currentTab.tab === tabs.all.tab ? 'Write something locally with /l, or globally with /w' : currentTab.tab === tabs.local.tab ? "You're talking locally..." : "You're talking globally..."}
            />
          </div>
          <div className='border border-solid rounded-lg border-key-yellow-inactive'>
            <button
              className='key key--wide key--green key--green--active'
              type="submit"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Chatbox;
