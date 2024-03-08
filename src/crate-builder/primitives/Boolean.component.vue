<template>
    <div class="flex flex-col describo-property-type-boolean">
        <div class="flex flex-row space-x-2">
            <el-switch class="mx-2" size="large" :active-text="$t('true_label')" :inactive-text="$t('false_label')" v-model="data.internalValue" @change="debouncedSave"/>
        </div>
    </div>
</template>

<script setup>
import { ElSwitch } from "element-plus";
import { reactive, watch, computed } from "vue";
import debounce from "lodash-es/debounce.js";
import { $t } from "../i18n";

const debouncedSave = debounce(save, 200);

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    value: {
        type: [Boolean],
    },
});

const $emit = defineEmits(["save:property"]);

const data = reactive({
    internalValue: props.value,
});
watch(
    () => props.value,
    () => {
        data.internalValue = props.value;
    }
);

function save() {
    $emit("save:property", {
        property: props.property,
        value: data.internalValue,
    });
}
</script>