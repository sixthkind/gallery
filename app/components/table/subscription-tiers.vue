<template>
  <CommonContainer>
    <TableUI 
      :rows="tiers"
      type="subscription_tiers"
      :loading="loading"
      :clickable="true"
      :edit="true"
      @refresh="fetchTiers"
    />
  </CommonContainer>
</template>

<script setup>
import { pb } from '~/utils/pb';

const tiers = ref([]);
const loading = ref(true);

const fetchTiers = async () => {
  try {
    loading.value = true;
    const records = await pb.collection('_learn_subscription_tiers').getFullList({
      sort: 'order'
    });
    tiers.value = records;
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTiers();
});
</script>


