import React, { useEffect } from 'react';
import { Button } from './Button';
import { handleCopy } from './handlers/handleCopy';
import { handlePaste } from './handlers/handlePaste';

export const App: React.FC = () => {
  const onCopy = () => {
    parent.postMessage(
      {
        pluginMessage: { type: 'coping' },
      },
      '*'
    );
  };

  useEffect(() => {
    window.onmessage = async (event) => {
      const { type, payload } = event.data.pluginMessage;
      if (type === 'coping-complete') {
        await handleCopy(payload);
      }
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '10px'
      }}
    >
      <Button onClick={onCopy}>
        Copy Node
      </Button>
      <Button onClick={handlePaste}>Paste Node</Button>
    </div>
  );
};
