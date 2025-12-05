package it.eng.dome.subscriptions.management.controller;

import it.eng.dome.tmforum.tmf620.v4.model.ProductOffering;
import it.eng.dome.tmforum.tmf632.v4.model.Organization;
import it.eng.dome.tmforum.tmf637.v4.model.Product;
import it.eng.dome.subscriptions.management.exception.BadSubscriptionException;
import it.eng.dome.subscriptions.management.exception.BadTmfDataException;
import it.eng.dome.subscriptions.management.exception.ExternalServiceException;
import it.eng.dome.subscriptions.management.service.SubscriptionManagementService;
import it.eng.dome.subscriptions.management.service.TMFDataRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/management")
public class SubscriptionManagementController {

    protected final Logger logger = LoggerFactory.getLogger(SubscriptionManagementController.class);

    @Autowired
    TMFDataRetriever tmfDataRetriever;

    @Autowired
    SubscriptionManagementService managementService;

    public SubscriptionManagementController() {
        // Constructor for dependency injection
    }
//
//    @GetMapping("/config")
//    public ResponseEntity<Map<String, Object>> getConfig() {
//    }

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

    @GetMapping("/organizations/{organizationId}/purchasedProducts")
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

    @GetMapping("/organizations/{organizationId}/otherProducts")
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

    @GetMapping("/productOffering/validPlans")
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

    @PostMapping("/product/save")
    public ResponseEntity<?> saveProduct(
            @RequestParam String orgId,
            @RequestParam String offeringId,
            @RequestParam(required = false) Double share
    ) {
        try {
            String productId = managementService.saveProduct(orgId, offeringId, share);
            return ResponseEntity.ok(productId);
        } catch (BadSubscriptionException | BadTmfDataException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
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

    @PostMapping("/subscription/update")
    public ResponseEntity<?> updateProduct(
            @RequestParam String orgId,
            @RequestBody Product incomingProduct
    ) {
        try {
            managementService.updateProduct(orgId, incomingProduct);
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
}
