<template>
    <div>
        <el-select
            class="w-full"
            v-model="internalValue"
            placeholder="Select"
            filterable
            :filter-method="filter"
            @change="save"
            @blur="reset"
        >
            <el-option v-for="(item, idx) in data" :key="idx" :label="item" :value="item">
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
            data: [...this.definition.values],
            internalValue: this.value,
        };
    },
    methods: {
        save() {
            this.$emit("create:entity", {
                property: this.property,
                "@id": this.internalValue,
                "@type": "URL",
                name: this.internalValue,
            });
        },
        filter(d) {
            this.data = this.definition.values.filter((v) => {
                let match = false;
                values(v).forEach((v) => {
                    const re = new RegExp(d);
                    if (v.toLowerCase().match(re)) match = true;
                });
                if (match) return v;
            });
        },
        reset() {
            this.data = [...this.definition.values];
        },
    },
};
</script>
