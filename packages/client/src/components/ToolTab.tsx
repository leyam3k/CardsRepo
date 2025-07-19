import React, { useState } from 'react';
import { type Card } from '../store/cardStore';

interface ToolTabProps {
  card: Card;
}

const ToolTab: React.FC<ToolTabProps> = ({ card }) => {
  const [template, setTemplate] = useState(
`Character Summary for {{name}}
Created by: {{creator}}

## Personality
{{personality}}

## Scenario
{{scenario}}

## First Message
{{first_mes}}`
  );
  const [output, setOutput] = useState('');

  const handleGenerate = () => {
    let result = template;
    for (const key in card) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      // @ts-ignore
      result = result.replace(regex, card[key] || '');
    }
    setOutput(result);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <label>Template (use {"{{field_name}}"} for placeholders):</label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          style={{ flex: 1, width: '100%', padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555', resize: 'none', marginTop: '0.5rem' }}
        />
      </div>
      <button onClick={handleGenerate} style={{ padding: '10px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Generate
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <label>Output:</label>
        <textarea
          readOnly
          value={output}
          style={{ flex: 1, width: '100%', padding: '8px', backgroundColor: '#1e1e1e', color: '#ccc', border: '1px solid #555', resize: 'none', marginTop: '0.5rem' }}
        />
      </div>
    </div>
  );
};

export default ToolTab;