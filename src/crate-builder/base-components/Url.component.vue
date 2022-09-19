<template>
    <div class="flex flex-col">
        <div class="flex flex-row flex-grow space-x-2">
            <div class="flex-grow">
                <el-input
                    class="w-full"
                    type="text"
                    v-model="internalValue"
                    @blur="save"
                    @change="save"
                    resize="vertical"
                    :rows="5"
                ></el-input>
            </div>
            <el-button @click="save" type="success">
                <i class="fas fa-check fa-fw"></i>
            </el-button>
        </div>
        <div class="text-xs" v-if="error">{{ error }}</div>
    </div>
</template>

<script>
import validatorPkg from "validator";
const { isURL } = validatorPkg;

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
        },
    },
    data() {
        return {
            internalValue: this.value,
            error: false,
        };
    },
    watch: {
        value: function () {
            this.internalValue = this.value;
        },
    },
    methods: {
        save() {
            let isurl;
            try {
                isurl = !isURL(this.internalValue, {
                    protocols: ["http", "https", "ftp", "ftps", "arcp"],
                });
                if (isurl) {
                } else {
                    this.error = false;

                    this.$emit("create:entity", {
                        property: this.property,
                        "@id": this.internalValue,
                        "@type": "URL",
                        name: this.internalValue,
                    });
                }
            } catch (error) {
                this.error = `The entry needs to be a valid url. The accepted protocols are: http, https, ftp, ftps and arcp.`;
            }
        },
    },
};
</script>
