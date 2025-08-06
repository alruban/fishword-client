import React, { useState, useEffect, useRef } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [bootMessages, setBootMessages] = useState<string[][]>([]);
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [currentChar, setCurrentChar] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);
  const [output, setOutput] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const messages: string[][] = [
      [
        "Starting Secure Shell Daemon sshd[255]: OK",
        "Generating RSA key pair for session... OK",
        "Attempting to establish secure tunnel to gateway.cia.gov..."
      ],
      [
        "Tunnel established.",
        "Navigating to /NKREGIME/2002/KIMJONGIL/LEAKS/PROJECTS/FISHWORLD...",
        "Failed projects directory mounted."
      ],
      [
        "Launching 'FISHWORLD'...",
        "Loading project assets from /프로젝트_지연/거리/피쉬월드.dos", // /PROJECT_RETARD/DIST/FISHWORLD.dos
        "CIA.GOV와의 악수................", // HANDSHAKING WITH CIA.GOV
        "상태: 온라인", // STATUS: ONLINE
        "환영", // WELCOME
        "친애하는 지도자님" // DEAR LEADER
      ],
      [
        "이제 끝났어, 조니. 끝났어!",
        "아무것도 끝나지 않았습니다! 아무것도 아님! 그냥 끌 수는 없습니다!",
        "그건 내 전쟁이 아니었어. 당신은 나에게 물었지만 나는 당신에게 묻지 않았습니다!",
        "나는 이기기 위해 모든 것을 다 했지만 누군가가 우리가 이기도록 놔두지 않았습니다.",
        "그리고 집 공항에서는 구더기들이 항의하고 있었습니다.",
        "그들은 나에게 침을 뱉고, 나를 아기 살인자라고 불렀고, 그런 짓을 했습니다!",
        "그들이 거기에 없었고 경험하지도 않았는데 왜 나에게 항의합니까?",
        "힘들었지만 그건 과거의 일이에요.",
        "당신을 위한! 민간인 생활은 나에게 아무 의미가 없습니다. 거기에는 명예 규정이있었습니다.",
        "당신은 내 뒤를 조심하고, 나는 당신의 뒤를 조심하세요. 여기에는 아무것도 없습니다!",
        "당신은 정예병의 마지막 부대입니다. 이대로 끝내지 마십시오.",
        "그곳에서 나는 헬리콥터를 몰고, 탱크를 운전하고, 수백만 달러 상당의 장비를 가지고 있었습니다.",
        "여기서는 주차도 할 수 없어요!",
        "모두 어디에 있나요?",
        "우리 곁에 있어준 친구가 있었어요.",
        "이 사람들이 다 있었어요. 이런 대단한 사람들이 다 있었구나!",
        "내 친구들!",
        "여기에는 아무것도 없습니다! 댄 포레스트(Dan Forest)를 기억하시나요?",
        "그는 검은색 머리띠를 착용했다. 그는 마법 마커를 발견했고,",
        "그 사람이 라스베가스로 보낸 건 우리가 늘 그 얘기를 했었거든요.",
        "Chevy Convertible에 대해 우리는 타이어가 떨어질 때까지 운전하고 싶었습니다.",
        "이 헛간 중 한 곳에서 한 아이가 일종의 신발 청소 상자를 가지고 우리에게 왔습니다.",
        "''빛나는?''",
        "그는 계속해서 물었다. 조는 그렇다고 말했다.",
        "나는 맥주 두 잔을 사러 갔다. 상자는 유선으로 연결되어 있었습니다. 그 사람이 열었는데...",
        "신체 일부가 여기저기 날아다니고 있었습니다.",
        "그는 거기 누워서 비명을 질렀습니다... 그 사람의 모든 조각이 나한테 있어요!",
        "그냥 그렇습니다. 난 그 사람을 나한테서 떼어내려고 노력 중이야, 친구! 난 그 사람으로 덮여있어!",
        "곳곳에 피가 흐르고... 난 그를 붙잡으려고 노력해요",
        "그런데 내장이 계속 나오네요!",
        "그리고 아무도 도와주지 않을 거예요!",
        "그는 방금 '집에 가고 싶어요!'라고 말하고 내 이름을 불렀습니다.",
        "집에 가고 싶어, 조니! 난 내 쉐보레를 운전하고 싶어!",
        "하지만 그 사람의 다리는 찾을 수 없었어요.",
        "''다리를 찾을 수 없어요!''",
        "머리에서 지울 수가 없어요. 7년 전이에요.",
        "나는 그것을 매일 봅니다.",
        "가끔 잠에서 깨어나 내가 어디에 있는지 알 수 없을 때도 있습니다. 난 아무한테도 얘기 안 해요.",
        "때로는 하루 종일.",
        "때로는 일주일.",
        "머리에서 지울 수가 없어요.",
      ] // RAMDBO SPEECH FROM END OF FILM

    ];
    setBootMessages(messages);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        setActive(false); // Stop the boot process
        onComplete(); // Invoke callback to transition to the next screen
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setActive(false); // Stop the boot process
        onComplete(); // Invoke callback to transition to the next screen
      }
    };

    document.body.addEventListener('keydown', handleKeyDown); // Mouse Skip
    document.body.addEventListener('touchstart', handleTouchStart); // Touch Skip

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown); // Mouse Skip
      document.body.removeEventListener('touchstart', handleTouchStart); // Touch Skip
    };
  }, [onComplete]);

  useEffect(() => {
    const typeNextChar = () => {
      if (!active) return;

      if (containerRef.current) {
        // Scroll to the bottom with each new line
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }

      if (currentBlock < bootMessages.length) {
        const lines = bootMessages[currentBlock];
        if (lines && currentLine < lines.length) {
          const line = lines[currentLine];
          if (!line) return;

          if (currentChar < line.length) {
            setOutput((prevOutput) => [...prevOutput, String(line[currentChar])]);
            setCurrentChar(currentChar + 1);
          } else {
            setOutput((prevOutput) => [...prevOutput, '\n']);
            setCurrentLine(currentLine + 1);
            setCurrentChar(0);
          }
        } else {
          setCurrentBlock(currentBlock + 1);
          setCurrentLine(0);
          setCurrentChar(0);
          setOutput([]);
          if (currentBlock === bootMessages.length - 1) {
            setActive(false); // Mark boot process as completed
            onComplete(); // Invoke onComplete to transition to the next screen
          }
        }
      }
    };

    const delay = currentChar === 0 ? 250 : 7.5;
    const timeoutId = setTimeout(typeNextChar, delay);

    return () => clearTimeout(timeoutId);
  }, [bootMessages, currentBlock, currentLine, currentChar, active, onComplete]);

  const renderOutput = () => {
    return output.map((char, index) => (
      char === '\n' ? <br key={`boot-${index}`} /> : <span key={`boot-${index}`}>{char}</span>
    ));
  };

  return (
    <div
      className='w-full h-full overflow-hidden whitespace-pre select-none'
      ref={containerRef}
    >
      {renderOutput()}
      <span ref={cursorRef} className="cursor">&#9608;</span>
    </div>
  );
};

export default BootScreen;
