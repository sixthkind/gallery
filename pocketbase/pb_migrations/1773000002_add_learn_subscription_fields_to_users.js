/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");

  if (!collection.fields.getByName("learnStripeCustomerId")) {
    collection.fields.add(new Field({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "textlearn9001",
      "max": 0,
      "min": 0,
      "name": "learnStripeCustomerId",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }));
  }

  if (!collection.fields.getByName("learnStripeSubscriptionId")) {
    collection.fields.add(new Field({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "textlearn9002",
      "max": 0,
      "min": 0,
      "name": "learnStripeSubscriptionId",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }));
  }

  if (!collection.fields.getByName("learnSubscriptionStatus")) {
    collection.fields.add(new Field({
      "hidden": false,
      "id": "selectlearn9003",
      "maxSelect": 1,
      "name": "learnSubscriptionStatus",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "select",
      "values": ["inactive", "active", "past_due", "canceled"]
    }));
  }

  if (!collection.fields.getByName("learnSubscriptionTierId")) {
    collection.fields.add(new Field({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "textlearn9004",
      "max": 0,
      "min": 0,
      "name": "learnSubscriptionTierId",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }));
  }

  if (!collection.fields.getByName("learnSubscriptionCurrentPeriodEnd")) {
    collection.fields.add(new Field({
      "hidden": false,
      "id": "datelearn9005",
      "max": "",
      "min": "",
      "name": "learnSubscriptionCurrentPeriodEnd",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "date"
    }));
  }

  if (!collection.fields.getByName("learnSubscriptionInterval")) {
    collection.fields.add(new Field({
      "hidden": false,
      "id": "selectlearn9006",
      "maxSelect": 1,
      "name": "learnSubscriptionInterval",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "select",
      "values": ["month", "year"]
    }));
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");

  if (collection.fields.getByName("learnStripeCustomerId")) {
    collection.fields.removeById("textlearn9001");
  }
  if (collection.fields.getByName("learnStripeSubscriptionId")) {
    collection.fields.removeById("textlearn9002");
  }
  if (collection.fields.getByName("learnSubscriptionStatus")) {
    collection.fields.removeById("selectlearn9003");
  }
  if (collection.fields.getByName("learnSubscriptionTierId")) {
    collection.fields.removeById("textlearn9004");
  }
  if (collection.fields.getByName("learnSubscriptionCurrentPeriodEnd")) {
    collection.fields.removeById("datelearn9005");
  }
  if (collection.fields.getByName("learnSubscriptionInterval")) {
    collection.fields.removeById("selectlearn9006");
  }

  return app.save(collection);
});
