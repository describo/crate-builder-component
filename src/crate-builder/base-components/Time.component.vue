<template>
    <div class="flex flex-col">
        <el-time-select
            v-model="internalValue"
            placeholder="Pick a time"
            @change="save"
            :clearable="false"
            :picker-options="{
                start: '00:00',
                step: '00:15',
                end: '23:45',
            }"
        >
        </el-time-select>
        <div class="text-xs text-gray-700" v-if="!value">
            Time format is: HH:mm::ss. e.g.09:03:59
        </div>
    </div>
</template>

<script>
export default {
    props: {
        property: {
            type: String,
            required: true,
        },
        value: {
            type: String,
        },
    },
    data() {
        return {
            internalValue: this.value,
        };
    },
    watch: {
        value: function () {
            this.internalValue = this.value;
        },
    },
    methods: {
        save() {
            this.$emit("save:property", {
                property: this.property,
                value: this.internalValue,
            });
        },
    },
    save() {},
};
</script>

<style lang="scss" scoped>
.style-text-input {
    width: 500px;
}
</style>
