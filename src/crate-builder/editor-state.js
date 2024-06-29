/**
 * @class
 *
 * @name EditorState
 * @description A class to work with the internal editor state of the component
 */
export class EditorState {
    constructor() {
        this.history = [];
        this.current = undefined;
    }

    /**
     * Reset the internal state
     */
    reset() {
        this.history = [];
        this.current = undefined;
    }

    /**
     * Push a new state onto the history stack
     *
     * A new state is an entry with the id of the currently displayed entity.
     *
     * @param {Object} options
     * @param {String} options.id - the id of the entity that is currently displayed
     */
    push({ id }) {
        if (!id) return;
        if (this.history.length - 1 > this.current) {
            this.history = this.history.slice(0, this.current + 1);
        }
        this.history = [...this.history, { id }];
        this.current = this.history.length - 1;
    }

    /**
     * Go back through the state
     */
    back() {
        if (this.current === 0) return;
        this.current -= 1;
    }

    /**
     * Go forward through the state
     */
    forward() {
        if (this.current === this.history.length - 1) return;
        this.current += 1;
    }

    /**
     * Return the current entry
     */
    latest() {
        return this.history[this.current];
    }

    /**
     * Update the current entry
     *
     * @param {Object} an object to be merged into the current entry
     */
    update(newState) {
        this.history[this.current] = { ...this.history[this.current], ...newState };
    }

    /**
     * Delete a property from the current entry
     *
     * @param {Object} object
     * @param {String} object.property - the property to remove from the current entry
     */
    deleteFromState({ property }) {
        delete this.history[this.current][property];
    }

    /**
     * Replace an id in the state
     *
     * When we change an entity id, we also need to update the history
     *   so we don't try to navigate back to a non-existent entity
     *
     * @param {Object} object
     * @param {String} object.id - the id to replace
     * @param {String} object.newId - the replacement
     */
    replaceId({ id, newId }) {
        // remove the latest history entry
        //  if we don't do this, we end up with a duplicate
        this.history = this.history.slice(0, -1);
        this.current = this.history.length - 1;

        // updating the rest of the history
        this.history = this.history.map((e, i) => {
            if (e.id === id) {
                return { ...e, id: newId };
            } else {
                return e;
            }
        });
    }
}
