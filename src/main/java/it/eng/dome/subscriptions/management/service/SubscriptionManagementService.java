package it.eng.dome.subscriptions.management.service;

import it.eng.dome.tmforum.tmf620.v4.ApiException;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOffering;
import it.eng.dome.tmforum.tmf632.v4.model.Organization;
import it.eng.dome.tmforum.tmf637.v4.model.*;
import it.eng.dome.tmforum.tmf666.v4.model.BillingAccount;
import it.eng.dome.subscriptions.management.builder.ProductBuilder;
import it.eng.dome.subscriptions.management.exception.BadSubscriptionException;
import it.eng.dome.subscriptions.management.exception.BadTmfDataException;
import it.eng.dome.subscriptions.management.exception.ExternalServiceException;
import it.eng.dome.subscriptions.management.model.Role;
import it.eng.dome.subscriptions.management.model.comparator.OrganizationComparator;
import it.eng.dome.subscriptions.management.utils.RelatedPartyUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SubscriptionManagementService {

    @Value("${subscription.max_active_subscriptions:1}")
    private int maxActiveSubscriptions;

    private final Logger logger = LoggerFactory.getLogger(SubscriptionManagementService.class);

    @Autowired
    private TMFDataRetriever tmfDataRetriever;

    public List<Organization> listOrganizations () throws ExternalServiceException {
        List<Organization> orgs = tmfDataRetriever.getOrganizations();
        List<Organization> mutableOrgs = new ArrayList<>(orgs); // copy mutable list
        Collections.sort(mutableOrgs, new OrganizationComparator());
        return mutableOrgs;
    }

    public List<Product> getPurchasedProducts (String buyerId) throws ExternalServiceException {
        try {
            List<Product> purchasedProducts = new ArrayList<>();
            // Batch processing of all active products
            tmfDataRetriever.fetchValidSubscriptions(100,
                    product -> {
                        // Keep only products where the buyer has the BUYER role
                        if (RelatedPartyUtils.productHasPartyWithRole(product, buyerId, Role.BUYER)) {
                            purchasedProducts.add(product);
                        }
                    });

            return purchasedProducts;
        } catch (ExternalServiceException e) {
            logger.error("Failed to fetch purchased products for organization {}: {}", buyerId, e.getMessage(), e);
            throw e;
        }
    }

    public List<Product> getNotActiveSubscriptionForOrg(String buyerId) throws ExternalServiceException {
        List<Product> all = new ArrayList<>();
        tmfDataRetriever.fetchAllSubscription(10, buyerId, all::add);

        if (all.isEmpty()) {
            return Collections.emptyList();
        }

        List<Product> others = new ArrayList<>();
        for (Product p : all) {
            if (p.getStatus() == null) continue;
            String st = p.getStatus().getValue().toLowerCase();
            if (!"active".equals(st)) {
                others.add(p);
            }
        }
        return others;
    }

    public List<ProductOffering> getProductOfferingPlans () throws ExternalServiceException {
        List<ProductOffering> planPOs = new ArrayList<>();
        tmfDataRetriever.fetchValidPlans(10,
                planPOs::add
        );
        logger.info("Total POs (plans) fetched: {}", planPOs.size());
        return planPOs;
    }

    public String saveProduct(String buyerId, String offeringId, Double share)
            throws BadTmfDataException, ExternalServiceException, ApiException {

        Organization buyer = tmfDataRetriever.getOrganization(buyerId);
        ProductOffering offering = tmfDataRetriever.getProductOffering(offeringId, null);

        //check max active subscriptions
        this.checkMaxActiveSubscriptions(buyerId);

        BillingAccountRef baRef = this.getBillingAccountByOrganization(buyerId);

        ProductBuilder builder = new ProductBuilder(tmfDataRetriever);
        ProductCreate pc = builder.build(offering, buyer, baRef, share);

        return tmfDataRetriever.saveProduct(pc);
    }

    public BillingAccountRef getBillingAccountByOrganization (String orgId) throws ExternalServiceException {
        Map<String, String> flt = new HashMap<>();
        flt.put("relatedParty.id", orgId);

        BillingAccount ba;
        try {
            ba = this.tmfDataRetriever.fetchBillingAccount(flt, 20);
        } catch (ExternalServiceException e) {
            throw new ExternalServiceException(
                    "Billing Account Not Found For Org with ID: " + orgId, e
            );
        }

        //convert
        BillingAccountRef baRef = new BillingAccountRef();
        baRef.setId(Objects.requireNonNull(ba.getId()));
        baRef.setHref(String.valueOf(ba.getHref()));
        baRef.setName(ba.getName());

        return baRef;
    }

    public List<String> getProductStatuses() {
        List<String> statuses = new ArrayList<>();
        for (ProductStatusType status : ProductStatusType.values()) {
            statuses.add(status.toString());
        }
        return statuses;
    }

    @SuppressWarnings("null")
	public void updateProduct(String buyerId, Product incomingProduct)
            throws ExternalServiceException, BadTmfDataException {
        if (incomingProduct.getStatus() != null &&
                ProductStatusType.ACTIVE.getValue().equalsIgnoreCase(incomingProduct.getStatus().getValue())) {
            // if activating, check max active subscriptions
            this.checkMaxActiveSubscriptions(buyerId);
        }

//        String offeringId = incomingProduct.getProductOffering().getId();
        Product existingProduct = tmfDataRetriever.getProduct(incomingProduct.getId(), null);
        if (existingProduct == null) {
            //fixme: better exception
            throw new BadTmfDataException("Product", existingProduct.getId(), "No existing valid product found to update");
        }
        ProductUpdate update = buildProductUpdateFromProduct(incomingProduct);
        tmfDataRetriever.updateProduct(existingProduct.getId(), update);
    }

    private ProductUpdate buildProductUpdateFromProduct(Product product) {
        ProductUpdate update = new ProductUpdate()
                .status(product.getStatus());
//                .atSchemaLocation(URI.create("https://raw.githubusercontent.com/DOME-Marketplace/tmf-api/refs/heads/main/DOME/TrackedEntity.schema.json"));
//                .startDate(product.getStartDate())
//                .terminationDate(product.getTerminationDate())
//                .name(product.getName())
//                .billingAccount(product.getBillingAccount())
//                .productOffering(product.getProductOffering());
        return update;
    }

    private void checkMaxActiveSubscriptions(String orgId)
            throws ExternalServiceException, BadSubscriptionException {

        List<Product> activeSubscriptions = new ArrayList<>();
        tmfDataRetriever.fetchValidSubscriptions(10, product -> {
            if (RelatedPartyUtils.productHasPartyWithRole(product, orgId, Role.BUYER)) {
                activeSubscriptions.add(product);
            }
        });

        logger.debug("Organization {} has {} active subscriptions", orgId, activeSubscriptions.size());

        if (activeSubscriptions.size() >= maxActiveSubscriptions) {
            throw new BadSubscriptionException(
                    "Maximum number of active subscriptions reached: " + maxActiveSubscriptions
            );
        }
    }

}
