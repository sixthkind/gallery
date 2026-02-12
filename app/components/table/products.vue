<template>
  <TableUI
    class="animated fadeInUp"
    :rows="products"
    type="products"
    :loading="loading"
    :clickable="true"
    :edit="true"
    @refresh="refresh"
  />
</template>

<script setup>
import { pb } from "#imports";
import { MERCH_COLLECTIONS } from "~/utils/collections";

const products = ref([]);
const loading = ref(true);

const fetchProducts = async () => {
  try {
    const records = await pb.collection(MERCH_COLLECTIONS.products).getFullList({
      sort: "-created",
      expand: "album,coverPhoto"
    });
    products.value = records;
  } catch (error) {
    console.error("Error fetching products:", error);
  } finally {
    loading.value = false;
  }
};

const refresh = () => {
  loading.value = true;
  fetchProducts();
};

onMounted(() => {
  fetchProducts();
});
</script>
