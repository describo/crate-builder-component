<template>
    <div class="flex flex-col">
        <div v-if="isValidString">{{ props.value }}</div>
        <div v-if="!isValidString">
            {{ $t('invalid_value_value', {type: props.value}) }}
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import isString from "lodash-es/isString";
import {$t} from '../i18n'

const props = defineProps({
    property: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
});

let isValidString = computed(() => isString(props.value));
</script>
