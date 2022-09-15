<template>
    <div class="flex flex-col">
        <el-date-picker
            v-model="internalValue"
            type="datetime"
            placeholder="Pick a date and time"
            @change="save"
            :clearable="true"
        >
        </el-date-picker>
        <div class="text-xs text-gray-700" v-if="!value">
            Date format is: YYYY-MM-DD HH:mm:ss. e.g. 2021-03-22 03:23:00
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
                value: this.internalValue.toISOString(),
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
