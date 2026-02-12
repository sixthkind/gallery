/**
 * Stripe utility functions for PocketBase hooks
 * Handles payment processing, subscription management, and course access
 */

module.exports = {
  /**
   * Get active Stripe configuration from database
   * @param {object} app - PocketBase app instance
   * @returns {Record} - Active Stripe configuration record
   */
  getStripeConfig: (app) => {
    try {
      const config = app.findFirstRecordByFilter(
        "_learn_stripe_config",
        "active = true"
      );
      return config;
    } catch (err) {
      throw new Error("No active Stripe configuration found. Please configure Stripe in admin settings.");
    }
  },

  /**
   * Make authenticated request to Stripe API
   * @param {string} endpoint - Stripe API endpoint (without base URL)
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} body - Request body (URL-encoded)
   * @param {Record} config - Stripe configuration record (optional)
   * @param {object} app - PocketBase app instance
   * @returns {object} - HTTP response from Stripe
   */
  stripeRequest: (endpoint, method = "GET", body = "", config = null, app) => {
    if (!config) {
      config = module.exports.getStripeConfig(app);
    }

    const url = `https://api.stripe.com/v1/${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${config.get("secret_key")}`,
      "Stripe-Version": "2024-06-20",
      "Content-Type": "application/x-www-form-urlencoded"
    };

    const res = $http.send({
      url: url,
      method: method,
      body: body,
      headers: headers,
      timeout: 120,
    });

    if (res.statusCode >= 400) {
      console.error("Stripe API Error:", res.json);
      throw new Error(res.json.error?.message || "Stripe API request failed");
    }

    return res;
  },

  /**
   * Grant access to a course by creating an enrollment
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {string} purchaseType - Type of purchase (one-time, subscription, module)
   * @param {string} paymentIntentId - Stripe payment intent ID (optional)
   * @param {string} moduleId - Module ID if purchased as part of module (optional)
   * @param {string} expiresAt - Expiration date for subscription access (optional)
   * @param {number} amountPaid - Amount paid in dollars (optional)
   * @param {string} currency - Currency code (optional, defaults to USD)
   * @param {object} app - PocketBase app instance
   * @returns {Record} - Enrollment record
   */
  grantCourseAccess: (userId, courseId, purchaseType, paymentIntentId = null, moduleId = null, expiresAt = null, amountPaid = null, currency = "USD", app) => {
    try {
      // Check if enrollment already exists
      const existing = app.findFirstRecordByFilter(
        "_learn_enrollments",
        `user="${userId}" && course="${courseId}"`
      );
      
      // Update existing enrollment
      const enrollmentRecord = app.findRecordById("_learn_enrollments", existing.id);
      enrollmentRecord.set("purchase_type", purchaseType);
      if (paymentIntentId) enrollmentRecord.set("stripe_payment_intent_id", paymentIntentId);
      if (moduleId) enrollmentRecord.set("module", moduleId);
      if (expiresAt) enrollmentRecord.set("expires_at", expiresAt);
      if (amountPaid !== null) enrollmentRecord.set("amount_paid", amountPaid);
      if (currency) enrollmentRecord.set("currency", currency);
      app.save(enrollmentRecord);
      
      return existing;
    } catch (err) {
      // Create new enrollment
      const collection = app.findCollectionByNameOrId("_learn_enrollments");
      const record = new Record(collection);
      
      record.set("user", userId);
      record.set("course", courseId);
      record.set("enrolled_at", new Date().toISOString());
      record.set("purchase_type", purchaseType);
      if (paymentIntentId) record.set("stripe_payment_intent_id", paymentIntentId);
      if (moduleId) record.set("module", moduleId);
      if (expiresAt) record.set("expires_at", expiresAt);
      if (amountPaid !== null) record.set("amount_paid", amountPaid);
      if (currency) record.set("currency", currency);
      
      app.save(record);
      return record;
    }
  },

  /**
   * Grant access to all courses in a module
   * @param {string} userId - User ID
   * @param {string} moduleId - Module ID
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {number} amountPaid - Amount paid for the module (optional)
   * @param {string} currency - Currency code (optional)
   * @param {object} app - PocketBase app instance
   * @returns {Array<Record>} - Array of enrollment records
   */
  grantModuleAccess: (userId, moduleId, paymentIntentId, amountPaid = null, currency = "USD", app) => {
    const moduleRecord = app.findRecordById("_learn_modules", moduleId);
    const courseIds = moduleRecord.get("courses");
    
    const enrollments = [];
    courseIds.forEach(courseId => {
      const enrollment = module.exports.grantCourseAccess(
        userId, 
        courseId, 
        "module", 
        paymentIntentId, 
        moduleId,
        null,
        amountPaid,
        currency,
        app
      );
      enrollments.push(enrollment);
    });
    
    return enrollments;
  },

  /**
   * Update user subscription status
   * @param {string} userId - User ID
   * @param {object} subscriptionData - Subscription data from Stripe (expects tier_id)
   * @param {object} app - PocketBase app instance
   * @returns {Record} - Updated user record
   */
  updateSubscriptionStatus: (userId, subscriptionData, app) => {
    const user = app.findRecordById("_pb_users_auth_", userId);
    
    const userRecord = app.findRecordById("_pb_users_auth_", userId);
    userRecord.set("learnStripeCustomerId", subscriptionData.customerId);
    userRecord.set("learnStripeSubscriptionId", subscriptionData.subscriptionId);
    userRecord.set("learnSubscriptionStatus", subscriptionData.status);
    userRecord.set("learnSubscriptionTierId", subscriptionData.tier_id); // Now stores tier ID (relation)
    userRecord.set("learnSubscriptionCurrentPeriodEnd", subscriptionData.expiresAt);
    userRecord.set("learnSubscriptionInterval", subscriptionData.interval);
    app.save(userRecord);
    
    // Grant access to all courses in the subscription tier
    if (subscriptionData.status === "active" && subscriptionData.tier_id) {
      const courses = app.findRecordsByFilter(
        "_learn_courses",
        `subscription_tier="${subscriptionData.tier_id}"`,
        "-created",
        500
      );
      
      courses.forEach(course => {
        module.exports.grantCourseAccess(
          userId, 
          course.id, 
          "subscription", 
          null, 
          null, 
          subscriptionData.expiresAt,
          null, // No amount_paid for subscriptions (recurring)
          null, // No currency for subscriptions
          app
        );
      });
    }
    
    return user;
  },

  /**
   * Get or create Stripe customer
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {object} app - PocketBase app instance
   * @returns {string} - Stripe customer ID
   */
  getOrCreateCustomer: (userId, email, app) => {
    const user = app.findRecordById("_pb_users_auth_", userId);
    let customerId = user.get("learnStripeCustomerId");
    
    if (!customerId) {
      // Get Stripe config
      const config = module.exports.getStripeConfig(app);
      
      // Create new customer
      const body = `email=${encodeURIComponent(email)}&metadata[user_id]=${userId}`;
      const res = module.exports.stripeRequest("customers", "POST", body, config, app);
      customerId = res.json.id;
      
      // Save customer ID to user
      const userRecord = app.findRecordById("_pb_users_auth_", userId);
      userRecord.set("learnStripeCustomerId", customerId);
      app.save(userRecord);
    }
    
    return customerId;
  }
};
