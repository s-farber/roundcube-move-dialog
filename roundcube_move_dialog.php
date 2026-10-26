<?php

/**
 * Move Dialog
 *
 * Adds a searchable "move to folder" dialog with type-ahead completion.
 *
 * Roundcube's built-in move action presents a flat folder tree with no way to
 * filter it, and in the mail task it is only reachable by dragging a message.
 * This plugin provides a dialog with a filter input: type part of a folder
 * name, pick the match, and the selected messages are moved.
 *
 * @version 0.1.0
 *
 * @author Saul Farber
 * @license MIT
 */
class roundcube_move_dialog extends rcube_plugin
{
    public $task = 'mail';

    #[\Override]
    public function init()
    {
        $rcmail = rcmail::get_instance();

        if ($rcmail->output->type != 'html') {
            return;
        }

        $this->add_texts('localization', true);
        $this->include_script('roundcube_move_dialog.js');
        $this->include_stylesheet($this->local_skin_path() . '/roundcube_move_dialog.css');
    }
}
