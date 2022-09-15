<template>
    <div>
        <div v-if="!data.tgtEntityId" class="w-full">
            <date-component
                :property="data.property"
                :value.sync="data.value"
                @save:property="savePropertyValue"
                v-if="isDate(data.value)"
            />
            <date-time-component
                :property="data.property"
                :value.sync="data.value"
                @save:property="savePropertyValue"
                v-if="isDateTime(data.value)"
            />
            <time-component
                :property="data.property"
                :value.sync="data.value"
                @save:property="savePropertyValue"
                v-if="isTime(data.value)"
            />
            <number-component
                :property="data.property"
                :value.sync="data.value"
                @save:property="savePropertyValue"
                v-if="isNumber(data.value)"
            />
            <text-component
                v-if="isText(data.value) && !isValue() && !isSelect()"
                :style="inputElementWidth"
                :type="type"
                :property="data.property"
                :value.sync="data.value"
                :definition="props.definition"
                @save:property="savePropertyValue"
            />
            <value-component v-if="isValue()" :definition="props.definition" />
            <select-component
                v-if="isSelect()"
                :style="inputElementWidth"
                :property="data.property"
                :value.sync="data.value"
                :definition="props.definition"
                @save:property="savePropertyValue"
            />
        </div>
        <div v-else-if="data.tgtEntityId">
            <render-linked-item-component
                :crate-manager="crateManager"
                :entity="data"
                @load:entity="loadEntity"
                @save:property="savePropertyValue"
                @delete:property="deleteProperty"
            />
        </div>
    </div>
</template>

<script setup>
import RenderLinkedItemComponent from "./RenderLinkedItem.component.vue";
import TextComponent from "../base-components/Text.component.vue";
import DateComponent from "../base-components/Date.component.vue";
import DateTimeComponent from "../base-components/DateTime.component.vue";
import TimeComponent from "../base-components/Time.component.vue";
import NumberComponent from "../base-components/Number.component.vue";
import ValueComponent from "../base-components/Value.component.vue";
import SelectComponent from "../base-components/Select.component.vue";
import { parseISO, startOfDay } from "date-fns";
import { isDate as validatorIsDate, isDecimal, isInt, isFloat, isNumeric } from "validator";
import { computed } from "vue";

const props = defineProps({
    crateManager: {
        type: Object,
        required: true,
    },
    data: {
        type: Object,
        required: true,
    },
    definition: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(["load:entity", "save:property", "delete:property"]);
let inputElementWidth = computed(() => {
    return `width: 500px;`;
});
let type = computed(() => {
    return props?.definition?.type?.[0].toLowerCase();
});
async function savePropertyValue(data) {
    if (!data.propertyId) {
        data = { ...data, property: props.data.property, propertyId: props.data.propertyId };
    }
    console.debug("Render Entity Property Instance Component : emit(save:property)", data);
    emit("save:property", data);
}
function deleteProperty(data) {
    console.debug("Render Entity Property Instance Component : emit(delete:property)", data);
    emit("delete:property", data);
}
function loadEntity(data) {
    console.debug("Render Entity Property Instance Component : emit(load:entity)", data);
    emit("load:entity", data);
}
function isDate(string) {
    const date = parseISO(string);
    return (
        validatorIsDate(date) &&
        date.toISOString() === startOfDay(date).toISOString() &&
        !isNumber(string)
    );
}
function isDateTime(string) {
    const date = parseISO(string);
    return (
        validatorIsDate(date) &&
        !isNumber(string) &&
        date.toISOString() !== startOfDay(date).toISOString()
    );
}
function isTime(string) {
    return string?.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);
}
function isText(string) {
    if (!isDate(string) && !isDateTime(string) && !isTime(string) && !isNumber(string)) return true;
}
function isNumber(string) {
    return isDecimal(string) || isInt(string) || isFloat(string) || isNumeric(string);
}
function isValue() {
    return props?.definition?.type === "Value";
}
function isSelect() {
    return props?.definition?.values?.includes(props.data.property);
}
</script>
