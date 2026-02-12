<template>
  <CommonContainer>
    <TableUI
      class="animated fadeInUp"
      :rows="lessons" 
      type="lessons"
      :loading="loading"
      :clickable="true"
      :edit="true"
      @refresh="refresh"
    />
  </CommonContainer>
</template>

<script setup>
  import { pb } from '#imports';

  const lessons = ref([]);
  const loading = ref(true);

  const fetchLessons = async () => {
    try {
      const records = await pb.collection('_learn_lessons').getFullList({
        sort: 'section,order',
        expand: 'section,section.course'
      });
      lessons.value = records;
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => {
    loading.value = true;
    fetchLessons();
  }

  onMounted(() => {
    fetchLessons();
  });
</script>

