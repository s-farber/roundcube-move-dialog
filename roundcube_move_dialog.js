/**
 * Move Dialog
 *
 * Searchable "move to folder" dialog with type-ahead completion.
 *
 * @license MIT
 */
rcmail.addEventListener('init', function () {
  var dialog = {
    el: null,
    input: null,
    list: null,
    folders: [],
    matches: [],
    active: 0,
  };

  function folder_label(folder) {
    var el = document.createElement('textarea');
    el.innerHTML = folder.name;
    return el.value.replace(/^\u00a0+\s*/, '').trim();
  }

  function collect_folders() {
    var out = [];
    var mailboxes = rcmail.env.mailboxes || {};

    for (var id in mailboxes) {
      var folder = mailboxes[id];

      // Skip virtual rows (headers like "Folders") and the folder we are
      // already in: moving to the current folder is a no-op in the backend.
      if (!folder || folder.virtual || folder.id === rcmail.env.mailbox) {
        continue;
      }

      out.push({ id: folder.id, name: folder_label(folder), level: folder.level || 0 });
    }

    out.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    return out;
  }

  function render_matches() {
    dialog.list.empty();
    dialog.active = 0;

    if (!dialog.matches.length) {
      $('<li>').addClass('move-dialog-empty').text(rcmail.gettext('nofoldersmatch')).appendTo(dialog.list);
      return;
    }

    dialog.matches.forEach(function (folder, i) {
      $('<li>')
        .attr('data-index', i)
        .attr('data-id', folder.id)
        .toggleClass('selected', i === 0)
        .text(folder.name)
        .appendTo(dialog.list);
    });
  }

  function filter() {
    var term = dialog.input.val().trim().toLowerCase();
    dialog.matches = dialog.folders.filter(function (folder) {
      return !term || folder.name.toLowerCase().indexOf(term) >= 0;
    });

    // Rank prefix matches above mid-string ones so typing "ar" reaches
    // "Archive" before "Mailing Lists/archived-things".
    if (term) {
      dialog.matches.sort(function (a, b) {
        var ap = a.name.toLowerCase().indexOf(term) === 0 ? 0 : 1;
        var bp = b.name.toLowerCase().indexOf(term) === 0 ? 0 : 1;
        return ap - bp || a.name.localeCompare(b.name);
      });
    }

    render_matches();
  }

  function move_to(index) {
    var folder = dialog.matches[index];

    if (!folder) {
      return;
    }

    var uids = rcmail.message_list ? rcmail.message_list.get_selection() : [];

    if (!uids.length) {
      uids = rcmail.env.uid ? [rcmail.env.uid] : [];
    }

    if (!uids.length) {
      return;
    }

    rcmail.command('move', { id: folder.id, uids: uids });
    close();
  }

  function open() {
    if (!rcmail.env.mailboxes) {
      return;
    }

    if (!dialog.el) {
      build();
    }

    dialog.folders = collect_folders();
    dialog.input.val('');
    filter();
    dialog.el.dialog('open');
    dialog.input.trigger('focus');
  }

  function close() {
    if (dialog.el) {
      dialog.el.dialog('close');
    }
  }

  function build() {
    var body = $('<div>').addClass('move-dialog-body');
    var input = $('<input>')
      .attr({ type: 'text', id: 'move-dialog-input', autocomplete: 'off' })
      .attr('placeholder', rcmail.gettext('typetofilterfolders'));
    var list = $('<ul>').addClass('move-dialog-list').attr('role', 'listbox');

    input.on('input', filter);
    input.on('keydown', function (e) {
      var count = dialog.matches.length;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        if (!count) {
          return;
        }

        dialog.active = (dialog.active + (e.key === 'ArrowDown' ? 1 : count - 1)) % count;
        dialog.list.children().removeClass('selected');
        dialog.list.children().eq(dialog.active).addClass('selected');

        var selected = dialog.list.children().eq(dialog.active)[0];
        if (selected && selected.scrollIntoView) {
          selected.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        move_to(dialog.active);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });

    list.on('click', 'li[data-id]', function () {
      move_to(parseInt($(this).attr('data-index'), 10));
    });

    // Keep keystrokes inside the dialog: without this, letters typed to
    // filter also reach the shortcut handler and the message list.
    body.on('keydown keypress keyup', function (e) {
      e.stopPropagation();
    });

    body.append(input).append(list);

    dialog.el = $('<div>')
      .attr('id', 'move-dialog')
      .attr('title', rcmail.gettext('movetofolder'))
      .append(body)
      .appendTo(document.body)
      .dialog({
        autoOpen: false,
        modal: true,
        resizable: false,
        width: 400,
        dialogClass: 'move-dialog',
      });

    dialog.input = input;
    dialog.list = list;
  }

  rcmail.move_dialog = { open: open, close: close };

  rcmail.register_command('move-to-folder', open, true);
});
