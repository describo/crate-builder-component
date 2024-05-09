<template>
    <div class="flex flex-col space-y-2">
        <div ref="codemirror" class=""></div>
        <div>
            <el-button @click="save" type="primary">
                <FontAwesomeIcon :icon="faSave"></FontAwesomeIcon>
                &nbsp;{{ $t("save_label") }}
            </el-button>
        </div>
        <div class="text-sm text-red-600" v-if="data.error">
            The context is not a valid JSON data structure.
        </div>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSave } from '@fortawesome/free-solid-svg-icons'
import { ElButton } from "element-plus";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { inject } from "vue";
import { crateManagerKey } from "./keys.js";
const cm = inject(crateManagerKey);

import { reactive, ref, watch } from "vue";
import { $t } from "../i18n";

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
    let context = cm.value.getContext();
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
        console.error(error.message);
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
