import { translations } from '../../constants';
import { buildChatRequest, getConnectionStatus, KEYBOARD_AVOIDING_BEHAVIOR, KEYBOARD_VERTICAL_OFFSET, resolveAssistantText } from '../HomeScreen';
import { styles } from '../../theme/styles';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('HomeScreen screen contracts', () => {
  it('builds the expected Ollama chat payload with the current model and prior messages', () => {
    const previousMessages = [
      { id: 'm1', role: 'assistant' as const, text: 'Hi there' },
      { id: 'm2', role: 'user' as const, text: 'hello' },
    ];

    expect(buildChatRequest('qwen2.5-coder:7b', previousMessages, 'next question')).toEqual({
      model: 'qwen2.5-coder:7b',
      messages: [
        { role: 'assistant', content: 'Hi there' },
        { role: 'user', content: 'hello' },
        { role: 'user', content: 'next question' },
      ],
    });
  });

  it('resolves the assistant response from the Ollama response format', () => {
    expect(resolveAssistantText({ message: { content: 'hello from ollama' } }, 'fallback')).toBe('hello from ollama');
    expect(resolveAssistantText({ content: 'plain content' }, 'fallback')).toBe('plain content');
    expect(resolveAssistantText({ response: 'legacy response' }, 'fallback')).toBe('legacy response');
    expect(resolveAssistantText(undefined, 'fallback')).toBe('fallback');
  });

  it('returns the language-aware connection status label', () => {
    expect(getConnectionStatus({
      serverUrl: 'http://localhost:11434',
      selectedModel: 'qwen2.5-coder:7b',
      availableModels: ['qwen2.5-coder:7b'],
      language: 'en',
      lastConnectionState: 'success',
      lastConnectionMessage: 'Connection successful',
      dialog: null,
    }, translations.en)).toEqual({ label: 'Connection successful', color: '#22C55E' });

    expect(getConnectionStatus({
      serverUrl: 'http://localhost:11434',
      selectedModel: 'qwen2.5-coder:7b',
      availableModels: ['qwen2.5-coder:7b'],
      language: 'fr',
      lastConnectionState: 'error',
      lastConnectionMessage: 'Connection failed',
      dialog: null,
    }, translations.fr)).toEqual({ label: 'Connexion échouée', color: '#EF4444' });
  });

  it('keeps the keyboard and message layout contract stable', () => {
    expect(KEYBOARD_AVOIDING_BEHAVIOR).toBe('padding');
    expect(KEYBOARD_VERTICAL_OFFSET).toBe(88);
    expect(styles.messageBubble).toMatchObject({
      marginHorizontal: 16,
      maxWidth: '82%',
    });
  });
});
