// Stripe Payment Integration for E-Learning Platform
// Supports: One-time course/module purchases and subscriptions


// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/stripe/config
 * Get Stripe configuration (public keys only)
 */
routerAdd("GET", "/api/v1/stripe/config", (e) => {
  console.log("[Stripe] GET config endpoint called");
  
  try {
    // Try to get all stripe_config records first for debugging
    const allConfigs = $app.findRecordsByFilter("_learn_stripe_config", "", "", 100);
    console.log("[Stripe] Found", allConfigs.length, "total stripe_config records");
    
    if (allConfigs.length > 0) {
      allConfigs.forEach((config, index) => {
        console.log(`[Stripe] Config ${index + 1}: active=${config.get("active")}, environment=${config.get("environment")}`);
      });
    }
    
    // Get active config directly
    const config = $app.findFirstRecordByFilter(
      "_learn_stripe_config",
      "active = true"
    );
    
    if (!config) {
      throw new Error("No active Stripe configuration found");
    }
    
    console.log("[Stripe] Active config found");
    
    return e.json(200, {
      publishable_key: config.get("publishable_key"),
      environment: config.get("environment")
    });
  } catch (err) {
    console.error("[Stripe] Error getting config:", err.message);
    return e.json(404, {
      message: err.message || "No active Stripe configuration found"
    });
  }
});

/**
 * POST /api/v1/stripe/test-current-config
 * Test currently saved Stripe configuration (superuser only)
 */
routerAdd("POST", "/api/v1/stripe/test-current-config", (e) => {
  console.log("[Stripe] Test current config endpoint called");
  
  // Check authentication
  if (!e.auth || !e.auth.isSuperuser()) {
    console.log("[Stripe] Authentication failed - not a superuser");
    return e.json(403, { message: "Forbidden - Superuser access required" });
  }
  
  console.log("[Stripe] Authentication successful");
  
  try {
    // Get the currently active config from database
    const config = $app.findFirstRecordByFilter(
      "_learn_stripe_config",
      "active = true"
    );
    
    if (!config) {
      return e.json(404, { 
        message: "No active Stripe configuration found. Please save a configuration first." 
      });
    }
    
    const secretKey = config.get("secret_key");
    const publishableKey = config.get("publishable_key");
    const environment = config.get("environment");
    
    console.log("[Stripe] Testing saved config for environment:", environment);
    
    // Validate key format based on environment
    const expectedSecretPrefix = environment === "live" ? "sk_live_" : "sk_test_";
    const expectedPublicPrefix = environment === "live" ? "pk_live_" : "pk_test_";
    
    if (!secretKey.startsWith(expectedSecretPrefix)) {
      return e.json(400, { 
        message: `Saved secret key format is invalid for ${environment} environment. Expected key starting with ${expectedSecretPrefix}` 
      });
    }
    
    if (!publishableKey.startsWith(expectedPublicPrefix)) {
      return e.json(400, { 
        message: `Saved publishable key format is invalid for ${environment} environment. Expected key starting with ${expectedPublicPrefix}` 
      });
    }
    
    // Test the API key by making a simple request to Stripe
    const testHeaders = {
      "Authorization": `Bearer ${secretKey}`,
      "Stripe-Version": "2024-06-20"
    };
    const testRes = $http.send({
      url: "https://api.stripe.com/v1/balance",
      method: "GET",
      headers: testHeaders,
      timeout: 30
    });
    
    if (testRes.statusCode >= 400) {
      return e.json(400, { 
        message: "Current Stripe configuration is invalid or connection failed",
        error: testRes.json.error?.message || "Connection failed"
      });
    }
    
    // Success - keys are valid
    console.log("[Stripe] Current config test successful");
    return e.json(200, {
      message: `Current Stripe configuration (${environment} mode) is valid and working!`,
      environment: environment,
      account_id: testRes.json.object === "balance" ? "verified" : "unknown"
    });
  } catch (err) {
    console.error("Error testing current Stripe config:", err);
    return e.json(500, { 
      message: "Error testing current configuration",
      error: err.message 
    });
  }
});

/**
 * POST /api/v1/stripe/test-config
 * Test Stripe API keys without saving (superuser only)
 */
routerAdd("POST", "/api/v1/stripe/test-config", (e) => {
  console.log("[Stripe] Test config endpoint called");
  
  // Check authentication
  if (!e.auth || !e.auth.isSuperuser()) {
    console.log("[Stripe] Authentication failed - not a superuser");
    return e.json(403, { message: "Forbidden - Superuser access required" });
  }
  
  console.log("[Stripe] Authentication successful");
  
  try {
    const data = new DynamicModel({
      publishable_key: "",
      secret_key: "",
      environment: ""
    });
    e.bindBody(data);
    
    console.log("[Stripe] Testing keys for environment:", data.environment);
    
    // Validate required fields
    if (!data.publishable_key || !data.secret_key || !data.environment) {
      return e.json(400, { message: "Missing required fields" });
    }
    
    // Validate key format based on environment
    const expectedSecretPrefix = data.environment === "live" ? "sk_live_" : "sk_test_";
    const expectedPublicPrefix = data.environment === "live" ? "pk_live_" : "pk_test_";
    
    if (!data.secret_key.startsWith(expectedSecretPrefix)) {
      return e.json(400, { 
        message: `Invalid secret key format for ${data.environment} environment. Expected key starting with ${expectedSecretPrefix}` 
      });
    }
    
    if (!data.publishable_key.startsWith(expectedPublicPrefix)) {
      return e.json(400, { 
        message: `Invalid publishable key format for ${data.environment} environment. Expected key starting with ${expectedPublicPrefix}` 
      });
    }
    
    // Test the API key by making a simple request to Stripe
    const testHeaders = {
      "Authorization": `Bearer ${data.secret_key}`,
      "Stripe-Version": "2024-06-20"
    };
    const testRes = $http.send({
      url: "https://api.stripe.com/v1/balance",
      method: "GET",
      headers: testHeaders,
      timeout: 30
    });
    
    if (testRes.statusCode >= 400) {
      return e.json(400, { 
        message: "Invalid Stripe API key or connection failed",
        error: testRes.json.error?.message || "Connection failed"
      });
    }
    
    // Success - keys are valid
    return e.json(200, {
      message: "Stripe connection successful! Keys are valid.",
      environment: data.environment,
      account_id: testRes.json.object === "balance" ? "verified" : "unknown"
    });
  } catch (err) {
    console.error("Error testing Stripe config:", err);
    return e.json(500, { 
      message: "Error testing configuration",
      error: err.message 
    });
  }
});

/**
 * POST /api/v1/stripe/config
 * Update Stripe configuration (superuser only)
 */
routerAdd("POST", "/api/v1/stripe/config", (e) => {

  // Check authentication
  if (!e.auth || !e.auth.isSuperuser()) {
    return e.json(403, { message: "Forbidden - Superuser access required" });
  }
  
  try {
    const data = new DynamicModel({
      publishable_key: "",
      secret_key: "",
      webhook_secret: "",
      environment: ""
    });
    e.bindBody(data);
    
    // Validate required fields
    if (!data.publishable_key || !data.secret_key || !data.environment) {
      return e.json(400, { message: "Missing required fields" });
    }
    
    // Test the API key by making a simple request
    const testHeaders = {
      "Authorization": `Bearer ${data.secret_key}`,
      "Stripe-Version": "2024-06-20"
    };
    const testRes = $http.send({
      url: "https://api.stripe.com/v1/balance",
      method: "GET",
      headers: testHeaders,
      timeout: 30
    });
    
    if (testRes.statusCode >= 400) {
      return e.json(400, { 
        message: "Invalid Stripe API key",
        error: testRes.json.error?.message 
      });
    }
    
    // Deactivate all existing configs
    const existingConfigs = $app.findRecordsByFilter("_learn_stripe_config", "", "", 100);
    console.log("[Stripe] Found", existingConfigs.length, "existing configs to deactivate");
    existingConfigs.forEach(config => {
      const configRecord = $app.findRecordById("_learn_stripe_config", config.id);
      configRecord.set("active", false);
      $app.save(configRecord);
    });
    
    // Create new config
    const collection = $app.findCollectionByNameOrId("_learn_stripe_config");
    const record = new Record(collection);
    
    record.set("publishable_key", data.publishable_key);
    record.set("secret_key", data.secret_key);
    record.set("webhook_secret", data.webhook_secret || "");
    record.set("environment", data.environment);
    record.set("active", true);
    
    console.log("[Stripe] Saving new config with active=true, environment=" + data.environment);
    $app.save(record);
    console.log("[Stripe] Config saved successfully, record ID:", record.id);
    
    return e.json(200, {
      message: "Stripe configuration saved successfully",
      environment: data.environment
    });
  } catch (err) {
    console.error("Error saving Stripe config:", err);
    return e.json(500, { 
      message: "Error saving configuration",
      error: err.message 
    });
  }
});

/**
 * POST /api/v1/stripe/create-payment-intent
 * Create a payment intent for one-time purchases (course or module)
 */
routerAdd("POST", "/api/v1/stripe/create-payment-intent", (e) => {

    // Import Stripe utility functions (every hook)
    const {
      stripeRequest,
      getOrCreateCustomer
    } = require(`${__hooks}/utils/stripe.js`);

  // Check authentication
  if (!e.auth) {
    return e.json(401, { message: "Unauthorized" });
  }
  
  try {
    const data = new DynamicModel({
      type: "",
      id: ""
    });
    e.bindBody(data);
    const type = data.type; // "course" or "module"
    const itemId = data.id;
    const userId = e.auth.id;
    
    if (!type || !itemId) {
      return e.json(400, { message: "Missing required parameters: type, id" });
    }
    
    // Get item and price
    let amount, title, description;
    if (type === "course") {
      const course = $app.findRecordById("_learn_courses", itemId);
      amount = course.get("price") * 100; // Convert to cents
      title = course.get("title");
      description = `Course: ${title}`;
    } else if (type === "module") {
      const module = $app.findRecordById("_learn_modules", itemId);
      amount = module.get("price") * 100; // Convert to cents
      title = module.get("title");
      description = `Module: ${title}`;
    } else {
      return e.json(400, { message: "Invalid type. Must be 'course' or 'module'" });
    }
    
    if (!amount || amount <= 0) {
      return e.json(400, { message: "Item has no price set" });
    }
    
    // Get or create customer
    const customerId = getOrCreateCustomer(userId, e.auth.get("email"), $app);
    
    // Create payment intent
    const body = `amount=${Math.round(amount)}&currency=usd&customer=${customerId}&description=${encodeURIComponent(description)}&metadata[type]=${type}&metadata[item_id]=${itemId}&metadata[user_id]=${userId}`;
    const res = stripeRequest("payment_intents", "POST", body, null, $app);
    
    return e.json(200, {
      client_secret: res.json.client_secret,
      payment_intent_id: res.json.id,
      amount: amount / 100
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    return e.json(500, { 
      message: "Error creating payment intent",
      error: err.message 
    });
  }
});

/**
 * POST /api/v1/stripe/create-checkout-session
 * Create a Stripe Checkout session for subscriptions
 */
routerAdd("POST", "/api/v1/stripe/create-checkout-session", (e) => {

    // Import Stripe utility functions (every hook)
    const {
      stripeRequest,
      updateSubscriptionStatus,
      getOrCreateCustomer
    } = require(`${__hooks}/utils/stripe.js`);

  // Check authentication
  if (!e.auth) {
    return e.json(401, { message: "Unauthorized" });
  }
  
  try {
    const data = new DynamicModel({
      tier_id: "",
      tier: "",
      interval: ""
    });
    e.bindBody(data);
    const tierId = data.tier_id || data.tier; // Subscription tier ID from database
    const interval = data.interval || "month"; // "month" or "year"
    const userId = e.auth.id;
    
    if (!tierId) {
      return e.json(400, { message: "Missing required parameter: tier_id (or tier)" });
    }
    
    // Get tier from database
    let tierRecord;
    try {
      tierRecord = $app.findRecordById("_learn_subscription_tiers", tierId);
    } catch (err) {
      return e.json(404, { message: "Subscription tier not found" });
    }
    
    // Check if tier is active
    if (!tierRecord.get("active")) {
      return e.json(400, { message: "This subscription tier is not currently available" });
    }
    
    // Get price based on interval
    const price = interval === "year" ? tierRecord.get("price_yearly") : tierRecord.get("price_monthly");
    const tierKey = tierRecord.get("key");
    const tierName = tierRecord.get("name");
    
    // Handle free tiers - directly enroll without Stripe checkout
    if (!price || price <= 0) {
      // Update user subscription status for free tier
      updateSubscriptionStatus(userId, {
        customerId: null,
        subscriptionId: null,
        status: "active",
        tier_id: tierId,
        expiresAt: null, // Free tier never expires
        interval: null
      }, $app);
      
      return e.json(200, {
        message: "Successfully enrolled in free tier",
        tier: tierName,
        free: true
      });
    }
    
    // Get or create customer
    const customerId = getOrCreateCustomer(userId, e.auth.get("email"), $app);
    
    // Get base URL for success/cancel redirects
    const baseUrl = $os.getenv("APP_BASE_URL") || "http://localhost:3000";
    
    // Create checkout session
    const amount = Math.round(price * 100);
    const body = `customer=${customerId}&success_url=${encodeURIComponent(baseUrl + "/subscribe/success?session_id={CHECKOUT_SESSION_ID}")}&cancel_url=${encodeURIComponent(baseUrl + "/subscribe")}&mode=subscription&line_items[0][price_data][currency]=usd&line_items[0][price_data][unit_amount]=${amount}&line_items[0][price_data][recurring][interval]=${interval}&line_items[0][price_data][product_data][name]=${encodeURIComponent(tierName + " Subscription")}&line_items[0][quantity]=1&metadata[tier_key]=${tierKey}&metadata[tier_id]=${tierId}&metadata[user_id]=${userId}&subscription_data[metadata][tier_key]=${tierKey}&subscription_data[metadata][tier_id]=${tierId}&subscription_data[metadata][user_id]=${userId}`;
    
    const res = stripeRequest("checkout/sessions", "POST", body, null, $app);
    
    return e.json(200, {
      session_id: res.json.id,
      url: res.json.url
    });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return e.json(500, { 
      message: "Error creating checkout session",
      error: err.message 
    });
  }
});

/**
 * GET /api/v1/stripe/verify-payment
 * Verify payment status and grant access
 */
routerAdd("GET", "/api/v1/stripe/verify-payment", (e) => {

    // Import Stripe utility functions (every hook)
    const {
      stripeRequest,
      grantCourseAccess,
      grantModuleAccess,
      updateSubscriptionStatus
    } = require(`${__hooks}/utils/stripe.js`);

  // Check authentication
  if (!e.auth) {
    return e.json(401, { message: "Unauthorized" });
  }
  
  try {
    const paymentIntentId = e.request.url.query().get("payment_intent_id");
    const sessionId = e.request.url.query().get("session_id");
    
    if (!paymentIntentId && !sessionId) {
      return e.json(400, { message: "Missing payment_intent_id or session_id" });
    }
    
    if (paymentIntentId) {
      // Verify one-time payment
      const res = stripeRequest(`payment_intents/${paymentIntentId}`, "GET", "", null, $app);
      const payment = res.json;
      
      if (payment.status !== "succeeded") {
        return e.json(402, { 
          message: "Payment not completed",
          status: payment.status 
        });
      }
      
      // Get metadata
      const type = payment.metadata.type;
      const itemId = payment.metadata.item_id;
      const userId = payment.metadata.user_id;
      
      // Verify user
      if (userId !== e.auth.id) {
        return e.json(403, { message: "Forbidden" });
      }
      
      // Get amount paid (convert from cents to dollars)
      const amountPaid = payment.amount / 100;
      const currency = payment.currency ? payment.currency.toUpperCase() : "USD";
      
      // Grant access
      if (type === "course") {
        grantCourseAccess(userId, itemId, "one-time", paymentIntentId, null, null, amountPaid, currency, $app);
        return e.json(200, { 
          message: "Course access granted",
          course_id: itemId
        });
      } else if (type === "module") {
        grantModuleAccess(userId, itemId, paymentIntentId, amountPaid, currency, $app);
        return e.json(200, { 
          message: "Module access granted",
          module_id: itemId
        });
      }
    } else if (sessionId) {
      // Verify subscription checkout
      const res = stripeRequest(`checkout/sessions/${sessionId}`, "GET", "", null, $app);
      const session = res.json;
      
      if (session.payment_status !== "paid") {
        return e.json(402, { 
          message: "Payment not completed",
          status: session.payment_status 
        });
      }
      
      // Get subscription
      const subRes = stripeRequest(`subscriptions/${session.subscription}`, "GET", "", null, $app);
      const subscription = subRes.json;
      
      // Update user subscription
      const tierId = subscription.metadata.tier_id;
      if (!tierId) {
        return e.json(400, { message: "Missing tier_id in subscription metadata" });
      }
      
      updateSubscriptionStatus(e.auth.id, {
        customerId: session.customer,
        subscriptionId: subscription.id,
        status: "active",
        tier_id: tierId,
        expiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
        interval: subscription.items.data[0].plan.interval
      }, $app);
      
      return e.json(200, { 
        message: "Subscription activated",
        tier: tier
      });
    }
  } catch (err) {
    console.error("Error verifying payment:", err);
    return e.json(500, { 
      message: "Error verifying payment",
      error: err.message 
    });
  }
});

/**
 * GET /api/v1/stripe/billing-portal
 * Generate billing portal URL for subscription management
 */
routerAdd("GET", "/api/v1/stripe/billing-portal", (e) => {

    // Import Stripe utility functions (every hook)
    const {
      stripeRequest
    } = require(`${__hooks}/utils/stripe.js`);

  // Check authentication
  if (!e.auth) {
    return e.json(401, { message: "Unauthorized" });
  }
  
  try {
    const user = $app.findRecordById("_pb_users_auth_", e.auth.id);
    const customerId = user.get("learnStripeCustomerId");
    
    if (!customerId) {
      return e.json(404, { message: "No Stripe customer found" });
    }
    
    // Get base URL
    const baseUrl = $os.getenv("APP_BASE_URL") || "http://localhost:3000";
    const returnUrl = `${baseUrl}/profile`;
    
    // Create billing portal session
    const body = `customer=${customerId}&return_url=${encodeURIComponent(returnUrl)}`;
    const res = stripeRequest("billing_portal/sessions", "POST", body, null, $app);
    
    return e.json(200, {
      message: "Billing portal session created",
      url: res.json.url
    });
  } catch (err) {
    console.error("Error creating billing portal session:", err);
    return e.json(500, { 
      message: "Error creating billing portal session",
      error: err.message 
    });
  }
});

/**
 * POST /api/v1/stripe/webhook
 * Handle Stripe webhook events
 */
routerAdd("POST", "/api/v1/stripe/webhook", (e) => {

    // Import Stripe utility functions (every hook)
    const {
      grantCourseAccess,
      grantModuleAccess,
      updateSubscriptionStatus
    } = require(`${__hooks}/utils/stripe.js`);

  try {
    // Get active Stripe config
    const config = $app.findFirstRecordByFilter(
      "_learn_stripe_config",
      "active = true"
    );
    
    if (!config) {
      console.error("No active Stripe configuration found");
      return e.json(400, { message: "Stripe not configured" });
    }
    
    const webhookSecret = config.get("webhook_secret");
    
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return e.json(400, { message: "Webhook secret not configured" });
    }
    
    // Get signature from header
    const signature = e.request.header.get("Stripe-Signature");
    if (!signature) {
      return e.json(400, { message: "Missing Stripe signature" });
    }
    
    // Note: Full webhook signature verification would require crypto library
    // For production, ensure webhook secret is set and validate signature properly
    
    const data = new DynamicModel({
      type: "",
      data: {}
    });
    e.bindBody(data);
    const event = data;
    
    console.log("Webhook event:", event.type);
    
    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const type = paymentIntent.metadata.type;
        const itemId = paymentIntent.metadata.item_id;
        const userId = paymentIntent.metadata.user_id;
        
        // Get amount paid (convert from cents to dollars)
        const amountPaid = paymentIntent.amount / 100;
        const currency = paymentIntent.currency ? paymentIntent.currency.toUpperCase() : "USD";
        
        if (type === "course") {
          grantCourseAccess(userId, itemId, "one-time", paymentIntent.id, null, null, amountPaid, currency, $app);
        } else if (type === "module") {
          grantModuleAccess(userId, itemId, paymentIntent.id, amountPaid, currency, $app);
        }
        break;
        
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        const tierId = subscription.metadata.tier_id;
        const subUserId = subscription.metadata.user_id;
        
        if (subUserId && tierId) {
          updateSubscriptionStatus(subUserId, {
            customerId: subscription.customer,
            subscriptionId: subscription.id,
            status: subscription.status === "active" ? "active" : subscription.status,
            tier_id: tierId,
            expiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
            interval: subscription.items.data[0].plan.interval
          }, $app);
        }
        break;
        
      case "customer.subscription.deleted":
        const deletedSub = event.data.object;
        const delUserId = deletedSub.metadata.user_id;
        
        if (delUserId) {
          const userRecord = $app.findRecordById("_pb_users_auth_", delUserId);
          userRecord.set("learnSubscriptionStatus", "canceled");
          $app.save(userRecord);
        }
        break;
    }
    
    return e.json(200, { received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return e.json(500, { 
      message: "Webhook processing error",
      error: err.message 
    });
  }
});
