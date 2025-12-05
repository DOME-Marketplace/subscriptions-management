package it.eng.dome.subscriptions.management.builder;

import it.eng.dome.tmforum.tmf620.v4.model.ProductOffering;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOfferingPrice;
import it.eng.dome.tmforum.tmf620.v4.model.ProductOfferingPriceRefOrValue;
import it.eng.dome.tmforum.tmf632.v4.model.Organization;
import it.eng.dome.tmforum.tmf637.v4.model.*;
import it.eng.dome.subscriptions.management.exception.BadTmfDataException;
import it.eng.dome.subscriptions.management.exception.ExternalServiceException;
import it.eng.dome.subscriptions.management.service.TMFDataRetriever;
import it.eng.dome.subscriptions.management.utils.TMFUtils;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class ProductBuilder {

    private final TMFDataRetriever tmfDataRetriever;

    public ProductBuilder(TMFDataRetriever retriever) {
        this.tmfDataRetriever = retriever;
    }

    public ProductCreate build(ProductOffering offering,
                               Organization buyer,
                               BillingAccountRef baRef,
                               Double revenueShare)
            throws BadTmfDataException, ExternalServiceException {

        ProductCreate product = new ProductCreate();

        product.setName(buyer.getTradingName() + " subscription to DOME");
        product.setStartDate(OffsetDateTime.now());
        product.setBillingAccount(baRef);
        product.setStatus(ProductStatusType.ACTIVE);

        // --- Characteristics ---
        product.setProductCharacteristic(buildCharacteristics(revenueShare));

        // --- Offering ref ---
        product.setProductOffering(TMFUtils.toProductOfferingRef(offering));

        // --- Prices ---
        product.setProductPrice(buildPrices(offering));

        // --- Related Parties ---
        product.setRelatedParty(buildRelatedParties(offering, buyer));

        return product;
    }

    private List<Characteristic> buildCharacteristics(Double revenueShare) {
        List<Characteristic> chars = new ArrayList<>();

        if (revenueShare != null) {
            Characteristic revenue = new Characteristic();
            revenue.setName("revenuePercentage");
            revenue.setValue(revenueShare);

            Characteristic federated = new Characteristic();
            federated.setName("marketplaceSubscription");
            federated.setValue(true);

            chars.add(revenue);
            chars.add(federated);
        }

        return chars;
    }

    private List<ProductPrice> buildPrices(ProductOffering offering)
            throws BadTmfDataException, ExternalServiceException {

        List<ProductPrice> prices = new ArrayList<>();

        List<ProductOfferingPriceRefOrValue> poPrices = offering.getProductOfferingPrice();
        if (poPrices == null || poPrices.isEmpty()) {
            return prices; // safe fallback
        }

        for (ProductOfferingPriceRefOrValue popRef : poPrices) {
            ProductOfferingPrice fullPop =
                    tmfDataRetriever.getProductOfferingPrice(popRef.getId(), null);

            ProductPrice pp = new ProductPrice();
            pp.setProductOfferingPrice(TMFUtils.toProductOfferingPriceRef(fullPop));

            prices.add(pp);
        }

        return prices;
    }

    private List<RelatedParty> buildRelatedParties(ProductOffering offering, Organization buyer) {
        List<RelatedParty> parties = new ArrayList<>();

        // Buyer
        RelatedParty buyerRP = new RelatedParty();
        buyerRP.setId(buyer.getId());
        buyerRP.setHref(buyer.getHref());
        buyerRP.setName(buyer.getTradingName());
        buyerRP.setRole("Buyer");
        buyerRP.setAtReferredType("organization");

        parties.add(buyerRP);

        // Seller (from offering)
        List<it.eng.dome.tmforum.tmf620.v4.model.RelatedParty> offeringRps = offering.getRelatedParty();
        RelatedParty seller = TMFUtils.getRelatedPartyWithRole(
                TMFUtils.convertRpTo637(offeringRps),
                "Seller"
        );

        if (seller != null) {
            parties.add(seller);
        }

        return parties;
    }
}