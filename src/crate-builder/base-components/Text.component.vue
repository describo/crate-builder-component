<template>
    <div class="flex flex-row space-x-2">
        <el-input
            class="w-full"
            :type="type"
            v-model="internalValue"
            @blur="save"
            @change="save"
            resize="vertical"
            :rows="5"
            :placeholder="placeholder"
        ></el-input>
        <el-button @click="save" type="success" size="default">
            <i class="fas fa-check fa-fw"></i>
        </el-button>
    </div>
</template>

<script>
export default {
    props: {
        type: {
            type: String,
            default: "textarea",
        },
        property: {
            type: String,
            required: true,
        },
        value: {
            type: String,
        },
        definition: {
            type: Object,
        },
        placeholder: {
            type: String,
        },
    },
    data() {
        return {
            internalValue: this.value,
            currentValue: this.value,
        };
    },
    watch: {
        value: function () {
            this.internalValue = this.value;
        },
    },
    methods: {
        save() {
            if (this.internalValue !== this.currentValue) {
                this.currentValue = this.internalValue;

                this.$emit("save:property", {
                    property: this.property,
                    value: this.internalValue,
                });
            }
        },
    },
};
</script>
