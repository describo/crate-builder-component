<template>
    <div class="flex flex-col space-y-2">
        <div class="flex flex-row space-x-1">
            <div>
                <el-button @click="save" type="primary">
                    <i class="fa-solid fa-floppy-disk"></i>
                    &nbsp;save
                </el-button>
            </div>
        </div>
        <div class="text-sm text-red-600" v-if="data.error">
            The context is not a valid JSON data structure.
        </div>
        <div ref="codemirror" class=""></div>
    </div>
</template>

<script setup>
import { ElButton } from "element-plus";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

import { reactive, ref, watch } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["close", "update:context"]);

const data = reactive({
    editor: undefined,
    error: false,
});
const codemirror = ref(null);

watch(
    () => codemirror.value,
    (n, o) => {
        if (n) setupCodeMirror();
    }
);

function setupCodeMirror() {
    let context = props.crateManager.context;
    let initialState = EditorState.create({
        doc: JSON.stringify(context, null, 2),
        extensions: [basicSetup, oneDark, javascript()],
    });
    data.editor = new EditorView({
        state: initialState,
        parent: codemirror.value,
    });
}
function save() {
    try {
        let context = JSON.parse(data.editor.state.doc.toString());
        emit("update:context", context);
        data.error = false;
    } catch (error) {
        data.error = true;
    }
}
</script>

<style scoped>
.cm-editor {
    font-size: 12px;
    height: 350px;
    overflow: scroll;
}
</style>
