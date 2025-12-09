package it.eng.dome.subscriptions.management.controller;

import it.eng.dome.tmforum.tmf620.v4.model.ProductOffering;
import it.eng.dome.tmforum.tmf632.v4.model.Organization;
import it.eng.dome.tmforum.tmf637.v4.model.Product;
import it.eng.dome.subscriptions.management.exception.BadSubscriptionException;
import it.eng.dome.subscriptions.management.exception.BadTmfDataException;
import it.eng.dome.subscriptions.management.exception.ExternalServiceException;
import it.eng.dome.subscriptions.management.model.Subscription;
import it.eng.dome.subscriptions.management.service.SubscriptionManagementService;
import it.eng.dome.subscriptions.management.service.TMFDataRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/management")
@Tag(name = "Subscriptions Management Controller", description = "APIs to manage the subscriptions-management")
public class SubscriptionManagementController {

    protected final Logger logger = LoggerFactory.getLogger(SubscriptionManagementController.class);

    @Autowired
    TMFDataRetriever tmfDataRetriever;

    @Autowired
    SubscriptionManagementService managementService;

    public SubscriptionManagementController() {
        // Constructor for dependency injection
    }

   @GetMapping("/configuration")
    public ResponseEntity<Map<String, Object>> getConfiguration() {
        Map<String, Object> config = managementService.getConfiguration();
        try {
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
   }

    @GetMapping("/organizations")
    public ResponseEntity<List<Organization>> listOrganizations() {
        try {
            List<Organization> organizations = managementService.listOrganizations();
            return ResponseEntity.ok(organizations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }

    @GetMapping("/organizations/{organizationId}/subscriptions")
    public ResponseEntity<?> listSubscriptions(@PathVariable String organizationId) {
        try {
            List<Product> products = this.managementService.getSubscriptionsByBuyerId(organizationId);
            return ResponseEntity.ok(products);
        } catch (ExternalServiceException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/organizations/{organizationId}/subscription/current")
    public ResponseEntity<?> listPurchasedProducts(@PathVariable String organizationId) {
        try {
            List<Product> products = this.managementService.getPurchasedProducts(organizationId);
            return ResponseEntity.ok(products);
        } catch (ExternalServiceException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/organizations/{organizationId}/subscription/older")
    public ResponseEntity<?> getOtherProducts(@PathVariable String organizationId) {
        try {
            List<Product> all = managementService.getNotActiveSubscriptionForOrg(organizationId);
            return ResponseEntity.ok(all);

        } catch (ExternalServiceException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error: " + e.getMessage());
        }
    }

    @GetMapping("/plans/active")
    public ResponseEntity<List<ProductOffering>> listProductOfferingPlans() {
        try {
            List<ProductOffering> planPOs = this.managementService.getProductOfferingPlans();
            return ResponseEntity.ok(planPOs);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }

    @PostMapping("/organizations/{organizationId}/subscription")
    public ResponseEntity<String> saveProduct(@PathVariable String organizationId, @RequestBody Subscription subscription) {
        try {
            String productId = managementService.createSubscription(subscription);
            return ResponseEntity.ok(productId);
        } catch (BadSubscriptionException | BadTmfDataException e) {
            logger.error(e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (ExternalServiceException e) {
            logger.error(e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error: " + e.getMessage());
        }
    }

    @PatchMapping("/organizations/{organizationId}/subscription/{subscriptionId}")
    public ResponseEntity<?> updateProduct(
            @PathVariable String organizationId,
            @PathVariable String subscriptionId,
            @RequestBody Product subscription
    ) {
        try {
            managementService.updateSubscription(organizationId, subscription);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Product updated successfully!");
            return ResponseEntity.ok(response);
        } catch (BadSubscriptionException | BadTmfDataException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (ExternalServiceException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "External service error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/subscription/statuses")
    public ResponseEntity<List<String>> getSubscriptionStatuses() {
        try {
            List<String> statuses = managementService.getProductStatuses();
            return ResponseEntity.ok(statuses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }

}
