<template>
    <div>
        <div class="text-gray-600 font-light text-sm pr-1" v-if="!showToggle">
            {{ help }}
        </div>

        <div
            v-if="showToggle"
            class="text-gray-600 font-light text-sm pr-1 cursor-pointer"
            @click="data.showMore = !data.showMore"
        >
            {{ help }} <span v-if="!data.showMore">...</span>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive } from "vue";

const props = defineProps({
    help: {
        type: String,
    },
});

const data = reactive({
    length: 100,
    showMore: false,
});

const showToggle = computed(() => {
    return props.help?.length > data.length;
});

const help = computed(() => {
    if (props.help) {
        if (data.showMore) return props.help;
        if (!data.showMore) return props.help.slice(0, data.length);
    } else {
        return "";
    }
});
</script>
