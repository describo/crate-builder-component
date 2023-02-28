<template>
    <div>{{ this.definition.value }}</div>
</template>

<script>
export default {
    props: {
        definition: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {};
    },
};
</script>
