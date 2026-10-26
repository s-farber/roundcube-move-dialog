# roundcube-move-dialog

A small Roundcube plugin that adds a **searchable "move to folder" dialog**,
driven by a keyboard shortcut.

Roundcube's built-in move action shows a flat folder tree with no way to filter
it, and in the mail task it is only reachable by dragging a message. This plugin
gives you a dialog with a filter input: type part of a folder name, pick the
match, and the selected messages are moved.

## Features

- Type-ahead filtering over all non-virtual mail folders
- Prefix matches ranked above mid-string matches
- Keyboard driven: arrows to navigate, Enter to move, Escape to close
- Works on one message or a whole selection
- Skips the folder you are currently in, since moving there is a no-op

## Requirements

- Roundcube 1.6 or newer
- The bundled `jqueryui` plugin, enabled (the dialog widget comes from it)

## Installation

Clone into your Roundcube `plugins` directory:

```sh
cd /path/to/roundcube/plugins
git clone https://github.com/s-farber/roundcube-move-dialog.git roundcube_move_dialog
```

The checkout directory **must be named `roundcube_move_dialog`** (underscores,
not dashes). Roundcube loads `plugins/<name>/<name>.php` and instantiates the
class `<name>` verbatim, and PHP class names cannot contain dashes. The three
places that must agree are the directory name, the file name, and the class
name, plus the entry you add to `config/config.inc.php` below.

Enable it in `config/config.inc.php`:

```php
$config['plugins'] = array(
    'jqueryui',
    'keyboard_shortcuts',
    'roundcube_move_dialog',
);
```

`jqueryui` is bundled with Roundcube but is not enabled by default. It must be
listed before `roundcube_move_dialog`.

### Installing from a local checkout

If you would rather develop against a local copy than clone into `plugins`, use
a symlink so your edits are live:

```sh
ln -s /home/you/Development/roundcube_move_dialog /path/to/roundcube/plugins/roundcube_move_dialog
```

## Usage

The dialog opens when the `move-to-folder` command is triggered. Two ways:

1. **Programmatically**, from the browser console or another plugin:

   ```js
   rcmail.move_dialog.open();
   ```

2. **By keyboard shortcut**, by binding a key through the
   [keyboard_shortcuts](https://github.com/s-farber/keyboard_shortcuts) plugin.
   Add to `config/config.inc.php`:

   ```php
   $config['keyboard_shortcuts_extras'] = array(
       'mailbox' => array(
           'v' => 'move-to-folder',
       ),
   );
   ```

   Then press `v` with one or more messages selected in the mail list.

The command is registered as always-enabled, unlike Roundcube's built-in `move`
command (which is disabled unless messages are selected). The dialog is harmless
with an empty selection: it opens and simply cannot complete a move.

In the dialog:

| Key | Action |
| --- | --- |
| any text | filters the folder list |
| `Down` / `Up` | move the highlight |
| `Enter` | move the selected messages to the highlighted folder |
| `Escape` | close without moving |

## How it works

The plugin reads the folder list that Roundcube already publishes to the client
as `rcmail.env.mailboxes`, filters it in the browser, and dispatches the move
through the core command:

```js
rcmail.command('move', { id: folder_id, uids: selected_uids });
```

There is no server-side state and no AJAX endpoint of its own.

## License

MIT. See [LICENSE](LICENSE).
