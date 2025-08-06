import React from 'react';

interface LoaderProps {
  state: 'active' | 'inactive'
}

export const Loader: React.FC<LoaderProps> = ({ state }) => {
  if (state === 'inactive') return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center w-screen h-screen -mt-5 -ml-5 bg-black z-1">
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="60" viewBox="0 0 400 60">
        <rect x="1" y="1" width="398" height="58" fill="black" stroke="orange" strokeWidth="2"/>
        <text x="10" y="40" fontFamily="monospace" fontSize="20px" fill="orange">LOADING...</text>
        <rect x="5" y="45" width="390" height="10" fill="black"/>
        <rect x="5" y="45" width="0" height="10" fill="orange">
          <animate attributeName="width" from="0" to="390" dur="5s" repeatCount="indefinite"/>
        </rect>
      </svg>
    </div>
  )
}
