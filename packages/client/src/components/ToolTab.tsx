import React, { useState, useEffect, useRef } from 'react';
import { type Card } from '../store/cardStore';

interface Template {
  id: string;
  name: string;
  content: string;
}

interface ToolTabProps {
  card: Card;
  selectedTemplateId: string | null;
  setSelectedTemplateId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ToolTab: React.FC<ToolTabProps> = ({ card, selectedTemplateId, setSelectedTemplateId }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const [saveButtonText, setSaveButtonText] = useState('Save');
  const [duplicateButtonText, setDuplicateButtonText] = useState('Duplicate');
  const templateTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const allCardFields = {
    ...card,
    char: card.name, // Add 'char' as an alias for 'name'
    tags: (card.tags || []).join(', '),
    alternate_greetings: (card.alternate_greetings || []).join('\n'),
    group_only_greetings: (card.group_only_greetings || []).join('\n'),
  };

  const placeholderFields = [
    { label: 'Name', field: 'char' },
    { label: 'Nickname', field: 'nickname' },
    { label: 'Creator', field: 'creator' },
    { label: 'Description', field: 'description' },
    { label: 'Personality', field: 'personality' },
    { label: 'Scenario', field: 'scenario' },
    { label: 'First Message', field: 'first_mes' },
    { label: 'Message Example', field: 'mes_example' },
    { label: 'System Prompt', field: 'system_prompt' },
    { label: 'Post History Instructions', field: 'post_history_instructions' },
    { label: 'Creator Notes', field: 'creator_notes' },
    { label: 'Character Version', field: 'character_version' },
    { label: 'Tags', field: 'tags' },
    { label: 'Alternate Greetings', field: 'alternate_greetings' },
    { label: 'Group Only Greetings', field: 'group_only_greetings' },
    { label: 'Image URL', field: 'imageUrl' },
    { label: 'Language', field: 'language' },
    { label: 'Source URL', field: 'url' },
  ];


  useEffect(() => {
    // Only fetch if templates are not already loaded.
    if (templates.length === 0) {
        fetchTemplates();
    }
  }, [card.id]); // Refetch when the card changes

  // This effect synchronizes the local state with the selected ID from props
  useEffect(() => {
    if (selectedTemplateId === 'new') {
        handleNewTemplate();
    } else if (selectedTemplateId) {
        const selected = templates.find(t => t.id === selectedTemplateId);
        if (selected) {
            setCurrentName(selected.name);
            setCurrentContent(selected.content);
            setOutput('');
        }
    } else if (templates.length > 0) {
        // If the selection is cleared, default to the first template
        handleTemplateSelect(templates[0].id);
    } else {
        // Or create a new one if no templates exist
        handleNewTemplate();
    }
  }, [selectedTemplateId, templates]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/templates');
      let data = await response.json();
      // Sort templates alphabetically by name
      data.sort((a: Template, b: Template) => a.name.localeCompare(b.name));
      
      setTemplates(data);

      // Only set the default if no template is currently selected in the parent state
      if (data.length > 0 && selectedTemplateId === null) {
        // The useEffect hook will now handle the selection and content loading
        setSelectedTemplateId(data[0].id);
      } else if (data.length === 0) {
        handleNewTemplate();
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (id: string) => {
    // This function now only needs to update the parent state.
    // The useEffect above will handle updating the local component's state.
    setSelectedTemplateId(id);
  };
  
  const handleNewTemplate = () => {
    setSelectedTemplateId('new');
    setCurrentName('New Template');
    setCurrentContent('');
    setOutput('');
  };

  const handleSave = async () => {
    if (!currentName) {
      alert("Template name cannot be empty.");
      return;
    }
    const payload = { name: currentName, content: currentContent };
    
    try {
      let response;
      if (selectedTemplateId && selectedTemplateId !== 'new') {
        // Update existing template
        response = await fetch(`http://localhost:3001/api/templates/${selectedTemplateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new template
        response = await fetch('http://localhost:3001/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const savedTemplate = await response.json();
      
      // Optimistically update local state to avoid full refetch and keep selection
      setTemplates(prevTemplates => {
          const newTemplates = selectedTemplateId && selectedTemplateId !== 'new'
            ? prevTemplates.map(t => t.id === savedTemplate.id ? savedTemplate : t)
            : [...prevTemplates, savedTemplate];
          
          // Keep the list sorted
          return newTemplates.sort((a, b) => a.name.localeCompare(b.name));
      });
      
      // Set the newly created/updated template as active
      setSelectedTemplateId(savedTemplate.id);
      setCurrentName(savedTemplate.name);
      setCurrentContent(savedTemplate.content);

      setSaveButtonText('Saved!');
      setTimeout(() => setSaveButtonText('Save'), 2000);

    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedTemplateId) return;
    const templateToDuplicate = templates.find(t => t.id === selectedTemplateId);
    if (!templateToDuplicate) return;

    const payload = { 
        name: `${templateToDuplicate.name} (Copy)`, 
        content: templateToDuplicate.content 
    };

    try {
        const response = await fetch('http://localhost:3001/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const newTemplate = await response.json();
        const updatedTemplates = [...templates, newTemplate].sort((a, b) => a.name.localeCompare(b.name));
        setTemplates(updatedTemplates);
        setSelectedTemplateId(newTemplate.id); // Select the new duplicate

        setDuplicateButtonText('Duplicated!');
        setTimeout(() => setDuplicateButtonText('Duplicate'), 2000);
    } catch (error) {
        console.error("Failed to duplicate template:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplateId || selectedTemplateId === 'new') return;
    if (window.confirm(`Are you sure you want to delete "${currentName}"?`)) {
      try {
        const response = await fetch(`http://localhost:3001/api/templates/${selectedTemplateId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete template');
        }

        // Optimistically update local state
        const updatedTemplates = templates.filter(t => t.id !== selectedTemplateId);
        setTemplates(updatedTemplates);

        // Decide which template to select next
        if (updatedTemplates.length > 0) {
          setSelectedTemplateId(updatedTemplates[0].id);
        } else {
          // If no templates are left, go to the 'new' state
          handleNewTemplate();
        }

      } catch (error) {
        console.error("Failed to delete template:", error);
      }
    }
  };

  const generateTemplateOutput = () => {
    let result = currentContent;
    // Handle {{name}} as an alias for {{char}} for backward compatibility
    result = result.replace(/{{name}}/g, card.name || '');

    for (const key in allCardFields) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      // @ts-ignore
      result = result.replace(regex, String(allCardFields[key] || ''));
    }
    return result;
  }

  const handleGenerate = () => {
    const result = generateTemplateOutput();
    setOutput(result);
  };

  const handleCopy = () => {
    const result = generateTemplateOutput();
    navigator.clipboard.writeText(result).then(() => {
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy'), 2000);
    }).catch(err => {
        console.error('Failed to copy!', err);
        alert('Failed to copy text.');
    });
  };
  
  const insertPlaceholder = (fieldName: string) => {
    const textarea = templateTextAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const placeholder = `{{${fieldName}}}`;
    
    const newText = text.substring(0, start) + placeholder + text.substring(end);
    
    setCurrentContent(newText);

    // Move cursor to after the inserted placeholder
    setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
        textarea.focus();
    }, 0);
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        {/* Top Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select value={selectedTemplateId || 'new'} onChange={(e) => handleTemplateSelect(e.target.value)} style={{ flexGrow: 1, padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                <option value="new">+ New Template</option>
            </select>
            <button onClick={handleSave} style={{ padding: '8px 12px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px' }}>{saveButtonText}</button>
            <button onClick={handleDuplicate} disabled={!selectedTemplateId || selectedTemplateId === 'new'} style={{ padding: '8px 12px', background: '#5c5c5c', color: 'white', border: 'none', borderRadius: '4px', cursor: (!selectedTemplateId || selectedTemplateId === 'new') ? 'not-allowed' : 'pointer' }}>{duplicateButtonText}</button>
            <button onClick={handleDelete} disabled={!selectedTemplateId} style={{ padding: '8px 12px', background: '#da3b01', color: 'white', border: 'none', borderRadius: '4px', cursor: !selectedTemplateId ? 'not-allowed' : 'pointer' }}>Delete</button>
        </div>
      
        {/* Template Name */}
        <input 
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder="Template Name"
            style={{ width: '100%', padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
        />

        {/* Template Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label>Template Content:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.5rem 0' }}>
                {placeholderFields.map(({ label, field }) => (
                    <button key={field} onClick={() => insertPlaceholder(field)} style={{ padding: '4px 8px', fontSize: '12px', background: '#444', color: 'white', border: '1px solid #666', borderRadius: '4px' }}>
                        {label}
                    </button>
                ))}
            </div>
            <textarea
                ref={templateTextAreaRef}
                value={currentContent}
                onChange={(e) => setCurrentContent(e.target.value)}
                style={{ flex: 1, width: '100%', padding: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555', resize: 'none' }}
            />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleGenerate} style={{ flex: 1, padding: '10px', background: '#0078d4', color: 'white', border: 'none', borderRadius: '4px' }}>
                Generate
            </button>
            <button onClick={handleCopy} style={{ flex: 1, padding: '10px', background: '#5c5c5c', color: 'white', border: 'none', borderRadius: '4px' }}>
                {copyButtonText}
            </button>
        </div>
      
        {/* Output */}
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