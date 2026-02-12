export const tableColumns: any = {
  items: [
    { label: 'Name', key: 'name', sortable: true },
    { label: 'Tags', key: 'tagsFormatted', sortable: true },
    { label: 'Content', key: 'contentFormatted', sortable: false },
    { label: 'Files', key: 'fileCount', sortable: true },
    { label: 'Created', key: 'createdFormatted', sortable: true },
  ],
  tags: [
    { label: 'Name', key: 'nameFormatted', sortable: true },
    { label: 'Linked Items', key: 'numItems', sortable: true },
    { label: 'Clients', key: 'numClients', sortable: true },
    { label: 'Created', key: 'createdFormatted', sortable: true }
  ],
  clients: [
    { label: 'Name', key: 'name', sortable: true },
    { label: 'Permission', key: 'tagsFormatted', sortable: true },
    { label: 'Created', key: 'createdFormatted', sortable: true }
  ],
  courses: [
    { label: 'Title', key: 'title', sortable: true },
    { label: 'Description', key: 'descriptionFormatted', sortable: false },
    { label: 'Price', key: 'priceFormatted', sortable: true },
    { label: 'Tier', key: 'subscription_tier', sortable: true },
    { label: 'Published', key: 'publishedFormatted', sortable: true },
    { label: 'Created', key: 'createdFormatted', sortable: true }
  ],
  modules: [
    { label: 'Title', key: 'title', sortable: true },
    { label: 'Description', key: 'descriptionFormatted', sortable: false },
    { label: 'Courses', key: 'coursesFormatted', sortable: false },
    { label: 'Price', key: 'priceFormatted', sortable: true },
    { label: 'Published', key: 'publishedFormatted', sortable: true },
    { label: 'Created', key: 'createdFormatted', sortable: true }
  ],
  products: [
    { label: 'Name', key: 'name', sortable: true },
    { label: 'Slug', key: 'slug', sortable: true },
    { label: 'Price', key: 'priceFormatted', sortable: true },
    { label: 'Currency', key: 'currencyFormatted', sortable: true },
    { label: 'Active', key: 'activeFormatted', sortable: true },
    { label: 'Created', key: 'createdFormatted', sortable: true }
  ],
  sections: [
    { label: 'Title', key: 'title', sortable: true },
    { label: 'Course', key: 'courseFormatted', sortable: true },
    { label: 'Order', key: 'order', sortable: true },
    { label: 'Created', key: 'createdFormatted', sortable: true }
  ],
  lessons: [
    { label: 'Title', key: 'title', sortable: true },
    { label: 'Section', key: 'sectionFormatted', sortable: true },
    { label: 'Order', key: 'order', sortable: true },
    { label: 'Content', key: 'contentFormatted', sortable: false },
    { label: 'Created', key: 'createdFormatted', sortable: true }
  ],
  subscription_tiers: [
    { label: 'Name', key: 'name', sortable: true },
    { label: 'Key', key: 'key', sortable: true },
    { label: 'Monthly Price', key: 'monthlyPriceFormatted', sortable: true },
    { label: 'Yearly Price', key: 'yearlyPriceFormatted', sortable: true },
    { label: 'Order', key: 'order', sortable: true },
    { label: 'Active', key: 'activeFormatted', sortable: true },
    { label: 'Created', key: 'createdFormatted', sortable: true }
  ]
};

export const tableComputed: Record<string, (row: Record<string, any>) => Record<string, any>> = {
  items: (row) => ({
    fileCount: row.files?.length || 0,
    tagsFormatted: row.expand?.tags?.map((tag: any) => `#${tag.name}`).join(' '),
    contentFormatted: row.content ? (row.content.replace(/<[^>]*>/g, '').length > 40
      ? row.content.replace(/<[^>]*>/g, '').substring(0, 40) + '...'
      : row.content.replace(/<[^>]*>/g, '')) : '',
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A',
  }),
  tags: (row) => ({
    nameFormatted: `#${row.name}`,
    numItems: row.expand?.items_via_tags?.length || 0,
    numClients: row.expand?.clients_via_tags?.length || 0,
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A'
  }),
  clients: (row) => ({
    tagsFormatted: row.expand?.tags?.map((tag: any) => `#${tag.name}`).join(' '),
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A'
  }),
  courses: (row) => ({
    descriptionFormatted: row.description ? (row.description.replace(/<[^>]*>/g, '').length > 50
      ? row.description.replace(/<[^>]*>/g, '').substring(0, 50) + '...'
      : row.description.replace(/<[^>]*>/g, '')) : '',
    priceFormatted: row.price && row.price > 0 ? `$${row.price.toFixed(2)}` : 'Free',
    subscription_tier: row.expand?.subscription_tier?.name || 'None',
    publishedFormatted: row.published ? '✓ Published' : '✗ Draft',
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A'
  }),
  modules: (row) => ({
    descriptionFormatted: row.description ? (row.description.replace(/<[^>]*>/g, '').length > 50
      ? row.description.replace(/<[^>]*>/g, '').substring(0, 50) + '...'
      : row.description.replace(/<[^>]*>/g, '')) : '',
    coursesFormatted: Array.isArray(row.courses) ? `${row.courses.length} courses` :
      (row.expand?.courses ? (Array.isArray(row.expand.courses) ? `${row.expand.courses.length} courses` : '1 course') : '0 courses'),
    priceFormatted: row.price && row.price > 0 ? `$${row.price.toFixed(2)}` : 'Free',
    publishedFormatted: row.published ? '✓ Published' : '✗ Draft',
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A'
  }),
  products: (row) => ({
    priceFormatted: typeof row.price === 'number' ? `$${row.price.toFixed(2)}` : '$0.00',
    currencyFormatted: (row.currency || 'USD').toUpperCase(),
    activeFormatted: row.active ? '✓ Active' : '✗ Inactive',
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A'
  }),
  sections: (row) => ({
    courseFormatted: row.expand?.course?.title || 'N/A',
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A'
  }),
  lessons: (row) => ({
    sectionFormatted: row.expand?.section?.title || 'N/A',
    contentFormatted: row.content ? (JSON.stringify(row.content).replace(/<[^>]*>/g, '').length > 50
      ? JSON.stringify(row.content).replace(/<[^>]*>/g, '').substring(0, 50) + '...'
      : JSON.stringify(row.content).replace(/<[^>]*>/g, '')) : '',
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A'
  }),
  subscription_tiers: (row) => ({
    monthlyPriceFormatted: row.price_monthly ? `$${row.price_monthly.toFixed(2)}/mo` : '$0/mo',
    yearlyPriceFormatted: row.price_yearly ? `$${row.price_yearly.toFixed(2)}/yr` : '$0/yr',
    activeFormatted: row.active ? '✓ Active' : '✗ Inactive',
    createdFormatted: row.created ? new Date(row.created).toLocaleDateString('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) : 'N/A'
  })
};
