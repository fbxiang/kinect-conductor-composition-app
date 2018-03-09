import * as $ from 'jquery';
import { Chord, Group, Instrument, Note, midiToName, nameToMidi, sanitizeKey } from './types';


export class ChordPropertyEditor {
  chord: Chord = null;
  updateCallback: () => void = () => { };
  toJson = () => { };
  fromJson = () => { };

  constructor(public groups: Group[]) {
    this.render();
  }

  connect(chord, updateCallback) {
    this.chord = chord;
    this.updateCallback = updateCallback;
    this.render();
  }

  disconnect() {
    this.chord = null;
    this.render();
  }

  private addInstrument() {
    this.chord.instruments.push(Instrument.Default);
    this.updateCallback();
  }

  private addNote() {
    this.chord.notes.push(new Note());
    this.updateCallback();
  }


  render() {
    $('editor').html('');
    $('editor').append(
      $('<button/>').text('to json').click(() => {
        this.toJson();
      })
    ).append(
      $('<button/>').text('from json').click(() => {
        this.fromJson();
      })
    )
    if (!this.chord) return;

    const chord = this.chord;
    const updateCallback = this.updateCallback;
    const idRow = $('<div/>')
      .append($('<span/>').text('Id'))
      .append($('<input/>').val(this.chord.id)
        .on('input', function() {
          chord.id = String($(this).val());
          updateCallback();
        }));

    const selectElement = $('<select/>');
    this.groups.forEach(g => {
      selectElement.append($('<option/>').attr('value', g.id).text(g.id));
    })
    selectElement.val(this.chord.group).change(function() {
      chord.group = String($(this).val());
      updateCallback();
    });
    const groupRow = $('<div/>')
      .append($('<span/>').text('Group'))
      .append(selectElement)

    const durationRow = $('<div/>')
      .append($('<span/>').text('Duration'))
      .append($('<input/>').val(this.chord.duration).on('input', function() {
        chord.duration = Number($(this).val());
        updateCallback();
      }).focusout(function() {
        let val = Number($(this).val());
        if (isNaN(val)) val = 0;
        chord.duration = val;
        $(this).val(val);
        updateCallback();
      }));

    const instrumentRow = $('<div/>')
      .append($('<span/>').text("Instruments")).append(
        $('<button/>').text('add').click(() => {
          this.addInstrument(); this.render();
        })
      );
    this.chord.instruments.forEach((thisIns, i) => {
      const selectInstrument = $('<select/>');
      selectInstrument.change(function() {
        chord.instruments[i] = Instrument[String($(this).val())];
        updateCallback();
      })
      for (let ins in Instrument) {
        if (isNaN(Number(ins))) {
          selectInstrument.append($('<option/>').attr('value', ins).text(ins)).val(Instrument[thisIns]);
        }
      }
      selectInstrument.change(x => console.log(x));
      instrumentRow
        .append($('<div/>').css('margin-left', '50px')
          .append(selectInstrument)
          .append(
            $('<button/>').text('delete').click(() => {
              chord.instruments.splice(i, 1);
              this.render();
              updateCallback();
            })
          ))
    })

    const noteRow = $('<div/>')
      .append($('<span/>').text('Notes')).append($('<button/>').text('add').click(() => {
        this.addNote();
        this.render();
        updateCallback();
      }))
    this.chord.notes.forEach((note, i) => {
      noteRow
        .append(
          $('<div/>')
            .append($('<span/>').text('Key').css('margin', '0 5px'))
            .append($('<input/>').val(sanitizeKey(note.key)).css('width', '30px')
                    .on('input', function() {
                      chord.notes[i].key = sanitizeKey($(this).val())
                      updateCallback();
                    })
                    .focusout(function() {
                      let val = sanitizeKey($(this).val());
                      chord.notes[i].key = val;
                      $(this).val(val);
                      updateCallback();
                    }))
            .append($('<span/>').text('Start at').css('margin', '0 5px'))
            .append($('<input/>').val(note.startTime).css('width', '30px')
                    .on('input', function() {
                      chord.notes[i].startTime = Number($(this).val());
                      updateCallback();
                    })
                    .focusout(function() {
                      let val = Number($(this).val());
                      if (isNaN(val)) val = 0;
                      chord.notes[i].startTime = val;
                      $(this).val(val);
                      updateCallback();
                    }))
            .append($('<span/>').text('Duration').css('margin', '0 5px'))
            .append($('<input/>').val(note.duration).css('width', '30px')
                    .on('input', function() {
                      chord.notes[i].duration = Number($(this).val());
                      updateCallback();
                    })
                    .focusout(function() {
                      let val = Number($(this).val());
                      if (isNaN(val)) val = 0;
                      chord.notes[i].duration = val;
                      $(this).val(val);
                      updateCallback();
                    }))
            .append($('<button/>').text('del').click(() => {
              chord.notes.splice(i, 1);
              this.render();
              updateCallback();
            }))
        )
    })

    $('editor')
      .append(idRow)
      .append(groupRow)
      .append(durationRow)
      .append(instrumentRow)
      .append(noteRow);
  }
}
