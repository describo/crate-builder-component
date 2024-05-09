<template>
    <div class="flex flex-row space-x-2 flex-grow">
        <div class="text-sm pt-1">{{ $t("save_template_prompt") }}</div>
        <div class="flex-grow">
            <el-input
                class="w-full"
                v-model="data.crateName"
                :placeholder="$t('provide_name_for_template')"
            />
        </div>
        <div>
            <el-button @click="save" :disabled="!data.crateName">
                <div class="mr-1">
                    <FontAwesomeIcon :icon="faSave"></FontAwesomeIcon>
                </div>
                {{ $t("save_label") }}
            </el-button>
            <el-button @click="close">
                <div>
                    <FontAwesomeIcon :icon="faTimes"></FontAwesomeIcon>
                </div>
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { ElButton } from "element-plus";
import { reactive } from "vue";
import { $t } from "../i18n";

const props = defineProps({
    entity: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["close", "save:crate:template"]);
const data = reactive({
    entityCount: 0,
    crateName: undefined,
});

function close() {
    emit("close");
}
function save() {
    emit("save:crate:template", { name: data.crateName });
    data.crateName = undefined;
    close();
}
</script>
