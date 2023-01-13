<template>
    <div>
        <el-select
            class="w-full"
            v-model="internalValue"
            placeholder="Select"
            filterable
            @change="save"
        >
            <el-option
                v-for="(item, idx) in definition.values"
                :key="idx"
                :label="item"
                :value="item"
            >
            </el-option>
        </el-select>
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
        definition: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            internalValue: this.value,
        };
    },
    methods: {
        save() {
            this.$emit("save:property", {
                property: this.property,
                value: this.internalValue,
            });
        },
    },
};
</script>
