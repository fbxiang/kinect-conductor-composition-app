import * as $ from 'jquery';
import './style.css';
import * as joint from 'jointjs';
import { Note, Chord, Group, nameToMidi, midiToName } from './types';
import { ChordPropertyEditor } from './editor';
import * as tone from 'tone';

const canvas = <HTMLCanvasElement>document.getElementById('render_canvas');
const graph = new joint.dia.Graph;

const paper = <any>new joint.dia.Paper(<any>{
  el: $('#paper'),
  width: 5000,
  height: 5000,
  gridSize: 1,
  model: graph,
  linkPinning: false
});

function LoadFromJson(json) {
  graph.fromJSON(JSON.parse(json));
  graph.getCells().filter(c => !c.prop('celltype')).forEach(c => c.prop('celltype', 'state'));
  const stateCells = graph.getCells().filter(c => c.prop('celltype') == 'state');
  stateCells.forEach(cell => cell.prop('chord', Chord.fromJson(cell.prop('chord'))));
  stateCells.forEach(cell => updateStateCell(cell));
}

function SaveToJson() {
  const jsonGraph = graph.toJSON();
  jsonGraph.cells.forEach(cell => cell.selected = false);
  return JSON.stringify(jsonGraph);
}

restore();

let selected: joint.dia.Cell = null;
const groups = [new Group()];
const editor = new ChordPropertyEditor(groups);
editor.toJson = () => {
  download('MusicGraph.json', SaveToJson());
}

editor.fromJson = () => {
  $('#fileinput').click();
}
$('#fileinput').change((evt) => {
  const f = (<any>evt.target).files[0];
  if (f) {
    const r = new FileReader();
    r.onload = function(e) {
      const contents = (<any>e.target).result;
      LoadFromJson(contents);
    }
    r.readAsText(f);
  } else {
    alert("Failed to load file");
  }
})


function select(cell: joint.dia.Cell) {
  editor.disconnect();
  if (selected) {
    selected.prop('selected', false);
    updateStateCell(selected);
  }
  selected = cell;
  cell.prop('selected', true);
  updateStateCell(cell);
  editor.connect(cell.prop('chord'), () => updateStateCell(selected));
}

function del(cell: joint.dia.Cell) {
  if (!cell) return;
  if (cell == selected) {
    editor.disconnect();
    selected = null;
  }
  graph.removeCells([cell]);
  updateStateCell(cell);
}

function CreateState(x, y) {
  const cell = new joint.shapes.basic.Rect({
    position: { x, y },
    size: { width: 160, height: 60 }
  }).prop('chord', new Chord()).prop('selected', false).prop('celltype', 'state');
  graph.addCell(cell);
  select(cell);
  return cell;
};

function CreateLink(start: joint.dia.Cell, end: joint.dia.Cell) {
  const link = new joint.dia.Link({
    source: { id: start.id }, target: { id: end.id },
  }).attr({
    '.marker-arrowhead[end="source"]': { d: '' },
    '.marker-arrowhead[end="target"]': { d: 'M 10 0 L 0 5 L 10 10 z' },
    '.tool-options': { display: 'none' }
  }).prop('celltype', 'link');
  console.log(link);
  graph.addCell(link);
  return link;
}

function updateStateCell(cell) {
  cell.attr({
    rect: { stroke: cell.prop('selected') ? 'blue' : 'black' },
    text: {
      // markup: "<div>test</div>",
      text: `${cell.prop('chord')['id']}
${cell.prop('chord')['duration'] / 4} beats, ${cell.prop('chord')['notes'].length} notes,
${cell.prop('chord')['instruments'].length} instruments`
    }
  });
  store();
}

function ToJson() {
  console.log(
    graph.toJSON()
  )
}

paper.on('blank:contextmenu', (evt, x, y) => {
  CreateState(x, y);
});

paper.on('cell:contextmenu', (cellview, evt, x, y) => {
  const cell = cellview.model;
  const cell2 = cell.clone();
  cell2.prop('position', { x, y })
  cell2.prop('chord', cell.prop('chord').clone());
  cell2.prop('chord').id = cell2.prop('chord').id + ' clone';
  graph.addCell(cell2);
  select(cell2);
  updateStateCell(cell2);
})

paper.on('cell:pointerdown', (cellview: joint.dia.CellView, evt, x, y) => {
  if (cellview.model.prop('celltype') != 'state') return;
  if (!evt.shiftKey) {
    select(cellview.model);
  }
  else {
    if (selected != cellview.model && cellview.model.prop('celltype') == 'state') {
      CreateLink(selected, cellview.model);
    }
    select(cellview.model);
  }
})

paper.on('cell:update', cellview => {
  updateStateCell(cellview.model);
})

paper.on('mouseover', function() { console.log('xx') })

$(document).on('keydown', function(evt) {
  if (evt.keyCode == 46) {
    del(selected);
  } else if (evt.key == 's' && evt.ctrlKey) {
    evt.preventDefault();
    // download('MusicGraph.json', SaveToJson());
    store();
  } else if (evt.key == ' ' && selected) {
    evt.preventDefault();
    playChord(selected.prop('chord'));
  }
})

function store() {
  localStorage.setItem('graph', SaveToJson());
}

function restore() {
  if (localStorage.getItem('graph')) {
    LoadFromJson(localStorage.getItem('graph'));
  }
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

var synths = [
  new tone.Synth().toMaster(), new tone.Synth().toMaster(),
  new tone.Synth().toMaster(), new tone.Synth().toMaster(),
  new tone.Synth().toMaster(), new tone.Synth().toMaster(),
  new tone.Synth().toMaster(), new tone.Synth().toMaster()];
function playChord(chord: Chord) {
  const notes = new Map<number, Note[]>();
  chord.notes.forEach(note => {
    if (!notes.get(note.startTime)) {
      notes.set(note.startTime, []);
    }
    notes.get(note.startTime).push(note);
  })
  notes.forEach((notes, startTime) => {
    for (let i = 0; i < Math.min(notes.length, synths.length); i++) {
      synths[i].triggerAttackRelease(notes[i].key, notes[i].duration * 0.15, `+${notes[i].startTime * 0.15}`);
    }
  });
}
