export interface EmojiDef {
  emoji: string;
  label: string;
  color: string;
  definition: string;
  sensory: {
    color: string;
    sound: string;
    texture: string;
    temperature: string;
  };
}

export const EMOJI_DEFS: EmojiDef[] = [
  {
    emoji: '😌',
    label: 'Calm',
    color: '#6C5CE7',
    definition: 'A settled stillness. The breath after a long exhale. Music that lets you simply be.',
    sensory: { color: 'soft lavender', sound: 'low hum of a distant fan', texture: 'warm fleece', temperature: 'room temperature' },
  },
  {
    emoji: '🔥',
    label: 'Energy',
    color: '#E17055',
    definition: 'Kinetic ignition. The feeling of becoming more than yourself. Music that moves before you do.',
    sensory: { color: 'deep amber', sound: 'crackling fire', texture: 'dry heat on skin', temperature: 'warm' },
  },
  {
    emoji: '😢',
    label: 'Sad',
    color: '#74B9FF',
    definition: 'The softness inside grief. Not collapse — presence. Music that holds you while you feel.',
    sensory: { color: 'pale blue', sound: 'rain on glass', texture: 'damp cloth', temperature: 'cool' },
  },
  {
    emoji: '😊',
    label: 'Happy',
    color: '#FDCB6E',
    definition: 'Uncomplicated delight. The kind that needs no explanation. Music that smiles back at you.',
    sensory: { color: 'warm yellow', sound: 'distant laughter', texture: 'sunlit surface', temperature: 'gentle warmth' },
  },
  {
    emoji: '🌀',
    label: 'Overstimulated',
    color: '#A29BFE',
    definition: 'Too much at once. Music that matches the noise inside — or cuts through it entirely.',
    sensory: { color: 'blinking static', sound: 'overlapping voices', texture: 'buzzing surface', temperature: 'uneven' },
  },
  {
    emoji: '🌙',
    label: 'Melancholy',
    color: '#636E72',
    definition: 'Ache with beauty in it. Not quite sadness — a longing for something half-remembered.',
    sensory: { color: 'grey-blue moonlight', sound: 'silence between notes', texture: 'cold stone', temperature: 'cool and still' },
  },
  {
    emoji: '✨',
    label: 'Transcendent',
    color: '#FFD700',
    definition: 'The moment music stops being sound and becomes something else. Something without a name.',
    sensory: { color: 'gold and white', sound: 'ringing silence', texture: 'weightless', temperature: 'neither warm nor cold' },
  },
  {
    emoji: '🎯',
    label: 'Focused',
    color: '#00CEC9',
    definition: 'Everything peripheral disappears. Only the work. Music as a tunnel into concentration.',
    sensory: { color: 'sharp teal', sound: 'clean tone', texture: 'smooth glass', temperature: 'slightly cool' },
  },
  {
    emoji: '💙',
    label: 'Connected',
    color: '#0984E3',
    definition: 'The felt sense of not being alone. Music that bridges the distance between self and other.',
    sensory: { color: 'deep blue', sound: 'resonant chord', texture: 'held hand', temperature: 'body temperature' },
  },
  {
    emoji: '😮‍💨',
    label: 'Relief',
    color: '#55EFC4',
    definition: 'The release of something you were holding without knowing. Music that exhales for you.',
    sensory: { color: 'mint green', sound: 'long exhale', texture: 'releasing grip', temperature: 'cool breeze' },
  },
  {
    emoji: '💤',
    label: 'Tired',
    color: '#B2BEC3',
    definition: 'Bone-deep rest need. Music for the edge of sleep — or music that understands exhaustion.',
    sensory: { color: 'soft grey', sound: 'slow breathing', texture: 'heavy blanket', temperature: 'slightly warm' },
  },
  {
    emoji: '🎉',
    label: 'Celebratory',
    color: '#E84393',
    definition: 'Shared joy made loud. Music that insists everyone is invited. Belonging in sound.',
    sensory: { color: 'bright magenta', sound: 'cheering crowd', texture: 'confetti', temperature: 'warm and electric' },
  },
];
