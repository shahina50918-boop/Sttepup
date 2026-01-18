
export interface Message {
  id: string;
  role: 'user' | 'teacher';
  text: string;
  timestamp: Date;
}

export enum Subject {
  General = 'সাধারণ',
  Quran = 'কুরআন',
  Hadith = 'হাদিস',
  Arabic = 'আরবি',
  Math = 'গণিত',
  English = 'ইংরেজি'
}
