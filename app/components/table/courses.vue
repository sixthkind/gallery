<template>
  <CommonContainer>
    <TableUI
    class="animated fadeInUp"
    :rows="courses" 
    type="courses"
    :loading="loading"
    :clickable="true"
    :edit="true"
    @refresh="refresh"
    />
  </CommonContainer>
</template>

<script setup>
  import { pb } from '#imports';

  const courses = ref([]);
  const loading = ref(true);

  const fetchCourses = async () => {
    try {
      const records = await pb.collection('_learn_courses').getFullList({
        sort: '-created',
        expand: 'subscription_tier'
      });
      courses.value = records;
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => {
    loading.value = true;
    fetchCourses();
  }

  onMounted(() => {
    fetchCourses();
  });
</script>

