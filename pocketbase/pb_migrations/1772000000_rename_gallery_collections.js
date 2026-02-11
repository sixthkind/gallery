/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const photos = app.findCollectionByNameOrId("pbc_1234567890");
  const albums = app.findCollectionByNameOrId("pbc_2468135790");
  const groups = app.findCollectionByNameOrId("pbc_9876543210");
  const tags = app.findCollectionByNameOrId("pbc_1219621782");

  photos.name = "gallery_photos";
  albums.name = "gallery_albums";
  groups.name = "gallery_groups";
  tags.name = "gallery_tags";

  app.save(photos);
  app.save(albums);
  app.save(groups);
  return app.save(tags);
}, (app) => {
  const photos = app.findCollectionByNameOrId("pbc_1234567890");
  const albums = app.findCollectionByNameOrId("pbc_2468135790");
  const groups = app.findCollectionByNameOrId("pbc_9876543210");
  const tags = app.findCollectionByNameOrId("pbc_1219621782");

  photos.name = "photos";
  albums.name = "albums";
  groups.name = "groups";
  tags.name = "tags";

  app.save(photos);
  app.save(albums);
  app.save(groups);
  return app.save(tags);
});
