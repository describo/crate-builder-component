<template>
    <div class="flex flex-col">
        <el-date-picker
            v-model="internalValue"
            type="date"
            placeholder="Pick a date"
            format="YYYY-MM-DD"
            @change="save"
            :clearable="true"
        >
        </el-date-picker>
        <div class="text-xs text-gray-700" v-if="!value">
            Date format is: YYYY-MM-DD. e.g. 2021-03-22
        </div>
    </div>
</template>

<script>
import { startOfDay } from "date-fns";

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
                value: startOfDay(this.internalValue).toISOString(),
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
