'use babel';

import PgFormatView from './pg-format-view';
import { CompositeDisposable } from 'atom';
import { spawn } from 'child_process';
import Streamify from 'streamify-string';

export default {
  pgFormatView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.pgFormatView = new PgFormatView(state.pgFormatViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.pgFormatView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'pg-format:pretty': () => this.pretty()
      })
    );
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.pgFormatView.destroy();
  },

  serialize() {
    return {
      pgFormatViewState: this.pgFormatView.serialize()
    };
  },

  pretty() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      let selection = editor.getSelectedText();

      const proc = spawn('pg_format');
      const str = new Streamify(selection);
      str.pipe(proc.stdin);
      proc.stdout.on('data', chunk => {
        atom.notifications.addSuccess(`${chunk}`);
        editor.insertText(`${chunk}`);
      });
      proc.stdout.on('error', error => {
        atom.notifications.addError(error);
      });
    }
  }
};
