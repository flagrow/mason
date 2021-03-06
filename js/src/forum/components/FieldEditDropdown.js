import app from 'flarum/app';
import icon from 'flarum/helpers/icon';
import Component from 'flarum/Component';
import sortByAttribute from './../../lib/helpers/sortByAttribute';

/* global m */

export default class FieldEditDropdown extends Component {
    view(vnode) {
        // To be certain to not work on object copies, we always read the current one from vnode.attrs
        const {field, answers, onchange} = vnode.attrs;

        let selectedAnswerIdsForThisField = [];

        field.suggested_answers().forEach(answer => {
            const answerIndex = answers.findIndex(a => {
                // Temporary store entries seem to turn into undefined after saving
                if (typeof a === 'undefined') {
                    return false;
                }

                return a.id() === answer.id();
            });

            if (answerIndex !== -1) {
                selectedAnswerIdsForThisField.push(answer.id());
            }
        });

        return m('span.Select', [
            m('select.Select-input.FormControl', {
                multiple: field.multiple(),
                onchange: event => {
                    let answers = [];

                    for (let option of event.target.options) {
                        if (option.selected && option.value !== 'none') {
                            const answerId = option.value;

                            // This will only work with suggested answers for now
                            // As they are the only ones registered in the store
                            answers.push(app.store.getById('mason-answers', answerId));
                        }
                    }

                    onchange(answers);
                },
            }, [
                (field.multiple() ? null : m('option', {
                    value: 'none',
                    selected: selectedAnswerIdsForThisField.length === 0,
                    disabled: field.required(),
                    hidden: this.placeholderHidden(field),
                }, this.selectPlaceholder(field))),
                sortByAttribute(field.suggested_answers()).map(
                    answer => m('option', {
                        value: answer.id(),
                        selected: selectedAnswerIdsForThisField.indexOf(answer.id()) !== -1,
                    }, answer.content())
                ),
            ]),
            icon('fas fa-caret-down', {className: 'Select-caret'}),
        ]);
    }

    placeholderHidden(field) {
        // If labels are hidden, we need to always show the default value (even if it can't be selected)
        // Otherwise when the field is "required" you can't find the name of the field anymore once something is selected
        if (app.forum.attribute('fof-mason.labels-as-placeholders')) {
            return false;
        }

        return field.required();
    }

    selectPlaceholder(field) {
        let text = '';

        if (app.forum.attribute('fof-mason.labels-as-placeholders')) {
            text += field.name();

            if (field.required()) {
                text += ' *';
            }

            text += ' - ';
        }

        if (field.required()) {
            text += app.translator.trans('fof-mason.forum.answers.choose-option');
        } else {
            text += app.translator.trans('fof-mason.forum.answers.no-option-selected');
        }

        return text;
    }
}
