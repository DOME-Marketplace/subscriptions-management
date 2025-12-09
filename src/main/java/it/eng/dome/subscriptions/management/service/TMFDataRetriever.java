package it.eng.dome.subscriptions.management.service;

import it.eng.dome.brokerage.api.APIPartyApis;
import it.eng.dome.brokerage.api.AccountManagementApis;
import it.eng.dome.brokerage.api.ProductCatalogManagementApis;
import it.eng.dome.brokerage.api.ProductInventoryApis;
import it.eng.dome.brokerage.api.fetch.FetchUtils;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOffering;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOfferingPrice;
import it.eng.dome.tmforum.tmf632.v4.model.Organization;
import it.eng.dome.tmforum.tmf637.v4.model.Product;
import it.eng.dome.tmforum.tmf637.v4.model.ProductCreate;
import it.eng.dome.tmforum.tmf637.v4.model.ProductUpdate;
import it.eng.dome.tmforum.tmf666.v4.ApiException;
import it.eng.dome.tmforum.tmf666.v4.model.BillingAccount;
import it.eng.dome.subscriptions.management.exception.BadTmfDataException;
import it.eng.dome.subscriptions.management.exception.ExternalServiceException;
import it.eng.dome.subscriptions.management.model.ConfigurableCharacteristic;
import it.eng.dome.subscriptions.management.model.Plan;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

@Service
public class TMFDataRetriever {

    private final Logger logger = LoggerFactory.getLogger(TMFDataRetriever.class);

    // TMForum API
    private ProductCatalogManagementApis productCatalogManagementApis;
    private APIPartyApis apiPartyApis;
    private ProductInventoryApis productInventoryApis;
    private AccountManagementApis accountManagementApis;

    public TMFDataRetriever(ProductCatalogManagementApis productCatalogManagementApis,
                            APIPartyApis apiPartyApis,
                            ProductInventoryApis productInventoryApis,
                            AccountManagementApis accountManagementApis) {
        this.productCatalogManagementApis = productCatalogManagementApis;
        this.apiPartyApis = apiPartyApis;
        this.productInventoryApis = productInventoryApis;
        this.accountManagementApis = accountManagementApis;
    }

    // ======== TMF ORGANIZATIONS ========

    public List<Organization> getOrganizations()
            throws ExternalServiceException {
        logger.info("Retrieving all organizations from TMF API");
        try {
            List<Organization> allOrgs = FetchUtils.streamAll(
                    apiPartyApis::listOrganizations,   // method reference
                    null,                       	  // fields
                    null,            				 // filter
                    20                             // pageSize
            ).toList();
            logger.info("Retrieved {} organizations from TMF API", allOrgs.size());
            return allOrgs;
        } catch (Exception e) {
            logger.error("Failed to retrieve all organizations", e);
            throw new ExternalServiceException("Failed to retrieve all organizations", e);
        }
    }

    public Organization getOrganization(String organizationId)
            throws BadTmfDataException, ExternalServiceException {
        if (organizationId == null) {
            throw new BadTmfDataException("Organization", organizationId, "Organization ID cannot be null");
        }

        try {
            return this.apiPartyApis.getOrganization(organizationId, null);
        } catch (it.eng.dome.tmforum.tmf632.v4.ApiException e) {
            // 404 not found
            if (e.getCode() == 404) {
                logger.info("Organization {} not found", organizationId);
                return null;
            }
            // Other errors
            logger.error("Error retrieving organization {}: {}", organizationId, e.getMessage(), e);
            throw new ExternalServiceException("Failed to retrieve organization with ID: " + organizationId, e);
        } catch (Exception e) {
            // Unexpected errors (e.g., runtime, etc)
            logger.error("Unexpected error retrieving organization {}", organizationId, e);
            throw new ExternalServiceException("Unexpected error retrieving organization " + organizationId, e);
        }
    }

    public Organization getOrganizationByIdmId(String idmId)
            throws ExternalServiceException, BadTmfDataException {

        List<Organization> all = getOrganizations();

        return all.stream()
                .filter(org -> org.getExternalReference() != null &&
                        org.getExternalReference().stream().anyMatch(ref ->
                                "idm_id".equals(ref.getExternalReferenceType()) &&
                                        idmId.equals(ref.getName())
                        )
                )
                .findFirst()
                .orElseThrow(() -> new BadTmfDataException(
                        "Organization", idmId, "No organization found with given idm_id"
                ));
    }

    // ======== TMF BILLING ACCOUNTS ========

    public BillingAccount fetchBillingAccount(Map<String, String> filter, int batchSize) throws ExternalServiceException {
        List<BillingAccount> ba;
        try {
            ba = this.accountManagementApis.listBillingAccounts(null, 0, batchSize, filter);
        } catch (ApiException e) {
            //FIXME: fixxxxxx
            throw new ExternalServiceException("Billing account not found" + e.getMessage(), e);
        }
        //FIXME: take the first one only for now
        if (ba.isEmpty()) {
            throw new ExternalServiceException("Billing Account Not Found");
        }
        return ba.get(0);
    }

    // ======== TMF PRODUCTS ========

    public Product getProduct(String productId, String fields)
            throws BadTmfDataException, ExternalServiceException {
        if (productId == null) {
            throw new BadTmfDataException("Product", productId, "Product ID cannot be null");
        }

        try {
            Product prod = this.productInventoryApis.getProduct(productId, fields);
            if (prod == null) {
                logger.info("No product found for product with id {}: ", productId);
                return null;
            }
            return prod;
        } catch (Exception e) {
            logger.error("Failed to retrieve product {}", productId, e);
            throw new ExternalServiceException("Failed to retrieve product with ID: " + productId, e);
        }
    }

    public void fetchProducts(String fields, Map<String, String> filter, int batchSize, Consumer<Product> consumer)
            throws ExternalServiceException {
        try {
            FetchUtils.fetchByBatch(
                    (FetchUtils.ListedFetcher<Product>) (f, flt, size, offset) ->
                            productInventoryApis.listProducts(f, flt, size, offset),
                    fields,
                    filter,
                    batchSize,
                    batch -> batch.forEach(consumer)
            );
        } catch (Exception e) {
            throw new ExternalServiceException("Failed to fetch Products by batch", e);
        }
    }

    public void fetchAllSubscription(int batchSize, String buyerId, Consumer<Product> consumer) throws ExternalServiceException {
        try {
            // Batch su ProductOffering categoria "DOME OPERATOR Plan"
            this.fetchProductOfferings(null, Map.of("category.name", "DOME OPERATOR Plan"), batchSize, po -> {
                try {
                    Map<String, String> filter = Map.of(
                            "productOffering.id", po.getId(),
                            "relatedParty.id", buyerId
                    );

                    // FIXME: post-filter to make sure that the RP with the buyerId in the filter ha the role Buyer

                    // Fetch dei prodotti associati al PO
                    this.fetchProducts(null, filter, batchSize, product -> {
                        try {
                            consumer.accept(product);
                        } catch (Exception e) {
                            logger.warn("Failed to process product {}: {}", product.getId(), e.getMessage(), e);
                        }
                    });

                } catch (Exception e) {
                    logger.warn("Failed to process ProductOffering {}: {}", po.getId(), e.getMessage(), e);
                }
            });
        } catch (Exception e) {
            logger.error("Failed to fetch other subscriptions", e);
            throw new ExternalServiceException("Failed to fetch other subscriptions", e); //FE
        }
    }

    public void fetchValidSubscriptions(int batchSize, Consumer<Product> consumer) throws ExternalServiceException {
        try {
            // Batch su ProductOffering categoria "DOME OPERATOR Plan"
            this.fetchProductOfferings(null, Map.of("category.name", "DOME OPERATOR Plan"), batchSize, po -> {
                try {
                    Map<String, String> filter = Map.of("productOffering.id", po.getId());

                    // Fetch dei prodotti filtrati per offering
                    this.fetchProducts(null, filter, batchSize, product -> {
                        try {
                            boolean isActive = product.getStatus() != null &&
                                    "active".equalsIgnoreCase(product.getStatus().getValue());
                            boolean dateValid = product.getStartDate() != null &&
                                    (product.getTerminationDate() == null || product.getTerminationDate().isAfter(OffsetDateTime.now()));

                            if (isActive && dateValid) {
                                consumer.accept(product);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to process product {}: {}", product.getId(), e.getMessage(), e);
                        }
                    });

                } catch (Exception e) {
                    logger.warn("Failed to process ProductOffering {}: {}", po.getId(), e.getMessage(), e);
                }
            });
        } catch (Exception e) {
            logger.error("Failed to fetch valid subscriptions", e);
            throw new ExternalServiceException("Failed to fetch valid subscriptions", e); //FE
        }
    }

    public String saveProduct(ProductCreate product) throws ExternalServiceException {
        try {
            return this.productInventoryApis.createProduct(product);
        } catch (Exception e) {
            throw new ExternalServiceException("Error during product creation: " + e.getMessage(), e);
        }
    }

    public void updateProduct(String id, ProductUpdate product) throws ExternalServiceException {
        try {
            this.productInventoryApis.updateProduct(id, product);
        } catch (Exception e) {
            throw new ExternalServiceException("Error during product creation: " + e.getMessage(), e);
        }
    }

    // ======== PRODUCT OFFERING ========
    public ProductOffering getProductOffering(String id, String fields) throws it.eng.dome.tmforum.tmf620.v4.ApiException {
        this.logger.info("Request: getProductOffering by id {}", id);
        if (fields != null) {
            this.logger.debug("Selected attributes: [{}]", fields);
        }

        return this.productCatalogManagementApis.getProductOffering(id, fields);
    }

    public void fetchProductOfferings(String fields, Map<String, String> filter, int batchSize, Consumer<ProductOffering> consumer)
            throws ExternalServiceException {
        try {
            FetchUtils.fetchByBatch(
                    (FetchUtils.ListedFetcher<ProductOffering>) (f, flt, size, offset) ->
                            productCatalogManagementApis.listProductOfferings(f, flt, size, offset),
                    fields,
                    filter,
                    batchSize,
                    batch -> batch.forEach(consumer)
            );
        } catch (Exception e) {
            throw new ExternalServiceException("Failed to fetch ProductOfferings by batch", e);
        }
    }

    public void fetchValidPlans(int batchSize, Consumer<ProductOffering> consumer) throws ExternalServiceException {
        try {
            this.fetchProductOfferings(null, Map.of("category.name", "DOME OPERATOR Plan"), batchSize, po -> {
                try {

                    if (!"Launched".equalsIgnoreCase(po.getLifecycleStatus())) {
                        return;
                    }

                    OffsetDateTime now = OffsetDateTime.now();
                    if (po.getValidFor() != null) {
                        OffsetDateTime start = po.getValidFor().getStartDateTime();
                        OffsetDateTime end = po.getValidFor().getEndDateTime();
                        if (start != null && start.isAfter(now)) return;
                        if (end != null && end.isBefore(now)) return;
                    }

                    consumer.accept(po);

                } catch (Exception e) {
                    logger.warn("Failed to process ProductOffering {}: {}", po.getId(), e.getMessage(), e);
                }
            });

        } catch (Exception e) {
            logger.error("Failed to fetch valid plans", e);
            throw new ExternalServiceException("Failed to fetch valid plans", e);
        }
    }

    public void fetchAvailablePlans(int batchSize, Consumer<Plan> consumer) throws ExternalServiceException {
        try {
            this.fetchProductOfferings(null, Map.of("category.name", "DOME OPERATOR Plan"), batchSize, po -> {
                try {

                    if (!"Launched".equalsIgnoreCase(po.getLifecycleStatus())) {
                        return;
                    }

                    Plan plan = new Plan();

                    OffsetDateTime now = OffsetDateTime.now();
                    if (po.getValidFor() != null) {
                        OffsetDateTime start = po.getValidFor().getStartDateTime();
                        OffsetDateTime end = po.getValidFor().getEndDateTime();
                        if (start != null && start.isAfter(now)) return;
                        if (end != null && end.isBefore(now)) return;
                    }

                    plan.setDescription(po.getDescription());
                    plan.setName(po.getName());
                    plan.setOfferingId(po.getId());
                    // TODO: consider also product offering prices
                    plan.setOfferingPriceId(null);
                    
                    // set configurable characteristics (TODO: should be retrieved from the offering, specs, etc..)
                    boolean isFederated = plan.getName().toLowerCase().contains("federated") || plan.getName().toLowerCase().contains("fms");
                    if(isFederated) {
                        ConfigurableCharacteristic revPerc = new ConfigurableCharacteristic();
                        revPerc.setKey("revenuePercentage");
                        revPerc.setHide(false);
                        revPerc.setLabel("Revenue share %");
                        revPerc.setType("percentage");
                        plan.addConfigurableCharacteristic(revPerc);
                        ConfigurableCharacteristic mktSub = new ConfigurableCharacteristic();
                        mktSub.setKey("marketplaceSubscription");
                        mktSub.setHide(true);
                        mktSub.setLabel("This is for a Federated Marketplace");
                        mktSub.setType("boolean");
                        mktSub.setValue("true");
                        plan.addConfigurableCharacteristic(mktSub);
                    }
                    ConfigurableCharacteristic actDate = new ConfigurableCharacteristic();
                    actDate.setHide(false);
                    actDate.setLabel("Activation Date");
                    actDate.setKey("activationDate");
                    actDate.setType("date");
                    plan.addConfigurableCharacteristic(actDate);

                    consumer.accept(plan);

                } catch (Exception e) {
                    logger.warn("Failed to process ProductOffering {}: {}", po.getId(), e.getMessage(), e);
                }
            });

        } catch (Exception e) {
            logger.error("Failed to fetch valid plans", e);
            throw new ExternalServiceException("Failed to fetch valid plans", e);
        }
    }

    // ======== PRODUCT OFFERING PRICE ========

    public ProductOfferingPrice getProductOfferingPrice(String popId, String fields)
            throws BadTmfDataException, ExternalServiceException {
        if (popId == null) {
            throw new BadTmfDataException("ProductOfferingPrice", popId, "Product Offering Price ID cannot be null");
        }

        try {
            return this.productCatalogManagementApis.getProductOfferingPrice(popId, fields);
        } catch (Exception e) {
            logger.error("Failed to retrieve product offering price {}", popId, e);
            throw new ExternalServiceException("Failed to retrieve product offering price with ID: " + popId, e);
        }
    }
}