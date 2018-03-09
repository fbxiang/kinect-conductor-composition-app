export type ChordId = string;
export type GroupId = string;

export enum Instrument {
  Default, PianoLeft, PianoRight, Violin, Bass, Synth1, Synth2, Synth3, Synth4
}

export class Group {
  id: GroupId;
  start: ChordId[];
  duration: number;

  constructor() {
    this.id = "new group";
    this.start = [];
    this.duration = 128;
  }
}

export class Chord {
  constructor(public id: ChordId = 'new chord', public group: GroupId = 'new group',
    public instruments: Instrument[] = [], public duration: number = 16,
    public notes: Note[] = []) {
  }

  clone() {
    return new Chord(this.id, this.group, this.instruments, this.duration,
                     this.notes.map(note => note.clone()));
  }

  static fromJson(json) {
    return new Chord(json.id, json.group, json.instruments, json.duration, json.notes.map(n => Note.fromJson(n)));
  }
}

export class Note {
  public key;
  constructor(key: number | string = 60, public startTime: number = 0, public duration: number = 4) {
    this.key = sanitizeKey(key);
  }

  clone() {
    return new Note(this.key, this.startTime, this.duration);
  }

  static fromJson(json) {
    return new Note(json.key, json.startTime, json.duration);
  }

}

export function midiToName(midi: number) {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const num = Math.floor(midi / 12) - 1;
  const name = names[midi % 12];
  return name + num;
}

export function nameToMidi(name: string) {
  const map = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7,
    'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  }
  let note, num;
  if (name.length == 2) {
    note = name[0].toUpperCase();
    num = Number(name[1]);
  } else if (name.length == 3) {
    note = name[0].toUpperCase() + name[1].toLowerCase();
    num = Number(name[2]);
  } else {
    return NaN;
  }
  const midi = (num + 1) * 12 + map[note];
  return Number(midi);
}

export function sanitizeKey(flux) {
  let val = 'C0';
  if (!isNaN(Number(flux))) {
    val = midiToName(Number(flux))
  } else {
    const n = nameToMidi(flux)
    if (!isNaN(Number(n))) {
      val = midiToName(n);
    }
  }
  return val;
}
