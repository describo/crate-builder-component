<template>
  <div class="w-1/2">
    <div class="border-b-2 border-gray-700">
      <h1 class="m-2 text-2xl">Preview Crate</h1>
    </div>
    <div class="border-l-2 border-gray-300 p-2">
      <pre class="overflow-scroll text-gray-700">
        {{ JSON.stringify(metadataJSON, undefined, 2) }}
      </pre>
    </div>
  </div>
</template>

<script>

export default {
  name: "PreviewComponent",
  props: {
    metadataJSON: {}
  },
}
</script>