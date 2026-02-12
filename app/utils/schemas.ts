import { pb } from '#imports';

async function getSchema(type: string) {
  let schema = schemas[type];
  if (!schema) return {};

  if (type === 'items' || type === 'clients' || type === 'photos') {
    let tags = await getTags();
    schema.tags.items = tags;
  }

  if (type === 'sections') {
    let courses = await getCourses();
    schema.course.items = courses;
  }

  if (type === 'lessons') {
    let sections = await getSections();
    schema.section.items = sections;
  }

  if (type === 'modules') {
    let courses = await getCourses();
    schema.courses.items = courses;
  }

  if (type === 'courses') {
    let tiers = await getSubscriptionTiers();
    schema.subscription_tier.items = tiers;
  }

  return schema;
}

async function getTags() {
  const tags = await pb.collection('tags').getFullList();
  return tags.map(tag => ({
    value: tag.id,
    label: tag.name
  }));
}

async function getCourses() {
  const courses = await pb.collection('_learn_courses').getFullList({
    expand: 'subscription_tier'
  });
  return courses.map(course => ({
    value: course.id,
    label: course.title
  }));
}

async function getSections() {
  const sections = await pb.collection('_learn_sections').getFullList({
    expand: 'course'
  });
  return sections.map(section => ({
    value: section.id,
    label: `${section.expand?.course?.title || 'Course'} - ${section.title}`
  }));
}

async function getSubscriptionTiers() {
  const tiers = await pb.collection('_learn_subscription_tiers').getFullList({
    sort: 'order'
  });
  return [
    { value: '', label: 'None' },
    ...tiers.map(tier => ({
      value: tier.id,
      label: tier.name
    }))
  ];
}

const schemas: any = {
  users: {
    name: { type: 'text', label: 'Name' },
    avatar: { type: 'file', label: 'Avatar', drop: true, 'upload-temp-endpoint': false, 'soft-remove': true }
  },
  items: {
    name: { type: 'text', label: 'Name' },
    tags: { type: 'tags', label: 'Tags', items: [] },
    content: { type: 'editor', label: 'Content' },
    files: { type: 'multifile', label: 'Files', 'upload-temp-endpoint': false, 'soft-remove': true, 'upload-button': false }
  },
  tags: {
    name: { type: 'text', label: 'Name' }
  },
  clients: {
    name: { type: 'text', label: 'Name' },
    tags: { type: 'tags', label: 'Permission', items: [] }
  },
  photos: {
    title: { type: 'text', label: 'Title' },
    description: { type: 'textarea', label: 'Description' },
    photo: { type: 'file', label: 'Photo', accept: 'image/*', 'upload-temp-endpoint': false, 'soft-remove': true },
    tags: { type: 'tags', label: 'Tags', items: [] },
    user: { type: 'hidden' }
  },
  courses: {
    title: { type: 'text', label: 'Title' },
    description: { type: 'editor', label: 'Description' },
    image: { type: 'file', label: 'Course Image', drop: true, 'upload-temp-endpoint': false, 'soft-remove': true },
    price: { type: 'text', label: 'Price (USD)', inputType: 'number', default: 0, floating: true },
    subscription_tier: {
      type: 'select',
      label: 'Subscription Tier',
      items: [],
      search: true
    },
    published: { type: 'toggle', label: 'Published', default: false },
    featured: { type: 'toggle', label: 'Featured', default: false }
  },
  subscription_tiers: {
    name: { type: 'text', label: 'Tier Name', placeholder: 'e.g., Free, Basic, Pro, Enterprise' },
    key: { type: 'text', label: 'Tier Key', placeholder: 'e.g., free, basic, pro, enterprise (lowercase, no spaces)' },
    description: { type: 'editor', label: 'Description' },
    price_monthly: { type: 'text', label: 'Monthly Price (USD)', inputType: 'number', default: 0, floating: true, placeholder: '0 for free tier' },
    price_yearly: { type: 'text', label: 'Yearly Price (USD)', inputType: 'number', default: 0, floating: true, placeholder: '0 for free tier' },
    stripe_price_id_monthly: { type: 'text', label: 'Stripe Price ID (Monthly)', placeholder: 'price_xxx (optional, leave blank for free)' },
    stripe_price_id_yearly: { type: 'text', label: 'Stripe Price ID (Yearly)', placeholder: 'price_xxx (optional, leave blank for free)' },
    features: { type: 'json', label: 'Features (JSON Array)', placeholder: '["Feature 1", "Feature 2"]', default: [] },
    order: { type: 'text', label: 'Display Order', inputType: 'number', default: 0 },
    active: { type: 'toggle', label: 'Active', default: true }
  },
  sections: {
    title: { type: 'text', label: 'Title' },
    order: { type: 'text', label: 'Order', inputType: 'number', default: 0 },
    course: { type: 'select', label: 'Course', items: [], search: true }
  },
  lessons: {
    title: { type: 'text', label: 'Title' },
    order: { type: 'text', label: 'Order', inputType: 'number', default: 0 },
    section: { type: 'select', label: 'Section', items: [], search: true }
  },
  modules: {
    title: { type: 'text', label: 'Title' },
    description: { type: 'editor', label: 'Description' },
    image: { type: 'file', label: 'Module Image', drop: true, 'upload-temp-endpoint': false, 'soft-remove': true },
    courses: { type: 'multiselect', label: 'Courses', items: [], search: true },
    price: { type: 'text', label: 'Price (USD)', inputType: 'number', default: 0, floating: true },
    published: { type: 'toggle', label: 'Published', default: false }
  },
  notdeletable: ['users']
};

export { getSchema };
