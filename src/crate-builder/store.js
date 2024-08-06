import { defineStore } from "pinia";
import { EditorState } from "./editor-state";

export const useStateStore = defineStore("describoComponentState", () => {
    let editorState = new EditorState();
    const configuration = {};
    return { configuration, editorState };
});
